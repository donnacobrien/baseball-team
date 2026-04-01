function teamTotal(team, stats) {
  if (!team.players.every((p) => p.mlbId in stats)) return null
  return [...team.players]
    .sort((a, b) => (stats[b.mlbId] ?? 0) - (stats[a.mlbId] ?? 0))
    .slice(0, 7)
    .reduce((sum, p) => sum + (stats[p.mlbId] ?? 0), 0)
}

export default function Leaderboard({ teams, stats, loading, liveTeams = new Set(), leagueStandings = {}, onSelectTeam, onAddTeam }) {
  const sorted = [...teams].sort((a, b) => {
    const aTotal = teamTotal(a, stats)
    const bTotal = teamTotal(b, stats)
    if (aTotal === null && bTotal === null) return 0
    if (aTotal === null) return 1
    if (bTotal === null) return -1
    return bTotal - aTotal
  })

  return (
    <div className="leaderboard">
      <div className="leaderboard-title-row">
        <h2 className="section-title">Team Standings</h2>
        <button className="add-team-btn" onClick={onAddTeam}>+ Add Team</button>
      </div>

      {loading && (
        <div className="loading-bar">
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-label">Fetching live stats…</span>
        </div>
      )}

      <div className="leaderboard-table-wrapper">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th className="col-team">Team</th>
              <th className="col-owner">Owner</th>
              <th className="col-league-rank" title="April league rank from homerunderbyus.com">April</th>
              <th className="col-hrs">HRs</th>
              <th className="col-chevron"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((team) => {
              const total = teamTotal(team, stats)
              const isLive = team.players.some(p => liveTeams.has(p.mlbTeam))
              const leagueRank = leagueStandings[team.teamName.toLowerCase().trim()]
              return (
                <tr
                  key={team.id}
                  className="leaderboard-row"
                  onClick={() => onSelectTeam(team)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onSelectTeam(team)
                  }}
                >
                  <td className="col-team">
                    <span className={isLive ? 'status-dot live' : 'status-dot inactive'} />
                    {team.teamName}
                  </td>
                  <td className="col-owner">{team.owner}</td>
                  <td className="col-league-rank">
                    {leagueRank != null
                      ? <span className="rank-badge">{leagueRank}</span>
                      : <span className="stat-dash">—</span>}
                  </td>
                  <td className="col-hrs">
                    {total === null
                      ? <span className="stat-dash">—</span>
                      : <span className="hr-count">{total}</span>}
                  </td>
                  <td className="col-chevron">
                    <span className="chevron">›</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {teams.length === 0 && (
        <p className="empty-state">No teams yet. Add one above!</p>
      )}
    </div>
  )
}
