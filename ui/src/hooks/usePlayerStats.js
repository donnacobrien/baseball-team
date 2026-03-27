import { useState, useEffect, useCallback } from 'react'

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1'

/**
 * Fetches 2026 season home run totals for a list of players.
 *
 * @param {Array<{ mlbId: number }>} players - Array of player objects with an mlbId field.
 * @returns {{ stats: Object, loading: boolean, error: string|null, refresh: Function }}
 *   - stats: { [mlbId]: homeRuns } map — missing/inactive players default to 0
 *   - loading: true while the fetch is in flight
 *   - error: error message string, or null if no error
 *   - refresh: call to re-fetch
 */
export function usePlayerStats(players) {
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Build a stable comma-separated ID string to use as the dependency.
  const idString = players.map((p) => p.mlbId).join(',')

  const fetchStats = useCallback(async () => {
    if (!idString) {
      setStats({})
      return
    }

    setLoading(true)
    setError(null)

    try {
      const url =
        `${MLB_API_BASE}/people` +
        `?personIds=${idString}` +
        `&hydrate=stats(group=[hitting],type=[season],season=2026)`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`MLB API returned status ${response.status}`)
      }

      const data = await response.json()

      const result = {}

      // Default every requested player to 0 so the UI always has a value.
      idString.split(',').forEach((id) => {
        result[Number(id)] = 0
      })

      if (Array.isArray(data.people)) {
        for (const person of data.people) {
          const mlbId = person.id
          let homeRuns = 0

          if (Array.isArray(person.stats)) {
            for (const statBlock of person.stats) {
              const isSeasonHitting =
                statBlock?.type?.displayName === 'season' &&
                statBlock?.group?.displayName === 'hitting'

              if (isSeasonHitting && Array.isArray(statBlock.splits) && statBlock.splits.length > 0) {
                homeRuns = statBlock.splits[0]?.stat?.homeRuns ?? 0
                break
              }
            }
          }

          result[mlbId] = homeRuns
        }
      }

      setStats(result)
    } catch (err) {
      setError(err.message || 'Failed to fetch player stats')
    } finally {
      setLoading(false)
    }
  }, [idString])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refresh: fetchStats }
}
