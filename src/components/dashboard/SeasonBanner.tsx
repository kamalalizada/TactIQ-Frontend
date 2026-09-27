import { Link } from 'react-router-dom'

import type { StandingsRow } from '@/types'

interface SeasonBannerProps {
  champion: StandingsRow | undefined
  cupStarted: boolean
  seasonId: string
}

export function SeasonBanner({ champion, cupStarted, seasonId }: SeasonBannerProps) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-win/30 bg-win/10 p-4">
      <div>
        <p className="font-bold text-win">Season complete 🏆</p>
        <p className="mt-0.5 text-sm">
          Champion: <span className="font-semibold">{champion?.teamName ?? '—'}</span>
          {champion && <span className="text-muted"> · {champion.points} pts</span>}
        </p>
      </div>
      {!cupStarted && (
        <Link to={`/seasons/${seasonId}/cup`} className="btn-primary">
          Start the cup
        </Link>
      )}
    </div>
  )
}
