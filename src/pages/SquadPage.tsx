import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { seasonApi } from '@/api/endpoints'
import { PitchView } from '@/components/PitchView'
import { Shell } from '@/components/Shell'
import { EmptyNote, ErrorNote, Spinner } from '@/components/States'
import { PositionBadge } from '@/components/ui/Badge'
import { TeamCrest } from '@/components/ui/TeamCrest'
import { FORMATION_SLOTS, fitOf, pickForFormation } from '@/lib/formations'
import { Position, ROLE_LABELS, type Player, type PlayerRole } from '@/types'

const POSITION_ORDER: Position[] = [Position.GK, Position.DEF, Position.MID, Position.FWD]

/** The shapes a manager may pick, in the order the picker lists them. */
const FORMATIONS = Object.keys(FORMATION_SLOTS)

function byPosition(a: Player, b: Player) {
  const byLine = POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position)
  return byLine !== 0 ? byLine : a.shirtNumber - b.shirtNumber
}

export function SquadPage() {
  const { seasonId = '' } = useParams()
  const queryClient = useQueryClient()

  const [selected, setSelected] = useState<Player | null>(null)
  const [formation, setFormation] = useState<string | null>(null)
  // Null until the squad loads; after that it is the line-up being edited.
  const [starterIds, setStarterIds] = useState<string[] | null>(null)
  // The player marked to come off, waiting for a replacement to be picked.
  const [swapOutId, setSwapOutId] = useState<string | null>(null)

  const season = useQuery({
    queryKey: ['season', seasonId],
    queryFn: () => seasonApi.get(seasonId),
  })

  const teams = useQuery({
    queryKey: ['teams', seasonId],
    queryFn: () => seasonApi.teams(seasonId),
  })

  const squadTeam = teams.data?.find((team) => team.id === season.data?.userTeamId)

  // Start from what the club is already set up to play.
  useEffect(() => {
    if (!squadTeam || starterIds !== null) return

    const shape = FORMATIONS.includes(squadTeam.formation) ? squadTeam.formation : '4-4-2'
    setFormation(shape)

    const saved = squadTeam.players
      .filter((p) => p.isStarter)
      .sort((a, b) => a.lineupSlot - b.lineupSlot)

    // The saved order is what the shape asks for only when every starter has a
    // slot and there are eleven of them. A squad seeded before slots existed,
    // or one left short by injuries, is laid out from scratch instead — the
    // order is what names each player's job, so a wrong order mislabels them.
    const ordered =
      saved.length === 11 && saved.every((p, index) => p.lineupSlot === index + 1)
        ? saved.map((p) => p.id)
        : pickForFormation(shape, squadTeam.players)

    setStarterIds(ordered)
  }, [squadTeam, starterIds])

  const save = useMutation({
    mutationFn: () =>
      seasonApi.setLineup(seasonId, {
        formation: formation ?? '4-4-2',
        starterIds: starterIds ?? [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', seasonId] })
    },
  })

  if (teams.isPending || season.isPending) {
    return (
      <Shell wide>
        <Spinner />
      </Shell>
    )
  }

  if (teams.isError) {
    return (
      <Shell wide>
        <ErrorNote error={teams.error} />
      </Shell>
    )
  }

  const squad = squadTeam

  if (!squad) {
    return (
      <Shell wide>
        <h2 className="mb-5 text-xl font-bold tracking-tight">Heyət</h2>
        <EmptyNote>
          Bu mövsümdə komandanız yoxdur. Bütün komandalara{' '}
          <Link to={`/seasons/${seasonId}/teams`} className="text-accent hover:underline">
            Komandalar
          </Link>{' '}
          bölməsindən baxa bilərsiniz.
        </EmptyNote>
      </Shell>
    )
  }

  const chosen = starterIds ?? []
  const shape = formation ?? '4-4-2'
  const slots = FORMATION_SLOTS[shape] ?? FORMATION_SLOTS['4-4-2']

  /** The job the shape asks of whoever stands in a given shirt. */
  const slotRole = (playerId: string): PlayerRole | null => {
    const index = chosen.indexOf(playerId)
    return index >= 0 && index < slots.length ? slots[index] : null
  }

  const starters = chosen
    .map((id) => squad.players.find((p) => p.id === id))
    .filter((player): player is Player => Boolean(player))
  const bench = squad.players.filter((p) => !chosen.includes(p.id)).sort(byPosition)
  const shown = selected ?? starters[0]

  // Anyone filling a job that is not their own; legal, but they play below
  // their rating, so the manager is told before the match rather than after.
  const misfits = starters
    .map((player) => ({ player, role: slotRole(player.id) }))
    .filter(
      (entry): entry is { player: Player; role: PlayerRole } =>
        entry.role !== null && fitOf(entry.player.role, entry.role) !== 'native',
    )

  const unavailable = starters.filter((p) => !p.isAvailable)
  const keepers = starters.filter((p) => p.position === Position.GK).length

  // The shape itself is never refused: a manager short of midfielders may push
  // a winger inside, and those players already lose part of their rating for
  // it. What a side cannot do is field the wrong number of men, play someone
  // who is injured or suspended, or take the field without a goalkeeper.
  const canSave =
    chosen.length === 11 && unavailable.length === 0 && keepers === 1

  // Swapping is position-for-position, so the shape never breaks mid-edit.
  const swapOut = starters.find((p) => p.id === swapOutId) ?? null

  /**
   * Tapping the pitch: the first tap marks a player, the second either swaps
   * the two around — which is how you move someone left or right within a
   * line — or clears the mark if it was the same player.
   */
  const tapStarter = (player: Player) => {
    setSelected(player)

    if (!swapOut) {
      setSwapOutId(player.id)
      return
    }

    if (swapOut.id === player.id) {
      setSwapOutId(null)
      return
    }

    // Only within a line: swapping a defender with a striker would leave the
    // shape reading 3-4-3 while claiming to be 4-4-2.
    if (swapOut.position !== player.position) {
      setSwapOutId(player.id)
      return
    }

    const from = chosen.indexOf(swapOut.id)
    const to = chosen.indexOf(player.id)

    if (from >= 0 && to >= 0) {
      const next = [...chosen]
      next[from] = player.id
      next[to] = swapOut.id
      setStarterIds(next)
    }

    setSwapOutId(null)
  }

  /**
   * Tapping the bench brings that player on. With someone marked, they take
   * that exact place; otherwise the weakest player in the same line makes way,
   * so a single tap still works.
   */
  const bringOn = (benchPlayer: Player) => {
    const outgoing =
      swapOut && swapOut.position === benchPlayer.position
        ? swapOut
        : [...starters]
            .filter((p) => p.position === benchPlayer.position)
            // Give up the shirt that suits its job least, and among equals the
            // weakest player, so a single tap does not unseat a specialist.
            .sort((a, b) => {
              const roleA = slotRole(a.id)
              const roleB = slotRole(b.id)
              const fitA = roleA === null ? 1 : fitOf(a.role, roleA) === 'native' ? 1 : 0
              const fitB = roleB === null ? 1 : fitOf(b.role, roleB) === 'native' ? 1 : 0
              return fitA - fitB || a.overall - b.overall
            })[0]

    if (!outgoing) return

    setStarterIds(chosen.map((id) => (id === outgoing.id ? benchPlayer.id : id)))
    setSelected(benchPlayer)
    setSwapOutId(null)
  }

  const applyFormation = (next: string) => {
    setFormation(next)
    setSwapOutId(null)

    // Fill each slot with the player who actually plays that job, so switching
    // shape puts a right-back at right-back rather than the next best defender.
    setStarterIds(pickForFormation(next, squad.players, chosen))
  }

  return (
    <Shell wide>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TeamCrest name={squad.name} logoUrl={squad.logoUrl} size="lg" />
          <div>
            <h2 className="text-xl font-bold tracking-tight">{squad.name}</h2>
            <p className="mt-0.5 text-sm text-muted">
              İlk 11: {starters.length} · Ehtiyat: {bench.length}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">Düzülüş</span>
            <select
              value={shape}
              onChange={(event) => applyFormation(event.target.value)}
              className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-violet"
            >
              {FORMATIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={!canSave || save.isPending}
            className="rounded-lg bg-violet px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet/85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {save.isPending ? 'Yadda saxlanılır…' : 'Heyəti Yadda Saxla'}
          </button>
        </div>
      </header>

      {keepers !== 1 && (
        <p className="mb-4 rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">
          İlk 11-də bir qapıçı olmalıdır ({keepers} seçilib).
        </p>
      )}

      {misfits.length > 0 && (
        <p className="mb-4 rounded-md border border-draw/30 bg-draw/10 px-3 py-2 text-sm text-draw">
          Mövqeyindən kənarda oynayanlar reytinqinin bir hissəsini itirir:{' '}
          {misfits
            .map(
              ({ player, role }) =>
                `${player.name} (${ROLE_LABELS[player.role]} → ${ROLE_LABELS[role]})`,
            )
            .join(', ')}
        </p>
      )}

      {unavailable.length > 0 && (
        <p className="mb-4 rounded-md border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">
          Oynaya bilməyən oyunçular ilk 11-dədir:{' '}
          {unavailable.map((p) => p.name).join(', ')}
        </p>
      )}

      {save.isError && (
        <div className="mb-4">
          <ErrorNote error={save.error} />
        </div>
      )}

      {save.isSuccess && canSave && (
        <p className="mb-4 rounded-md border border-win/30 bg-win/10 px-3 py-2 text-sm text-win">
          Heyət yadda saxlanıldı.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <section>
          <PitchView
            players={starters}
            selectedId={swapOutId ?? shown?.id}
            onSelect={tapStarter}
            slotRoleOf={(player) => slotRole(player.id)}
          />

          {swapOut ? (
            <p className="mt-2.5 flex flex-wrap items-center gap-2 rounded-md border border-violet/40 bg-violet/10 px-3 py-2 text-sm">
              <span className="font-semibold">{swapOut.name}</span>
              <span className="text-muted">
                seçildi — yerini dəyişmək üçün meydandan, əvəz etmək üçün ehtiyatdan seçin
              </span>
              <button
                type="button"
                onClick={() => setSwapOutId(null)}
                className="ml-auto text-xs text-muted underline hover:text-ink"
              >
                imtina
              </button>
            </p>
          ) : (
            <p className="mt-2.5 text-[0.7rem] text-muted">
              Meydandakı oyunçuya basın: sonra başqasına basıb yerlərini dəyişə, ya da
              ehtiyatdan əvəz seçə bilərsiniz.
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap gap-4 text-[0.7rem] text-muted">
            <Key colour="bg-win" label="Forması yerində" />
            <Key colour="bg-draw" label="Yorğun" />
            <Key colour="bg-loss" label="Tükənmiş" />
          </div>

          <p className="mt-1.5 text-[0.7rem] text-muted">
            Mövqe yazısı sarı ya qırmızı olanda oyunçu öz yerində deyil və reytinqinin
            bir hissəsini itirir.
          </p>
        </section>

        <aside className="space-y-4">
          {shown && <PlayerDetail player={shown} />}

          <section className="glass-card">
            <h3 className="mb-1 text-sm font-semibold">Ehtiyat ({bench.length})</h3>
            <p className="mb-2.5 text-[0.7rem] text-muted">
              {swapOut
                ? `${swapOut.name} əvəzinə girəcək oyunçunu seçin.`
                : 'Oyunçuya basanda eyni mövqedən ən zəifi ilə yer dəyişir.'}
            </p>

            <ul className="scroll-list max-h-80 space-y-1 pr-1">
              {bench.map((player) => (
                <li key={player.id}>
                  <button
                    type="button"
                    onClick={() => bringOn(player)}
                    disabled={!player.isAvailable || Boolean(swapOut && swapOut.position !== player.position)}
                    title={
                      !player.isAvailable
                        ? 'Bu oyunçu oynaya bilməz'
                        : swapOut && swapOut.position !== player.position
                          ? `${swapOut.name} ilə eyni mövqedə deyil`
                          : `${player.name} oyuna girsin`
                    }
                    className={`flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-left text-sm transition-colors ${
                      player.id === shown?.id
                        ? 'border-violet bg-violet/10'
                        : 'border-line hover:bg-white/5'
                    } ${
                      player.isAvailable && (!swapOut || swapOut.position === player.position)
                        ? ''
                        : 'cursor-not-allowed opacity-40'
                    }`}
                  >
                    <span className="w-6 shrink-0 text-xs text-muted">{player.shirtNumber}</span>
                    <PositionBadge position={player.position} />
                    <span className="flex-1 truncate">{player.name}</span>
                    <RoleTag
                      role={player.role}
                      // With someone marked to come off, the tag says how well
                      // this player would fill that particular job.
                      fillingSlot={swapOut ? slotRole(swapOut.id) : null}
                    />
                    <span className="shrink-0 font-bold">{player.overall}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </Shell>
  )
}

/**
 * A player's own role, coloured by how well it fits the slot they are being
 * considered for. Without a slot in mind it simply names the role.
 */
function RoleTag({ role, fillingSlot }: { role: PlayerRole; fillingSlot: PlayerRole | null }) {
  const fit = fillingSlot === null ? 'native' : fitOf(role, fillingSlot)

  const tone =
    fillingSlot === null || fit === 'native'
      ? 'border-line text-muted'
      : fit === 'close'
        ? 'border-draw/50 text-draw'
        : 'border-loss/50 text-loss'

  return (
    <span
      className={`shrink-0 rounded border px-1 text-[0.6rem] tracking-wide ${tone}`}
      title={
        fillingSlot === null || fit === 'native'
          ? undefined
          : `Bu yerdə ${ROLE_LABELS[fillingSlot]} oynayacaq`
      }
    >
      {ROLE_LABELS[role]}
    </span>
  )
}

function Key({ colour, label }: { colour: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden className={`inline-block size-2.5 rounded-full ${colour}`} />
      {label}
    </span>
  )
}

const ATTRIBUTES = [
  { key: 'pace', label: 'SÜR' },
  { key: 'shooting', label: 'ZƏR' },
  { key: 'passing', label: 'PAS' },
  { key: 'dribbling', label: 'DRİ' },
  { key: 'defending', label: 'MÜD' },
  { key: 'physical', label: 'FİZ' },
] as const

function PlayerDetail({ player }: { player: Player }) {
  return (
    <section className="glass-card">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{player.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <PositionBadge position={player.position} />
            <span className="rounded border border-line px-1 text-[0.6rem] tracking-wide text-muted">
              {ROLE_LABELS[player.role]}
            </span>
            <span className="text-xs text-muted">
              #{player.shirtNumber} · {player.age} yaş
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted">{player.nationality}</p>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-3xl leading-none font-black">{player.overall}</div>
          <div className="text-[0.6rem] tracking-wide text-muted uppercase">OVR</div>
        </div>
      </div>

      <dl className="space-y-1.5">
        {ATTRIBUTES.map((attribute) => (
          <div key={attribute.key} className="flex items-center gap-2">
            <dt className="w-8 shrink-0 text-[0.65rem] text-muted">{attribute.label}</dt>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg">
              <span
                className="progress-gradient block h-full"
                style={{ width: `${player[attribute.key]}%` }}
              />
            </span>
            <dd className="w-6 shrink-0 text-right text-xs font-semibold">
              {player[attribute.key]}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 border-t border-line/60 pt-3">
        <ConditionRow value={player.condition} />
        <StatusRow player={player} />
      </div>
    </section>
  )
}

function ConditionRow({ value }: { value: number }) {
  const tone = value >= 80 ? 'bg-win' : value >= 55 ? 'bg-draw' : 'bg-loss'
  const text = value >= 80 ? 'text-win' : value >= 55 ? 'text-draw' : 'text-loss'

  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[0.65rem] text-muted">Kondisiya</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg">
        <span className={`block h-full ${tone}`} style={{ width: `${value}%` }} />
      </span>
      <span className={`w-6 shrink-0 text-right text-xs font-semibold ${text}`}>{value}</span>
    </div>
  )
}

function StatusRow({ player }: { player: Player }) {
  if (player.matchesInjured > 0) {
    return (
      <p className="mt-2 text-xs font-medium text-loss">Zədəli · {player.matchesInjured} matç</p>
    )
  }

  if (player.matchesSuspended > 0) {
    return (
      <p className="mt-2 text-xs font-medium text-loss">Cəzalı · {player.matchesSuspended} matç</p>
    )
  }

  if (player.yellowCards > 0) {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-draw">
        <span aria-hidden className="inline-block h-3 w-2 rounded-[1px] bg-draw" />
        {player.yellowCards} sarı vərəqə
      </p>
    )
  }

  return <p className="mt-2 text-xs text-muted">Oynamağa hazırdır</p>
}
