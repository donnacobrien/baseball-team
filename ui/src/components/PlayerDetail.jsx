import { useHRLog } from '../hooks/useHRLog'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  const d = new Date(Number(year), Number(month) - 1, Number(day))
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function PlayerDetail({ player, onClose }) {
  const { hrGames, loading } = useHRLog(player.mlbId)

  const totalFromLog = hrGames.reduce((sum, g) => sum + g.count, 0)

  return (
    <div className="player-detail-overlay" onClick={onClose}>
      <div className="player-detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="player-detail-header">
          <div>
            <h3 className="player-detail-name">{player.name}</h3>
            <span className="team-chip">{player.mlbTeam}</span>
          </div>
          <button className="detail-close-btn" onClick={onClose}>✕</button>
        </div>

        <h4 className="hr-log-title">Home Run Log</h4>

        {loading && (
          <div className="loading-bar">
            <span className="loading-dot" />
            <span className="loading-dot" />
            <span className="loading-dot" />
            <span className="loading-label">Loading…</span>
          </div>
        )}

        {!loading && hrGames.length === 0 && (
          <p className="empty-state">No home runs yet this season.</p>
        )}

        {!loading && hrGames.length > 0 && (
          <table className="hr-log-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Matchup</th>
                <th className="col-live-hrs">HRs</th>
              </tr>
            </thead>
            <tbody>
              {hrGames.map((game, i) => (
                <tr key={i} className="player-row">
                  <td>{formatDate(game.date)}</td>
                  <td>
                    <span className="matchup-label">
                      {game.isHome ? 'vs' : '@'}{' '}
                      <span className="team-chip">{game.opponent}</span>
                    </span>
                  </td>
                  <td className="col-live-hrs">
                    <span className="hr-count">{game.count}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="totals-row">
                <td colSpan={2} className="totals-label">Season Total</td>
                <td className="col-live-hrs totals-value">
                  <span className="hr-count">{totalFromLog}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
