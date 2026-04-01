// @ts-ignore: Deno types are available at runtime on Supabase
import '@supabase/functions-js/edge-runtime.d.ts'

const STANDINGS_URL = 'https://www.homerunderbyus.com/hrd-april-26.php'

Deno.serve(async () => {
  const res = await fetch(STANDINGS_URL)
  const html = await res.text()

  // Extract ranks in order — each rank cell looks like:
  // <td class='space winner1'>1</td>
  const rankMatches = [...html.matchAll(/<td class='space winner\d+'>\s*(\d+)\s*<\/td>/g)]

  // Extract team names in order — each name cell looks like:
  // <td rowspan=2 class=tname> team name</td>
  const nameMatches = [...html.matchAll(/class=tname>\s*([^<]+?)\s*<\/td>/g)]

  // Zip ranks and names into a lookup map: lowercase team name -> rank
  const standings: Record<string, number> = {}
  const count = Math.min(rankMatches.length, nameMatches.length)
  for (let i = 0; i < count; i++) {
    const name = nameMatches[i][1].trim().toLowerCase()
    const rank = parseInt(rankMatches[i][1])
    standings[name] = rank
  }

  return new Response(JSON.stringify(standings), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
})
