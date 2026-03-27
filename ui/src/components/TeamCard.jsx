import { useState } from 'react'
import { useNextGames } from '../hooks/useNextGames'
import PlayerDetail from './PlayerDetail'

function formatNextGame(game) {
  if (!game) return null
  const { date, time, opponent, isHome } = game
  const [year, month, day] = date.split('-')
  const d = new Date(Number(year), Number(month) - 1, Number(day))
  const dateStr = d.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' })
  const timeStr = time
    ? time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : ''
  return `${isHome ? 'vs' : '@'} ${opponent} · ${dateStr}${timeStr ? ' ' + timeStr : ''}`
}

export default function TeamCard({ team, stats, loading, onBack, onEdit }) {
  const [detailPlayer, setDetailPlayer] = useState(null)
  const { nextGames } = useNextGames(team.players)

  const allLoaded = team.players.every((p) => p.mlbId in stats)

  const ranked = allLoaded
    ? [...team.players].sort((a, b) => (stats[b.mlbId] ?? 0) - (stats[a.mlbId] ?? 0))
    : team.players

  const totalHRs = ranked.slice(0, 7).reduce((sum, p) => sum + (stats[p.mlbId] ?? 0), 0)

  return (
    <div className="team-card">
      <div className="team-card-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="team-title-block">
          <h2 className="team-card-name">{team.teamName}</h2>
          <p className="team-card-owner">Owner: {team.owner}</p>
        </div>
        <button className="edit-team-btn" onClick={() => onEdit(team)}>✎ Edit</button>
      </div>

      {loading && (
        <div className="loading-bar">
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-label">Fetching live stats…</span>
        </div>
      )}

      <p className="double-click-hint">Double-click a player name to see their HR log.</p>

      <div className="player-table-wrapper">
        <table className="player-table">
          <thead>
            <tr>
              <th className="col-rank">#</th>
              <th className="col-player-name">Player</th>
              <th className="col-mlb-team">MLB Team</th>
              <th className="col-cost">Cost</th>
              <th className="col-live-hrs">2026 HRs</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((player, i) => {
              const counting = i < 7
              const nextGame = nextGames[player.mlbId]
              const nextGameStr = formatNextGame(nextGame)
              return (
                <tr key={player.mlbId} className={counting ? 'player-row' : 'player-row not-counting'}>
                  <td className="col-rank">{i + 1}</td>
                  <td className="col-player-name">
                    <span
                      className="player-name-link"
                      onDoubleClick={() => setDetailPlayer(player)}
                      title="Double-click for HR log"
                    >
                      {player.name}
                    </span>
                    {nextGameStr && (
                      <span className="next-game-label">{nextGameStr}</span>
                    )}
                  </td>
                  <td className="col-mlb-team">
                    <span className="team-chip">{player.mlbTeam}</span>
                  </td>
                  <td className="col-cost">{player.cost}</td>
                  <td className="col-live-hrs">
                    {!(player.mlbId in stats)
                      ? <span className="stat-dash">—</span>
                      : <span className={counting ? 'hr-count' : ''}>{stats[player.mlbId]}</span>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <td colSpan={4} className="totals-label">Top 7 Total</td>
              <td className="col-live-hrs totals-value">
                {allLoaded
                  ? <span className="hr-count">{totalHRs}</span>
                  : <span className="stat-dash">—</span>
                }
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {detailPlayer && (
        <PlayerDetail
          player={detailPlayer}
          onClose={() => setDetailPlayer(null)}
        />
      )}
    </div>
  )
}
