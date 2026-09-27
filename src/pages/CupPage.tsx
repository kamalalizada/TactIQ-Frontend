import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { competitionApi, cupApi, seasonApi } from '@/api/endpoints'
import { Shell } from '@/components/Shell'
import { ErrorNote, Spinner } from '@/components/States'
import { TeamCrest } from '@/components/ui/TeamCrest'
import {
  CupRound,
  CUP_ROUND_LABELS,
  type CupBracket,
  type CupGroup,
  type CupTie,
} from '@/types'

// The group stage has its own tables, so the bracket starts at the last 16.
const KNOCKOUT_ROUNDS: CupRound[] = [
  CupRound.RoundOf16,
  CupRound.QuarterFinal,
  CupRound.SemiFinal,
  CupRound.Final,
]

export function CupPage() {
  const { seasonId = '' } = useParams()
  const queryClient = useQueryClient()

  const league = useQuery({
    queryKey: ['league', seasonId],
    queryFn: () => seasonApi.get(seasonId),
  })

  const cup = useQuery({
    queryKey: ['cup', seasonId],
    queryFn: () => cupApi.bracket(seasonId),
  })

  // Fetch the cup fixtures using the cup's competitionId, to find pending group stage matches
  const competitionId = cup.data?.competitionId
  const fixtures = useQuery({
    queryKey: ['fixtures', seasonId, competitionId],
    queryFn: () => competitionApi.fixtures(competitionId!),
    enabled: !!competitionId,
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['cup', seasonId] })
    queryClient.invalidateQueries({ queryKey: ['fixtures', seasonId, competitionId] })
    queryClient.invalidateQueries({ queryKey: ['fixtures', seasonId] }) // Refresh league fixtures just in case
  }

  const start = useMutation({ mutationFn: () => cupApi.start(seasonId), onSuccess: refresh })
  const playRound = useMutation({
    mutationFn: (includeUserMatch: boolean = false) => cupApi.playRound(seasonId, includeUserMatch),
    onSuccess: refresh,
  })

  if (cup.isPending) {
    return (
      <Shell>
        <Spinner />
      </Shell>
    )
  }

  if (cup.isError) {
    return (
      <Shell>
        <ErrorNote error={cup.error} />
      </Shell>
    )
  }

  const bracket = cup.data!
  const seasonFinished = league.data?.isFinished ?? false

  if (!bracket.started) {
    return (
      <Shell>
        <h2 className="mb-5 text-xl font-bold tracking-tight">Knockout Stage</h2>
        <div className="card mx-auto max-w-md space-y-4 text-center">
          <p className="text-4xl">🏆</p>
          <p className="font-semibold">Kubok hələ başlamayıb</p>
          <p className="text-sm text-muted">
            Liqa mövsümü bitdikdən sonra pley-off mərhələsi başlayacaq.
          </p>

          {start.isError && <ErrorNote error={start.error} />}

          <button
            type="button"
            className="btn-primary w-full"
            disabled={!seasonFinished || start.isPending}
            onClick={() => start.mutate()}
            title={seasonFinished ? undefined : 'Əvvəlcə liqa mövsümünü bitirin'}
          >
            {start.isPending ? 'Başladılır…' : 'Kuboku başlat'}
          </button>
        </div>
      </Shell>
    )
  }

  // 1. Try knockout ties
  const pendingUserTie = bracket.ties.find(
    (tie) => !tie.isComplete && tie.legs.some((leg) => leg.isUserMatch && !leg.isPlayed),
  )
  const userLeg = pendingUserTie?.legs.find((leg) => leg.isUserMatch && !leg.isPlayed)

  // 2. Try group stage fixtures
  const pendingFixture = fixtures.data?.find((match) => match.isUserMatch && !match.isPlayed)

  // 3. Try mutation fallback
  const pendingFromResult = playRound.data?.pendingUserMatch

  const pendingUserMatch = userLeg ?? pendingFixture ?? pendingFromResult
  const pendingMatchId = pendingUserMatch?.id

  return (
    <Shell>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Knockout Stage</h2>
          {bracket.currentRound !== null && !bracket.finished && (
            <p className="mt-0.5 text-sm text-muted">
              Current round: {CUP_ROUND_LABELS[bracket.currentRound]}
            </p>
          )}
        </div>

        {bracket.finished ? (
          <div className="flex items-center gap-3 rounded-lg border border-draw/40 bg-draw/10 px-4 py-2.5">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="text-[0.65rem] tracking-wide text-muted uppercase">Cup champion</p>
              <p className="font-bold text-draw">{bracket.winnerTeamName}</p>
            </div>
          </div>
        ) : pendingMatchId ? (
          <div className="flex items-center gap-3">
            <Link to={`/matches/${pendingMatchId}/live`} className="btn-primary">
              ⚽ Matçını oyna
            </Link>
            <button
              type="button"
              className="btn-ghost relative group"
              disabled={playRound.isPending}
              onClick={() => playRound.mutate(true)}
            >
              {playRound.isPending ? 'Gözləyin...' : 'Hamısını simulyasiya et'}
              {playRound.isPending && (
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-max text-[0.65rem] text-muted animate-pulse">
                  48 matç hesablanır...
                </span>
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              className="btn-primary"
              disabled={playRound.isPending}
              onClick={() => playRound.mutate(false)}
            >
              {playRound.isPending ? 'Oynanılır (gözləyin)...' : 'Raundu simulyasiya et'}
            </button>
            {playRound.isPending && (
              <span className="text-[0.65rem] text-muted animate-pulse">
                Bütün raund (çoxlu matç) simulyasiya edilir...
              </span>
            )}
          </div>
        )}
      </header>

      {/* Prominent user match card when there's a pending match */}
      {pendingMatchId && pendingUserMatch && (
        <div className="mb-5 rounded-lg border border-win/50 bg-win/5 p-4">
          <p className="mb-2 text-[0.65rem] font-bold tracking-wide text-win uppercase">
            ⚽ Sənin matçın — {bracket.currentRound !== null ? CUP_ROUND_LABELS[bracket.currentRound] : ''}
          </p>
          <div className="flex items-center gap-3">
            <TeamCrest name={pendingUserMatch.homeTeamName} size="sm" />
            <span className="flex-1 truncate text-sm font-medium">{pendingUserMatch.homeTeamName}</span>
            <span className="text-xs text-muted">vs</span>
            <span className="flex-1 truncate text-right text-sm font-medium">{pendingUserMatch.awayTeamName}</span>
            <TeamCrest name={pendingUserMatch.awayTeamName} size="sm" />
            <Link
              to={`/matches/${pendingMatchId}/live`}
              className="shrink-0 rounded bg-win px-4 py-2 text-sm font-bold text-bg transition-colors hover:bg-win/85"
            >
              OYNA
            </Link>
          </div>
          <p className="mt-1.5 text-xs text-muted">
            Raundun digər oyunları sən öz matçını oynayıb bitirən kimi simulyasiya olunacaq.
          </p>
        </div>
      )}

      {playRound.isError && (
        <div className="mb-4">
          <ErrorNote error={playRound.error} />
        </div>
      )}

      {bracket.groups.length > 0 && <Groups groups={bracket.groups} />}

      <Bracket bracket={bracket} />
    </Shell>
  )
}

function Groups({ groups }: { groups: CupGroup[] }) {
  return (
    <section className="mb-6">
      <h3 className="mb-3 text-sm font-semibold">Group Stage</h3>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {groups.map((group) => (
          <div key={group.name} className="rounded-lg border border-line bg-panel p-3">
            <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
              Group {group.name}
            </h4>

            <table className="w-full text-xs">
              <tbody>
                {group.table.map((row) => (
                  <tr
                    key={row.teamId}
                    className={`border-t border-line/40 first:border-0 ${
                      row.qualified ? '' : 'text-muted'
                    }`}
                  >
                    <td className="py-1 pr-1 text-muted">{row.rank}</td>
                    <td className="py-1 pr-1">
                      <span className="flex items-center gap-1.5">
                        <TeamCrest name={row.teamName} logoUrl={row.logoUrl} size="xs" />
                        <span className="truncate">{row.teamName}</span>
                        {row.qualified && (
                          <span aria-label="Qualified" className="shrink-0 text-win">
                            ▲
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-1 text-right text-muted">{row.played}</td>
                    <td className="py-1 pl-2 text-right font-bold">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </section>
  )
}

function Bracket({ bracket }: { bracket: CupBracket }) {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {KNOCKOUT_ROUNDS.map((round) => {
        const ties = bracket.ties.filter((tie) => tie.round === round)

        return (
          <section key={round}>
            <h3 className="mb-2.5 text-center text-xs font-semibold tracking-wide text-muted uppercase">
              {CUP_ROUND_LABELS[round]}
            </h3>

            {ties.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line py-8 text-center text-xs text-muted">
                Awaiting qualifiers
              </div>
            ) : (
              <div className="flex h-full flex-col justify-around gap-3">
                {ties.map((tie) => (
                  <TieCard key={tie.tieId} tie={tie} />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

function TieCard({ tie }: { tie: CupTie }) {
  const legScores = tie.legs
    .filter((leg) => leg.isPlayed)
    .map((leg) => `${leg.homeGoals}-${leg.awayGoals}`)
    .join(' / ')

  return (
    <div
      className={`rounded-lg border bg-panel p-3 ${
        tie.isComplete ? 'border-line' : 'border-accent/40'
      }`}
    >
      <Side
        name={tie.homeTeamName}
        logoUrl={tie.homeTeamLogoUrl}
        aggregate={tie.homeAggregate}
        isWinner={tie.winnerTeamId === tie.homeTeamId}
        settled={tie.isComplete}
      />
      <Side
        name={tie.awayTeamName}
        logoUrl={tie.awayTeamLogoUrl}
        aggregate={tie.awayAggregate}
        isWinner={tie.winnerTeamId === tie.awayTeamId}
        settled={tie.isComplete}
      />

      <p className="mt-2 flex items-center justify-between border-t border-line/60 pt-2 text-[0.65rem] text-muted">
        <span>{legScores ? `(${legScores})` : 'Not played'}</span>
        {tie.decidedOnPenalties && <span className="text-draw">on penalties</span>}
      </p>
    </div>
  )
}

function Side({
  name,
  logoUrl,
  aggregate,
  isWinner,
  settled,
}: {
  name: string
  logoUrl: string | null
  aggregate: number
  isWinner: boolean
  settled: boolean
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      <TeamCrest name={name} logoUrl={logoUrl} size="sm" />
      <span
        className={`flex-1 truncate text-sm ${
          settled && !isWinner ? 'text-muted' : 'font-medium'
        }`}
      >
        {name}
      </span>
      {isWinner && (
        <span aria-label="Advances" className="shrink-0 text-xs text-win">
          ▲
        </span>
      )}
      <span className={`w-5 shrink-0 text-right font-bold ${isWinner ? 'text-win' : ''}`}>
        {aggregate}
      </span>
    </div>
  )
}

