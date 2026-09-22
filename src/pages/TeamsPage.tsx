import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { leagueApi } from '@/api/endpoints'
import { PlayerCard } from '@/components/PlayerCard'
import { Shell } from '@/components/Shell'
import { ErrorNote, Spinner } from '@/components/States'
import type { Team } from '@/types'

export function TeamsPage() {
  const { leagueId = '' } = useParams()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const league = useQuery({
    queryKey: ['league', leagueId],
    queryFn: () => leagueApi.get(leagueId),
  })

  const teams = useQuery({
    queryKey: ['teams', leagueId],
    queryFn: () => leagueApi.teams(leagueId),
  })

  if (teams.isPending) {
    return (
      <Shell>
        <Spinner />
      </Shell>
    )
  }

  if (teams.isError) {
    return (
      <Shell>
        <ErrorNote error={teams.error} />
      </Shell>
    )
  }

  const all = teams.data ?? []
  const userTeamId = league.data?.userTeamId ?? null
  const selected = all.find((team) => team.id === selectedId) ?? all[0]

  return (
    <Shell>
      <div className="mb-6">
        <Link to={`/leagues/${leagueId}`} className="text-xs text-slate-400 hover:text-lime-400">
          ← Dashboard
        </Link>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">Komandalar</h2>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {all.map((team) => {
          const isActive = team.id === selected?.id

          return (
            <button
              key={team.id}
              type="button"
              onClick={() => setSelectedId(team.id)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-lime-400/60 bg-lime-400/10 text-lime-300'
                  : 'border-white/10 hover:bg-white/5'
              }`}
            >
              {team.name}
              {team.id === userTeamId && (
                <span className="ml-2 text-[0.65rem] text-lime-400 uppercase">sizin</span>
              )}
            </button>
          )
        })}
      </div>

      {selected && <Squad team={selected} isUserTeam={selected.id === userTeamId} />}
    </Shell>
  )
}

function Squad({ team, isUserTeam }: { team: Team; isUserTeam: boolean }) {
  const starters = team.players.filter((player) => player.isStarter)
  const bench = team.players.filter((player) => !player.isStarter)

  return (
    <div>
      <div className="card mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Logos are not served yet, so an initial stands in for the crest. */}
          <span className="flex size-12 items-center justify-center rounded-full bg-white/10 text-xl font-black">
            {team.name.charAt(0)}
          </span>
          <div>
            <h3 className="text-lg font-bold">{team.name}</h3>
            {isUserTeam && <p className="text-xs text-lime-400 uppercase">Sizin komandanız</p>}
          </div>
        </div>

        <dl className="flex gap-6 text-center">
          <Stat label="Hücum" value={team.attackRating} />
          <Stat label="Müdafiə" value={team.defenseRating} />
          <Stat label="Ümumi" value={team.teamOverall} />
        </dl>
      </div>

      <Section title={`İlk 11 (${starters.length})`} players={starters} />
      <Section title={`Ehtiyat (${bench.length})`} players={bench} />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dd className="text-xl font-black tabular-nums">{value.toFixed(1)}</dd>
      <dt className="text-[0.65rem] tracking-wide text-slate-500 uppercase">{label}</dt>
    </div>
  )
}

function Section({ title, players }: { title: string; players: Team['players'] }) {
  if (players.length === 0) return null

  return (
    <section className="mb-8">
      <h4 className="mb-3 text-sm font-semibold tracking-wide text-slate-400 uppercase">{title}</h4>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </section>
  )
}
