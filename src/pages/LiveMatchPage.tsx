import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { matchApi } from '@/api/endpoints'
import { GoalToast } from '@/components/GoalToast'
import { Shell } from '@/components/Shell'
import { ErrorNote, Spinner } from '@/components/States'
import { TacticsPanel } from '@/components/TacticsPanel'
import { useLiveMatch } from '@/lib/useLiveMatch'
import { useManagedSquad } from '@/lib/useManagedSquad'
import {
  LiveMatchStatus,
  MatchEventType,
  TacticalStyle,
  type LiveEvent,
  type LiveState,
  type TacticsUpdateRequest,
} from '@/types'

const SPEEDS = [1, 2, 4] as const

export function LiveMatchPage() {
  const { matchId = '' } = useParams()
  const queryClient = useQueryClient()

  const { state, connected, isFinished, lastEvent, clearLastEvent, ready, apply } =
    useLiveMatch(matchId)
  const [kickedOff, setKickedOff] = useState(false)

  const start = useMutation({
    mutationFn: async () => {
      // Join the hub group first, or the opening minutes arrive before we listen.
      await ready()
      return matchApi.startLive(matchId, {
        style: TacticalStyle.Balanced,
        formation: '4-4-2',
        speedMultiplier: 1,
      })
    },
    onSuccess: (next) => {
      apply(next)
      setKickedOff(true)
    },
  })

  const tactics = useMutation({
    mutationFn: (request: TacticsUpdateRequest) => matchApi.updateTactics(matchId, request),
    onSuccess: apply,
  })

  const speed = useMutation({
    mutationFn: (multiplier: number) => matchApi.setSpeed(matchId, multiplier),
    onSuccess: apply,
  })

  const pause = useMutation({
    mutationFn: (paused: boolean) => (paused ? matchApi.pause(matchId) : matchApi.resume(matchId)),
    onSuccess: apply,
  })

  const finish = useMutation({
    mutationFn: () => matchApi.finish(matchId),
    onSuccess: apply,
  })

  // The result is now in the database and the league week has moved on.
  useEffect(() => {
    if (!isFinished) return
    queryClient.invalidateQueries({ queryKey: ['leagues'] })
    queryClient.invalidateQueries({ queryKey: ['league'] })
    queryClient.invalidateQueries({ queryKey: ['standings'] })
    queryClient.invalidateQueries({ queryKey: ['fixtures'] })
  }, [isFinished, queryClient])

  if (!state && !start.isPending && !kickedOff) {
    return (
      <Shell>
        <KickOff onStart={() => start.mutate()} pending={start.isPending} error={start.error} />
      </Shell>
    )
  }

  if (!state) {
    return (
      <Shell>
        <Spinner label="Matç başlayır…" />
      </Shell>
    )
  }

  const isPaused = state.status === LiveMatchStatus.Paused

  return (
    <Shell>
      <GoalToast event={lastEvent} onDone={clearLastEvent} />

      <div className="mb-4">
        <Link to="/" className="text-xs text-slate-400 hover:text-lime-400">
          ← Geri
        </Link>
      </div>

      <Scoreboard state={state} connected={connected} />

      {isFinished ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link to="/" className="btn-primary">
            Dashboard-a qayıt
          </Link>
          <span className="text-sm text-slate-400">Matç bitdi, nəticə cədvələ yazıldı.</span>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-lg bg-black/30 p-1">
            {SPEEDS.map((multiplier) => (
              <button
                key={multiplier}
                type="button"
                onClick={() => speed.mutate(multiplier)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  state.speedMultiplier === multiplier
                    ? 'bg-lime-400 text-pitch-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {multiplier}×
              </button>
            ))}
          </div>

          <button type="button" className="btn-ghost" onClick={() => pause.mutate(!isPaused)}>
            {isPaused ? 'Davam et' : 'Dayandır'}
          </button>

          <button
            type="button"
            className="btn-ghost"
            disabled={finish.isPending}
            onClick={() => finish.mutate()}
          >
            {finish.isPending ? 'Bitirilir…' : 'Matçı bitir'}
          </button>
        </div>
      )}

      {finish.isError && (
        <div className="mt-3">
          <ErrorNote error={finish.error} />
        </div>
      )}
      {tactics.isError && (
        <div className="mt-3">
          <ErrorNote error={tactics.error} />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section>
          <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-400 uppercase">
            Hadisələr
          </h3>
          <Timeline events={state.events} homeTeamId={state.homeTeamId} />
        </section>

        <aside className="card">
          <h3 className="mb-4 text-sm font-semibold tracking-wide text-slate-400 uppercase">
            Taktika
          </h3>

          <LiveTactics
            state={state}
            matchId={matchId}
            disabled={isFinished}
            onStyle={(style) => tactics.mutate({ style })}
            onFormation={(formation) => tactics.mutate({ formation })}
            onSubstitute={(playerOutId, playerInId) =>
              tactics.mutate({ substitution: { playerOutId, playerInId } })
            }
          />
        </aside>
      </div>
    </Shell>
  )
}

function LiveTactics({
  state,
  matchId,
  disabled,
  onStyle,
  onFormation,
  onSubstitute,
}: {
  state: LiveState
  matchId: string
  disabled: boolean
  onStyle: (style: TacticalStyle) => void
  onFormation: (formation: string) => void
  onSubstitute: (playerOutId: string, playerInId: string) => void
}) {
  const { squad } = useManagedSquad(matchId)

  return (
    <TacticsPanel
      state={state}
      team={squad}
      disabled={disabled}
      onStyle={onStyle}
      onFormation={onFormation}
      onSubstitute={onSubstitute}
    />
  )
}

function KickOff({
  onStart,
  pending,
  error,
}: {
  onStart: () => void
  pending: boolean
  error: unknown
}) {
  return (
    <div className="mx-auto max-w-md">
      <div className="card space-y-4 text-center">
        <h2 className="text-xl font-bold">Matça hazırsan?</h2>
        <p className="text-sm text-slate-400">
          Matç dəqiqə-dəqiqə gedəcək. İstənilən anda taktikanı dəyişə, oyunçu əvəz edə və sürəti
          tənzimləyə bilərsən.
        </p>
        {error ? <ErrorNote error={error} /> : null}
        <button type="button" className="btn-primary w-full" onClick={onStart} disabled={pending}>
          {pending ? 'Başlayır…' : 'Matçı başlat'}
        </button>
      </div>
    </div>
  )
}

function Scoreboard({ state, connected }: { state: LiveState; connected: boolean }) {
  const finished = state.status === LiveMatchStatus.Finished

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-4">
        <TeamName name={state.homeTeamName} align="right" />

        <div className="text-center">
          <div className="text-4xl font-black tabular-nums">
            {state.homeGoals} <span className="text-slate-600">–</span> {state.awayGoals}
          </div>
          <div className="mt-1 text-xs font-semibold tracking-wide text-lime-400 uppercase">
            {finished ? 'Matç bitdi' : `${state.minute}′`}
            {state.status === LiveMatchStatus.Paused && ' · dayandırılıb'}
          </div>
        </div>

        <TeamName name={state.awayTeamName} align="left" />
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/40">
        <div
          className="h-full bg-lime-400 transition-[width] duration-500"
          style={{ width: `${Math.min(100, (state.minute / 90) * 100)}%` }}
        />
      </div>

      {!connected && !finished && (
        <p className="mt-2 text-center text-xs text-amber-400">Bağlantı bərpa olunur…</p>
      )}
    </div>
  )
}

function TeamName({ name, align }: { name: string; align: 'left' | 'right' }) {
  return (
    <div className={`min-w-0 flex-1 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <span className="truncate text-lg font-semibold">{name}</span>
    </div>
  )
}

function Timeline({ events, homeTeamId }: { events: LiveEvent[]; homeTeamId: string }) {
  if (events.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-500">Hələ hadisə yoxdur.</p>
  }

  return (
    <ol className="space-y-2">
      {[...events].reverse().map((event, index) => {
        const isHome = event.teamId === homeTeamId

        return (
          <li
            key={`${event.minute}-${index}`}
            className={`card flex items-center gap-3 p-3 text-sm ${
              isHome ? '' : 'flex-row-reverse text-right'
            }`}
          >
            <span className="w-10 shrink-0 text-xs font-bold text-slate-500 tabular-nums">
              {event.minute}′
            </span>
            <span aria-hidden>{event.eventType === MatchEventType.Goal ? '⚽' : '🔁'}</span>
            <span className="flex-1">{event.description}</span>
          </li>
        )
      })}
    </ol>
  )
}
