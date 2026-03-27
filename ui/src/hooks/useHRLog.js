import { useState, useEffect } from 'react'

const MLB_API = 'https://statsapi.mlb.com/api/v1'

// The gameLog API returns opponent.name but not opponent.abbreviation
const TEAM_ABBREV = {
  108: 'LAA', 109: 'ARI', 110: 'BAL', 111: 'BOS', 112: 'CHC',
  113: 'CIN', 114: 'CLE', 115: 'COL', 116: 'DET', 117: 'HOU',
  118: 'KC',  119: 'LAD', 120: 'WSH', 121: 'NYM', 133: 'OAK',
  134: 'PIT', 135: 'SD',  136: 'SEA', 137: 'SF',  138: 'STL',
  139: 'TB',  140: 'TEX', 141: 'TOR', 142: 'MIN', 143: 'PHI',
  144: 'ATL', 145: 'CWS', 146: 'MIA', 147: 'NYY', 158: 'MIL',
}

function teamAbbrev(opponentObj) {
  if (!opponentObj) return '???'
  if (opponentObj.abbreviation) return opponentObj.abbreviation
  if (TEAM_ABBREV[opponentObj.id]) return TEAM_ABBREV[opponentObj.id]
  // last word of team name as fallback (e.g. "Baltimore Orioles" → "Orioles")
  return opponentObj.name?.split(' ').pop() ?? '???'
}

/**
 * Fetches the 2026 game-by-game HR log for a single player.
 * Returns { hrGames: [{ date, opponent, isHome, count }], loading }
 * Only includes games where homeRuns > 0.
 */
export function useHRLog(mlbId) {
  const [hrGames, setHrGames] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!mlbId) return
    let cancelled = false

    async function fetch_() {
      setLoading(true)
      try {
        const res = await fetch(
          `${MLB_API}/people/${mlbId}/stats` +
          `?stats=gameLog&group=hitting&season=2026`
        )
        const data = await res.json()

        if (cancelled) return

        const games = []
        for (const statBlock of data.stats || []) {
          for (const split of statBlock.splits || []) {
            const hrs = split.stat?.homeRuns ?? 0
            if (hrs > 0) {
              games.push({
                date: split.date,
                opponent: teamAbbrev(split.opponent),
                isHome: split.isHome ?? true,
                count: hrs,
              })
            }
          }
        }
        // Chronological order (API returns newest-first sometimes)
        games.sort((a, b) => a.date.localeCompare(b.date))
        setHrGames(games)
      } catch {
        setHrGames([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch_()
    return () => { cancelled = true }
  }, [mlbId])

  return { hrGames, loading }
}
