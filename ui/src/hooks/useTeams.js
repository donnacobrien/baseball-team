import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useTeams() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTeams()
  }, [])

  async function fetchTeams() {
    const { data, error } = await supabase.from('teams').select('*')
    if (error) {
      setError(`${error.code}: ${error.message}`)
    } else {
      const loaded = data.map(row => row.data)
      loaded.sort((a, b) => a.teamName.localeCompare(b.teamName))
      setTeams(loaded)
    }
    setLoading(false)
  }

  async function saveTeam(team) {
    const { error } = await supabase
      .from('teams')
      .upsert({ id: team.id, data: team })
    if (error) throw error
    await fetchTeams()
  }

  return { teams, saveTeam, loading, error }
}
