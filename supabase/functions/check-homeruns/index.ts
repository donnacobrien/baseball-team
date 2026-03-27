import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MLB_API = 'https://statsapi.mlb.com/api/v1'
const ONESIGNAL_API = 'https://onesignal.com/api/v1/notifications'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // 1. Load all teams and collect unique players
  const { data: teamRows, error: teamsError } = await supabase.from('teams').select('data')
  if (teamsError) return new Response(`Teams error: ${teamsError.message}`, { status: 500 })

  const players = new Map<number, string>() // mlbId -> name
  for (const row of teamRows ?? []) {
    for (const player of row.data.players) {
      if (!players.has(player.mlbId)) {
        players.set(player.mlbId, player.name)
      }
    }
  }

  if (players.size === 0) return new Response('No players found')

  // 2. Fetch current 2026 HR totals from MLB Stats API
  const ids = [...players.keys()].join(',')
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

  // 4. Detect new home runs since last check
  const newHREvents: { name: string; newCount: number; total: number }[] = []
  const updates: { mlb_id: number; home_runs: number; updated_at: string }[] = []

  for (const [mlbId, name] of players) {
    const current = currentHRs.get(mlbId) ?? 0
    const previous = snapshotMap.get(mlbId) ?? 0

    if (current > previous) {
      newHREvents.push({ name, newCount: current - previous, total: current })
    }

    updates.push({ mlb_id: mlbId, home_runs: current, updated_at: new Date().toISOString() })
  }

  // 5. Send a push notification for each new HR event
  const appId = Deno.env.get('ONESIGNAL_APP_ID')
  const apiKey = Deno.env.get('ONESIGNAL_REST_API_KEY')

  for (const { name, newCount, total } of newHREvents) {
    const plural = newCount > 1
    await fetch(ONESIGNAL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        included_segments: ['Total Subscriptions'],
        headings: { en: '⚾ Home Run!' },
        contents: {
          en: `${name} hit ${plural ? `${newCount} home runs` : 'a home run'}! (${total} total in 2026)`,
        },
      }),
    })
  }

  // 6. Update snapshots with latest totals
  if (updates.length > 0) {
    await supabase.from('hr_snapshots').upsert(updates)
  }

  return new Response(
    JSON.stringify({ checked: players.size, notified: newHREvents.length, events: newHREvents }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
