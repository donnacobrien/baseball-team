import { useState, useEffect } from 'react'

const MLB_API = 'https://statsapi.mlb.com/api/v1'

// Maps MLB team ID -> abbreviation for live game detection
const TEAM_ABBREV = {
  108: 'LAA', 109: 'ARI', 110: 'BAL', 111: 'BOS', 112: 'CHC',
  113: 'CIN', 114: 'CLE', 115: 'COL', 116: 'DET', 117: 'HOU',
  118: 'KC',  119: 'LAD', 120: 'WSH', 121: 'NYM', 133: 'OAK',
  134: 'PIT', 135: 'SD',  136: 'SEA', 137: 'SF',  138: 'STL',
  139: 'TB',  140: 'TEX', 141: 'TOR', 142: 'MIN', 143: 'PHI',
  144: 'ATL', 145: 'CWS', 146: 'MIA', 147: 'NYY', 158: 'MIL',
}

/**
 * Polls today's MLB schedule every 60 seconds.
 * Returns a Set of team abbreviations currently in a live game.
 */
export function useLiveGames() {
  const [liveTeams, setLiveTeams] = useState(new Set())

  useEffect(() => {
    async function check() {
      try {
        const today = new Date().toISOString().slice(0, 10)
        const res = await fetch(`${MLB_API}/schedule?sportId=1&date=${today}`)
        const data = await res.json()

        const live = new Set()
        for (const date of data.dates ?? []) {
          for (const game of date.games ?? []) {
            if (game.status?.abstractGameState === 'Live') {
              const homeId = game.teams?.home?.team?.id
              const awayId = game.teams?.away?.team?.id
              if (TEAM_ABBREV[homeId]) live.add(TEAM_ABBREV[homeId])
              if (TEAM_ABBREV[awayId]) live.add(TEAM_ABBREV[awayId])
            }
          }
        }
        setLiveTeams(live)
      } catch {
        // non-fatal — live indicator is best-effort
      }
    }

    check()
    const interval = setInterval(check, 60_000)
    return () => clearInterval(interval)
  }, [])

  return liveTeams
}
