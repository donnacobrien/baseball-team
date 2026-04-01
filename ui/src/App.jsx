import { useState, useMemo, useEffect } from 'react'
import { useTeams } from './hooks/useTeams'
import { usePlayerStats } from './hooks/usePlayerStats'
import { useLiveGames } from './hooks/useLiveGames'
import { useLeagueRanks } from './hooks/useLeagueRanks'
import Leaderboard from './components/Leaderboard'
import TeamCard from './components/TeamCard'
import AddTeamForm from './components/AddTeamForm'
import NotificationPreferences from './components/NotificationPreferences'
import './App.css'

function getAllUniquePlayers(teams) {
  const seen = new Set()
  const players = []
  for (const team of teams) {
    for (const player of team.players) {
      if (!seen.has(player.mlbId)) {
        seen.add(player.mlbId)
        players.push(player)
      }
    }
  }
  return players
}

export default function App() {
  const { teams, saveTeam, loading: teamsLoading, error: teamsError } = useTeams()

  const allPlayers = useMemo(() => getAllUniquePlayers(teams), [teams])
  const { stats, loading: statsLoading, error, refresh } = usePlayerStats(allPlayers)
  const liveTeams = useLiveGames()
  const leagueStandings = useLeagueRanks()

  const loading = teamsLoading || statsLoading

  // view: 'leaderboard' | 'team' | 'add-team' | 'edit-team'
  const [view, setView]               = useState('leaderboard')
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [editingTeam, setEditingTeam]   = useState(null)
  const [lastUpdated, setLastUpdated]   = useState(null)

  function handleRefresh() {
    refresh()
    setLastUpdated(new Date())
  }

  // Set initial lastUpdated timestamp once stats first load
  useEffect(() => {
    if (!statsLoading && !error && lastUpdated === null && Object.keys(stats).length > 0) {
      setLastUpdated(new Date())
    }
  }, [statsLoading, error, stats, lastUpdated])

  function formatTime(date) {
    if (!date) return null
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function handleSelectTeam(team) {
    setSelectedTeam(team)
    setView('team')
  }

  function handleEditTeam(team) {
    setEditingTeam(team)
    setView('edit-team')
  }

  async function handleSaveTeam(team) {
    await saveTeam(team)
    // Keep selected team in sync if we just edited it
    if (selectedTeam?.id === team.id) setSelectedTeam(team)
    setView('leaderboard')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-title-row">
          <div className="app-title-block">
            <h1 className="app-title">O'Brien Luck ⚾</h1>
            <span className="app-subtitle">Home Run Derby | 2026</span>
          </div>
          <div className="header-controls">
            {lastUpdated && (
              <span className="last-updated">Updated: {formatTime(lastUpdated)}</span>
            )}
            <button className="refresh-btn" onClick={handleRefresh} disabled={loading}>
              {statsLoading ? 'Refreshing…' : '↻ Refresh'}
            </button>
            <NotificationPreferences teams={teams} />
          </div>
        </div>
        {teamsError && (
          <div className="error-banner" role="alert">
            ⚠ Database error: {teamsError}
          </div>
        )}
        {error && (
          <div className="error-banner" role="alert">
            ⚠ Could not load stats: {error}. Showing last known data.
          </div>
        )}
      </header>

      <main className="app-main">
        {view === 'team' && selectedTeam && (
          <TeamCard
            team={selectedTeam}
            stats={stats}
            loading={statsLoading}
            liveTeams={liveTeams}
            onBack={() => setView('leaderboard')}
            onEdit={handleEditTeam}
          />
        )}
        {(view === 'add-team' || view === 'edit-team') && (
          <AddTeamForm
            initialTeam={view === 'edit-team' ? editingTeam : null}
            onSave={handleSaveTeam}
            onCancel={() => setView(view === 'edit-team' ? 'team' : 'leaderboard')}
          />
        )}
        {view === 'leaderboard' && (
          <Leaderboard
            teams={teams}
            stats={stats}
            loading={loading}
            liveTeams={liveTeams}
            leagueStandings={leagueStandings}
            onSelectTeam={handleSelectTeam}
            onAddTeam={() => setView('add-team')}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Stats sourced live from the MLB Stats API · 2026 Home Run Derby</p>
      </footer>
    </div>
  )
}
