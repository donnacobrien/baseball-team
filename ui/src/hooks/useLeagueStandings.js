import { useState, useEffect } from 'react'

const EDGE_FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/league-standings`

/**
 * Fetches April league standings from the edge function.
 * Returns a map of lowercase team name -> league rank.
 */
export function useLeagueStandings() {
  const [standings, setStandings] = useState({})

  useEffect(() => {
    fetch(EDGE_FN, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    })
      .then(r => r.json())
      .then(setStandings)
      .catch(() => {})
  }, [])

  return standings
}
