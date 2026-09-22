import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { leagueApi } from '@/api/endpoints'
import { Shell } from '@/components/Shell'
import { EmptyNote, ErrorNote, Spinner } from '@/components/States'
import { GameMode } from '@/types'

export function LeaguesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [seasonName, setSeasonName] = useState('')
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.ManagerMode)

  const leagues = useQuery({ queryKey: ['leagues'], queryFn: leagueApi.list })

  const create = useMutation({
    mutationFn: () =>
      leagueApi.create({
        seasonName: seasonName.trim() || 'New Season',
        gameMode,
        userTeamId: null,
      }),
    onSuccess: (league) => {
      queryClient.invalidateQueries({ queryKey: ['leagues'] })
      navigate(`/leagues/${league.id}`)
    },
  })

  const remove = useMutation({
    mutationFn: leagueApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leagues'] }),
  })

  return (
    <Shell>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section>
          <h2 className="mb-4 text-xl font-semibold">Your seasons</h2>

          {leagues.isPending && <Spinner />}
          {leagues.isError && <ErrorNote error={leagues.error} />}

          {leagues.data?.length === 0 && <EmptyNote>No seasons yet. Create one to kick off.</EmptyNote>}

          <div className="space-y-3">
            {leagues.data?.map((league) => (
              <div key={league.id} className="card flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Link to={`/leagues/${league.id}`} className="font-semibold hover:text-lime-400">
                    {league.seasonName}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {league.gameMode === GameMode.ManagerMode ? 'Manager Mode' : 'God Mode'} ·{' '}
                    {league.isFinished
                      ? 'Season complete'
                      : `Week ${league.currentWeek} of ${league.totalWeeks}`}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-ghost text-xs"
                  onClick={() => {
                    if (confirm(`Delete "${league.seasonName}"? This cannot be undone.`)) {
                      remove.mutate(league.id)
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>

        <aside>
          <form
            className="card space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              create.mutate()
            }}
          >
            <h2 className="text-lg font-semibold">New season</h2>

            <div>
              <label className="label" htmlFor="season">
                Season name
              </label>
              <input
                id="season"
                className="field"
                placeholder="Season 2026/27"
                value={seasonName}
                onChange={(e) => setSeasonName(e.target.value)}
              />
            </div>

            <div>
              <span className="label">Mode</span>
              <div className="space-y-2">
                {[
                  { value: GameMode.ManagerMode, title: 'Manager Mode', hint: 'Play your own matches live' },
                  { value: GameMode.GodMode, title: 'God Mode', hint: 'Watch every result instantly' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                      gameMode === option.value
                        ? 'border-lime-400/60 bg-lime-400/10'
                        : 'border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      className="mt-1 accent-lime-400"
                      checked={gameMode === option.value}
                      onChange={() => setGameMode(option.value)}
                    />
                    <span>
                      <span className="block text-sm font-medium">{option.title}</span>
                      <span className="block text-xs text-slate-400">{option.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {create.isError && <ErrorNote error={create.error} />}

            <button type="submit" className="btn-primary w-full" disabled={create.isPending}>
              {create.isPending ? 'Creating…' : 'Create season'}
            </button>
          </form>
        </aside>
      </div>
    </Shell>
  )
}
