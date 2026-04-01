// @ts-ignore: Deno types available at runtime
import '@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STANDINGS_URL = 'https://www.homerunderbyus.com/hrd-april-26.php'
const PERIOD = 'april'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Fetch and parse the standings page
  const res = await fetch(STANDINGS_URL)
  const html = await res.text()

  const rankMatches    = [...html.matchAll(/<td class='space winner\d+'>\s*(\d+)\s*<\/td>/g)]
  const nameMatches    = [...html.matchAll(/class=tname>\s*([^<]+?)\s*<\/td>/g)]
  const payoutMatches  = [...html.matchAll(/<td class='spacecode winner\d+'>\s*(\d+)\s*<\/td>/g)]

  // Build map: lowercase team name -> { rank, payout }
  // payoutMatches come in pairs per team: [HRs, payout], so payout is at index i*2+1
  const scraped: Record<string, { rank: number; payout: number }> = {}
  const count = Math.min(rankMatches.length, nameMatches.length)
  for (let i = 0; i < count; i++) {
    const name   = nameMatches[i][1].trim().toLowerCase()
    const rank   = parseInt(rankMatches[i][1])
    const payout = payoutMatches[i * 2 + 1] ? parseInt(payoutMatches[i * 2 + 1][1]) : 0
    scraped[name] = { rank, payout }
  }

  // Load all family teams from Supabase and match by team name
  const { data: teamRows } = await supabase.from('teams').select('id, data')

  const upserts = []
  for (const row of teamRows ?? []) {
    const key = row.data.teamName.toLowerCase().trim()
    const match = scraped[key]
    if (match) {
      upserts.push({
        team_id: row.id,
        period: PERIOD,
        rank: match.rank,
        payout: match.payout,
        updated_at: new Date().toISOString(),
      })
    }
  }

  if (upserts.length > 0) {
    await supabase.from('league_ranks').upsert(upserts)
  }

  return new Response(
    JSON.stringify({ scraped: count, matched: upserts.length, upserts }),
    { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
  )
})
