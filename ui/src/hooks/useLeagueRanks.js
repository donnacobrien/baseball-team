import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Reads league rank data from the `league_ranks` table (populated hourly by the
 * league-standings edge function). Returns a map of lowercase team name -> rank
 * for the given period (defaults to 'april').
 */
export function useLeagueRanks(period = 'april') {
  const [rankings, setRankings] = useState({})

  useEffect(() => {
    supabase
      .from('league_ranks')
      .select('team_id, rank')
      .eq('period', period)
      .then(({ data }) => {
        if (!data) return
        const map = {}
        for (const row of data) {
          map[row.team_id] = row.rank
        }
        setRankings(map)
      })
  }, [period])

  return rankings
}
