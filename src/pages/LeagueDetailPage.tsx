import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { leagueApi } from '@/api/endpoints'
import { Shell } from '@/components/Shell'
import { StandingsTable } from '@/components/StandingsTable'
import { EmptyNote, ErrorNote, Spinner } from '@/components/States'
import { GameMode, type Match } from '@/types'

export function LeagueDetailPage() {
  const { leagueId = '' } = useParams()
  const queryClient = useQueryClient()

  const league = useQuery({
    queryKey: ['league', leagueId],
    queryFn: () => leagueApi.get(leagueId),
  })

  const standings = useQuery({
    queryKey: ['standings', leagueId],
    queryFn: () => leagueApi.standings(leagueId),
  })

  const week = league.data?.currentWeek
  const fixtures = useQuery({
    queryKey: ['fixtures', leagueId, week],
    queryFn: () => leagueApi.fixtures(leagueId, week),
    enabled: week !== undefined,
  })

  const simulate = useMutation({
    mutationFn: () => leagueApi.simulateWeek(leagueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['league', leagueId] })
      queryClient.invalidateQueries({ queryKey: ['standings', leagueId] })
      queryClient.invalidateQueries({ queryKey: ['fixtures', leagueId] })
    },
  })

  if (league.isPending) {
    return (
      <Shell>
        <Spinner />
      </Shell>
    )
  }

  if (league.isError) {
    return (
      <Shell>
        <ErrorNote error={league.error} />
      </Shell>
    )
  }

  const data = league.data!
  const pendingUserMatch = fixtures.data?.find((match) => match.isUserMatch && !match.isPlayed)

  return (
    <Shell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/" className="text-xs text-slate-400 hover:text-lime-400">
            ← Bütün mövsümlər
          </Link>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">{data.seasonName}</h2>
          <p className="text-sm text-slate-400">
            {data.gameMode === GameMode.ManagerMode ? 'Manager Mode' : 'God Mode'} ·{' '}
            {data.isFinished
              ? 'Mövsüm bitdi'
              : `Həftə ${data.currentWeek} / ${data.totalWeeks}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/leagues/${leagueId}/teams`} className="btn-ghost">
            Komandalar
          </Link>

          {!data.isFinished && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => simulate.mutate()}
              // The week cannot advance until the manager plays their own match.
              disabled={simulate.isPending || Boolean(pendingUserMatch)}
              title={pendingUserMatch ? 'Əvvəlcə öz matçını oyna' : undefined}
            >
              {simulate.isPending ? 'Simulyasiya…' : `Həftə ${data.currentWeek} simulyasiya et`}
            </button>
          )}
        </div>
      </div>

      {data.isFinished && (
        <div className="card mb-6 border-lime-400/30 bg-lime-400/5 text-center">
          <p className="font-semibold text-lime-300">Mövsüm başa çatdı 🏆</p>
          <p className="mt-1 text-sm text-slate-400">
            Çempion: {standings.data?.[0]?.teamName ?? '—'}
          </p>
        </div>
      )}

      {simulate.isError && (
        <div className="mb-4">
          <ErrorNote error={simulate.error} />
        </div>
      )}

      {pendingUserMatch && (
        <div className="card mb-6 flex flex-wrap items-center justify-between gap-4 border-lime-400/30 bg-lime-400/5">
          <div>
            <p className="text-xs tracking-wide text-lime-400 uppercase">Matçın səni gözləyir</p>
            <p className="mt-1 font-semibold">
              {pendingUserMatch.homeTeamName} vs {pendingUserMatch.awayTeamName}
            </p>
          </div>
          <Link to={`/matches/${pendingUserMatch.id}`} className="btn-primary">
            Matçı oyna
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section>
          <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-400 uppercase">
            Turnir cədvəli
          </h3>
          {standings.isPending && <Spinner />}
          {standings.isError && <ErrorNote error={standings.error} />}
          {standings.data && <StandingsTable rows={standings.data} userTeamId={data.userTeamId} />}
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-400 uppercase">
            Həftə {data.currentWeek}
          </h3>

          {fixtures.isPending && <Spinner />}
          {fixtures.data?.length === 0 && <EmptyNote>Bu həftə matç yoxdur.</EmptyNote>}

          <div className="space-y-2">
            {fixtures.data?.map((match) => (
              <FixtureRow key={match.id} match={match} />
            ))}
          </div>
        </section>
      </div>
    </Shell>
  )
}

function FixtureRow({ match }: { match: Match }) {
  return (
    <div
      className={`card flex items-center gap-3 p-3 text-sm ${
        match.isUserMatch ? 'border-lime-400/40 bg-lime-400/5' : ''
      }`}
    >
      <span className="flex-1 truncate text-right">{match.homeTeamName}</span>

      <span
        className={`rounded px-2 py-1 font-bold tabular-nums ${
          match.isPlayed ? 'bg-black/40' : 'bg-white/5 text-slate-500'
        }`}
      >
        {match.isPlayed ? `${match.homeGoals} – ${match.awayGoals}` : 'vs'}
      </span>

      <span className="flex-1 truncate">{match.awayTeamName}</span>
    </div>
  )
}
