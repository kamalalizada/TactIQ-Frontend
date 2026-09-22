import type { StandingsRow } from '@/types'

export function StandingsTable({
  rows,
  userTeamId,
}: {
  rows: StandingsRow[]
  userTeamId?: string | null
}) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead className="border-b border-white/10 text-xs text-slate-400 uppercase">
          <tr>
            <th className="px-3 py-2.5 text-left font-medium">#</th>
            <th className="px-3 py-2.5 text-left font-medium">Team</th>
            {['P', 'W', 'D', 'L', 'GF', 'GA', 'GD'].map((h) => (
              <th key={h} className="px-2 py-2.5 text-right font-medium">
                {h}
              </th>
            ))}
            <th className="px-3 py-2.5 text-right font-medium text-slate-200">Pts</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const isUser = row.teamId === userTeamId

            return (
              <tr
                key={row.teamId}
                className={`border-b border-white/5 last:border-0 ${
                  isUser ? 'bg-lime-400/10' : 'hover:bg-white/5'
                }`}
              >
                <td className="px-3 py-2 text-slate-400">{row.rank}</td>
                <td className={`px-3 py-2 font-medium ${isUser ? 'text-lime-300' : ''}`}>
                  {row.teamName}
                </td>
                <td className="px-2 py-2 text-right text-slate-400">{row.played}</td>
                <td className="px-2 py-2 text-right">{row.won}</td>
                <td className="px-2 py-2 text-right">{row.drawn}</td>
                <td className="px-2 py-2 text-right">{row.lost}</td>
                <td className="px-2 py-2 text-right text-slate-400">{row.goalsFor}</td>
                <td className="px-2 py-2 text-right text-slate-400">{row.goalsAgainst}</td>
                <td className="px-2 py-2 text-right text-slate-400">
                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </td>
                <td className="px-3 py-2 text-right font-bold">{row.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
