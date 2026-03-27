import { useState, useEffect } from 'react'
import { collection, doc, setDoc, getDocs, getDocsFromServer, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useTeams() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Force server fetch — bypasses cache entirely
    getDocsFromServer(collection(db, 'teams'))
      .then(snap => console.log('[fromServer] size:', snap.size))
      .catch(e => console.error('[fromServer] error:', e.code, e.message))

    const unsub = onSnapshot(
      collection(db, 'teams'),
      (snapshot) => {
        console.log('[onSnapshot] size:', snapshot.size, 'fromCache:', snapshot.metadata.fromCache)
        const loaded = snapshot.docs.map((d) => d.data())
        loaded.sort((a, b) => a.teamName.localeCompare(b.teamName))
        setTeams(loaded)
        setLoading(false)
      },
      (err) => {
        setError(`${err.code}: ${err.message}`)
        setLoading(false)
      }
    )
    return unsub
  }, [])

  async function saveTeam(team) {
    await setDoc(doc(db, 'teams', team.id), team)
  }

  return { teams, saveTeam, loading, error }
}
