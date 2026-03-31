import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MLB_API = 'https://statsapi.mlb.com/api/v1'
const ONESIGNAL_API = 'https://onesignal.com/api/v1/notifications'

async function sendNotification(appId: string, apiKey: string, targetTag: string, heading: string, message: string) {
  await fetch(ONESIGNAL_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      // Target subscribers tagged with this team_id value
      filters: [{ field: 'tag', key: 'team_id', relation: '=', value: targetTag }],
      headings: { en: heading },
      contents: { en: message },
    }),
  })
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // 1. Load all teams and build player -> teams mapping
  const { data: teamRows, error: teamsError } = await supabase.from('teams').select('data')
  if (teamsError) return new Response(`Teams error: ${teamsError.message}`, { status: 500 })

  // Map mlbId -> { name, teams: [{id, teamName}] }
  const playerMap = new Map<number, { name: string; teams: { id: string; teamName: string }[] }>()
  for (const row of teamRows ?? []) {
    const team = row.data
    for (const player of team.players) {
      if (!playerMap.has(player.mlbId)) {
        playerMap.set(player.mlbId, { name: player.name, teams: [] })
      }
      playerMap.get(player.mlbId)!.teams.push({ id: team.id, teamName: team.teamName })
    }
  }

  if (playerMap.size === 0) return new Response('No players found')

  // 2. Fetch current 2026 HR totals from MLB Stats API
  const ids = [...playerMap.keys()].join(',')
  const mlbRes = await fetch(
    `${MLB_API}/people?personIds=${ids}&hydrate=stats(group=[hitting],type=[season],season=2026)`
  )
  const mlbData = await mlbRes.json()

  const currentHRs = new Map<number, number>()
  for (const person of mlbData.people ?? []) {
    const hrs = person.stats?.[0]?.splits?.[0]?.stat?.homeRuns ?? 0
    currentHRs.set(person.id, hrs)
  }

  // 3. Load stored HR snapshots to compare against
  const { data: snapshots } = await supabase.from('hr_snapshots').select('*')
  const snapshotMap = new Map<number, number>(
    snapshots?.map((s: { mlb_id: number; home_runs: number }) => [s.mlb_id, s.home_runs]) ?? []
  )

  // 4. Detect new home runs
  const newHREvents: { mlbId: number; name: string; newCount: number; total: number; teams: { id: string; teamName: string }[] }[] = []
  const updates: { mlb_id: number; home_runs: number; updated_at: string }[] = []

  for (const [mlbId, { name, teams }] of playerMap) {
    const current = currentHRs.get(mlbId) ?? 0
    const previous = snapshotMap.get(mlbId) ?? 0

    if (current > previous) {
      newHREvents.push({ mlbId, name, newCount: current - previous, total: current, teams })
    }

    updates.push({ mlb_id: mlbId, home_runs: current, updated_at: new Date().toISOString() })
  }

  // 5. Send targeted push notifications
  const appId = Deno.env.get('ONESIGNAL_APP_ID')!
  const apiKey = Deno.env.get('ONESIGNAL_REST_API_KEY')!

  for (const { name, newCount, total, teams } of newHREvents) {
    const plural = newCount > 1
    const hrWord = plural ? `${newCount} home runs` : 'a home run'
    const teamLabels = teams.map(t => t.teamName).join(' & ')

    // "All Teams" subscribers get team attribution in the message
    await sendNotification(
      appId, apiKey, 'all',
      '⚾ Home Run!',
      `${name} hit ${hrWord}! (${total} in 2026) — on ${teamLabels}`
    )

    // Each team's subscribers get a personalized message
    for (const team of teams) {
      await sendNotification(
        appId, apiKey, team.id,
        '⚾ Your team just went yard!',
        `${name} hit ${hrWord}! ${total} total HRs in 2026.`
      )
    }
  }

  // 6. Update snapshots with latest totals
  if (updates.length > 0) {
    await supabase.from('hr_snapshots').upsert(updates)
  }

  return new Response(
    JSON.stringify({ checked: playerMap.size, notified: newHREvents.length, events: newHREvents }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
