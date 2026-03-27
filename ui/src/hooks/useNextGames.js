import { useState, useEffect } from 'react'

const MLB_API = 'https://statsapi.mlb.com/api/v1'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function twoWeeksOut() {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().slice(0, 10)
}

/**
 * For a list of mlbIds, fetches each player's current team then finds
 * their next scheduled game.
 *
 * Returns { nextGames: { [mlbId]: { date, time, opponent, isHome } }, loading }
 */
export function useNextGames(players) {
  const [nextGames, setNextGames] = useState({})
  const [loading, setLoading] = useState(false)

  const idString = players.map((p) => p.mlbId).join(',')

  useEffect(() => {
    if (!idString) return

    async function fetch_() {
      setLoading(true)
      try {
        // Step 1: get current team for each player
        const peopleRes = await fetch(
          `${MLB_API}/people?personIds=${idString}&hydrate=currentTeam`
        )
        const peopleData = await peopleRes.json()

        // Build mlbId -> teamId map
        const playerTeam = {}
        const teamIds = new Set()
        for (const person of peopleData.people || []) {
          const teamId = person.currentTeam?.id
          if (teamId) {
            playerTeam[person.id] = teamId
            teamIds.add(teamId)
          }
        }

        if (teamIds.size === 0) return

        // Step 2: fetch schedule for all unique teams
        const schedRes = await fetch(
          `${MLB_API}/schedule?sportId=1` +
          `&teamIds=${[...teamIds].join(',')}` +
          `&startDate=${todayStr()}&endDate=${twoWeeksOut()}` +
          `&hydrate=team`
        )
        const schedData = await schedRes.json()

        // Build teamId -> next game map
        const teamNextGame = {}
        for (const dateEntry of schedData.dates || []) {
          for (const game of dateEntry.games || []) {
            const homeId = game.teams?.home?.team?.id
            const awayId = game.teams?.away?.team?.id
            const gameTime = game.gameDate ? new Date(game.gameDate) : null

            for (const tid of [homeId, awayId]) {
              if (!tid || teamNextGame[tid]) continue // already have earliest game
              const isHome = tid === homeId
              const opponent = isHome
                ? game.teams?.away?.team?.abbreviation
                : game.teams?.home?.team?.abbreviation
              teamNextGame[tid] = { date: dateEntry.date, time: gameTime, opponent, isHome }
            }
          }
        }

        // Build mlbId -> next game
        const result = {}
        for (const [mlbId, teamId] of Object.entries(playerTeam)) {
          if (teamNextGame[teamId]) result[Number(mlbId)] = teamNextGame[teamId]
        }
        setNextGames(result)
      } catch {
        // non-fatal — next game info is best-effort
      } finally {
        setLoading(false)
      }
    }

    fetch_()
  }, [idString])

  return { nextGames, loading }
}
