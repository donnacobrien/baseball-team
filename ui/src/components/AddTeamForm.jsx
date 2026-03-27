import { useState, useRef, useEffect } from 'react'
import { usePlayerSearch } from '../hooks/usePlayerSearch'

const MLB_API = 'https://statsapi.mlb.com/api/v1'

const TEAM_ABBREV = {
  108: 'LAA', 109: 'ARI', 110: 'BAL', 111: 'BOS', 112: 'CHC',
  113: 'CIN', 114: 'CLE', 115: 'COL', 116: 'DET', 117: 'HOU',
  118: 'KC',  119: 'LAD', 120: 'WSH', 121: 'NYM', 133: 'OAK',
  134: 'PIT', 135: 'SD',  136: 'SEA', 137: 'SF',  138: 'STL',
  139: 'TB',  140: 'TEX', 141: 'TOR', 142: 'MIN', 143: 'PHI',
  144: 'ATL', 145: 'CWS', 146: 'MIA', 147: 'NYY', 158: 'MIL',
}

const EMPTY_PLAYER = { name: '', mlbTeam: '', cost: '', mlbId: null }
const NUM_PLAYERS = 8

/**
 * Autocomplete input for a single player slot.
 * Calls onChange({ name, mlbId }) when a player is selected from results.
 */
function PlayerSearchInput({ index, player, onChange }) {
  const [query, setQuery] = useState(player.name)
  const [open, setOpen] = useState(false)
  const { results, searching } = usePlayerSearch(open ? query : '')
  const wrapperRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleInput(e) {
    const val = e.target.value
    setQuery(val)
    setOpen(true)
    // Clear selection if user edits after picking
    if (player.mlbId) onChange({ name: val, mlbId: null })
  }

  async function handleSelect(person) {
    setQuery(person.fullName)
    setOpen(false)

    const teamId = person.currentTeam?.id
    const mlbTeam = person.currentTeam?.abbreviation ?? TEAM_ABBREV[teamId] ?? ''

    // Fill name + team immediately
    onChange({ name: person.fullName, mlbId: person.id, mlbTeam, cost: '' })

    // Fetch 2025 HR total to auto-fill cost
    try {
      const res = await fetch(
        `${MLB_API}/people/${person.id}/stats?stats=season&group=hitting&season=2025`
      )
      const data = await res.json()
      const hrs = data.stats?.[0]?.splits?.[0]?.stat?.homeRuns ?? ''
      onChange({ name: person.fullName, mlbId: person.id, mlbTeam, cost: hrs })
    } catch {
      // leave cost blank for manual entry
    }
  }

  const showDropdown = open && query.trim().length >= 2

  return (
    <div className="player-search-wrap" ref={wrapperRef}>
      <input
        className={`form-input player-name-input ${player.mlbId ? 'resolved' : ''}`}
        type="text"
        placeholder="Search player name…"
        value={query}
        onChange={handleInput}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {player.mlbId && <span className="resolved-check" title="Player found">✓</span>}
      {showDropdown && (
        <ul className="player-dropdown">
          {searching && <li className="dropdown-hint">Searching…</li>}
          {!searching && results.length === 0 && (
            <li className="dropdown-hint">No results</li>
          )}
          {results.map((p) => (
            <li
              key={p.id}
              className="dropdown-item"
              onMouseDown={() => handleSelect(p)}
            >
              {p.fullName}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function AddTeamForm({ initialTeam, onSave, onCancel }) {
  const isEditing = Boolean(initialTeam)
  const [teamName, setTeamName] = useState(initialTeam?.teamName ?? '')
  const [owner, setOwner] = useState(initialTeam?.owner ?? '')
  const [players, setPlayers] = useState(() =>
    initialTeam
      ? initialTeam.players.map(p => ({ ...p, cost: String(p.cost) }))
      : Array(NUM_PLAYERS).fill(null).map(() => ({ ...EMPTY_PLAYER }))
  )
  const [error, setError] = useState('')

  function updatePlayer(i, patch) {
    setPlayers((prev) => prev.map((p, idx) => idx === i ? { ...p, ...patch } : p))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!teamName.trim()) return setError('Team name is required.')
    if (!owner.trim()) return setError('Owner name is required.')

    const filledPlayers = players.filter((p) => p.name.trim())
    if (filledPlayers.length < 8) return setError('All 8 player slots are required.')
    if (filledPlayers.some((p) => !p.mlbId)) {
      return setError('Select each player from the search dropdown so we can track their stats.')
    }
    if (filledPlayers.some((p) => !p.cost || isNaN(Number(p.cost)) || Number(p.cost) < 1)) {
      return setError('Enter a valid 2025 HR cost for each player.')
    }

    const team = {
      id: initialTeam?.id ?? owner.trim().toLowerCase().replace(/\s+/g, '-'),
      teamName: teamName.trim(),
      owner: owner.trim(),
      players: filledPlayers.map((p) => ({
        name: p.name,
        mlbTeam: p.mlbTeam.trim().toUpperCase() || '???',
        cost: Number(p.cost),
        mlbId: p.mlbId,
      })),
    }
    onSave(team)
  }

  return (
    <div className="add-team-form-wrapper">
      <div className="add-team-header">
        <button className="back-btn" onClick={onCancel}>← Back</button>
        <h2 className="add-team-title">{isEditing ? 'Edit Team' : 'Add Your Team'}</h2>
      </div>

      <form className="add-team-form" onSubmit={handleSubmit}>
        <div className="form-row two-col">
          <div className="form-group">
            <label className="form-label">Team Name</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. The Dingers"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Owner</label>
            <input
              className="form-input"
              type="text"
              placeholder="Your name"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>
        </div>

        <div className="players-section">
          <div className="players-header-row">
            <span className="players-col-label">#</span>
            <span className="players-col-label player-col">Player</span>
            <span className="players-col-label team-col">MLB Team</span>
            <span className="players-col-label cost-col">2025 HRs (cost)</span>
          </div>

          {players.map((player, i) => (
            <div key={i} className="player-slot">
              <span className="slot-num">{i + 1}</span>
              <PlayerSearchInput
                index={i}
                player={player}
                onChange={(patch) => updatePlayer(i, patch)}
              />
              <input
                className="form-input team-abbr-input"
                type="text"
                placeholder="NYY"
                maxLength={4}
                value={player.mlbTeam}
                onChange={(e) => updatePlayer(i, { mlbTeam: e.target.value })}
              />
              <input
                className="form-input cost-input"
                type="number"
                min="1"
                max="99"
                placeholder="0"
                value={player.cost}
                onChange={(e) => updatePlayer(i, { cost: e.target.value })}
              />
            </div>
          ))}
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="back-btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="refresh-btn">{isEditing ? 'Save Changes' : 'Save Team'}</button>
        </div>
      </form>
    </div>
  )
}
