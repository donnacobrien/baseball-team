import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Fetches and manages team data from Supabase.
 *
 * Teams are stored as { id, data } rows where `data` is the full team object.
 * Returns teams sorted alphabetically by teamName.
 */
export function useTeams() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTeams = useCallback(async () => {
    const { data, error } = await supabase.from('teams').select('*')
    if (error) {
      setError(`${error.code}: ${error.message}`)
    } else {
      const loaded = data.map(row => row.data)
      loaded.sort((a, b) => a.teamName.localeCompare(b.teamName))
      setTeams(loaded)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  async function saveTeam(team) {
    const { error } = await supabase
      .from('teams')
      .upsert({ id: team.id, data: team })
    if (error) throw error
    await fetchTeams()
  }

  return { teams, saveTeam, loading, error }
}
