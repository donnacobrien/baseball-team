import { useState, useEffect } from 'react'

/**
 * Debounced search against the MLB people/search API.
 * Returns matching players with their id and fullName.
 */
export function usePlayerSearch(query) {
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(query.trim())}&sportIds=1&hydrate=currentTeam`
        )
        const data = await res.json()
        setResults(data.people || [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  return { results, searching }
}
