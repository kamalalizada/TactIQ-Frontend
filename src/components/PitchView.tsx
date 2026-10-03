import { fitOf, type Fit } from '@/lib/formations'
import { PlayerRole, ROLE_LABELS, type Player } from '@/types'

/**
 * The starting eleven laid out on a pitch, the way a football game shows it.
 *
 * Each player stands where their role belongs rather than wherever they happen
 * to sit in the array: a left-back on the left touchline, a right winger on the
 * right, the centre-backs in the middle. So a 4-3-3 reads as a 4-3-3 and a
 * 4-4-2 as a 4-4-2, and a manager can see at a glance that a side has no
 * right-back before the match rather than after it.
 */

/**
 * Where each role stands: how far up the pitch from the goal line, and how far
 * across from the left touchline.
 *
 * Both come from the job a shirt does, not from the line its occupant happens
 * to belong to. That is what separates a 4-2-3-1 from a 4-5-1 — both field five
 * across the middle, but one holds two of them deep and pushes a playmaker on;
 * banding by line alone would draw the two identically. It is also what keeps a
 * forward filling a holding role at the back of midfield instead of leaving him
 * drawn up front where his own line would put him.
 */
const SPOTS: Record<PlayerRole, { depth: number; lane: number }> = {
  [PlayerRole.GK]: { depth: 8, lane: 50 },

  [PlayerRole.LB]: { depth: 28, lane: 12 },
  [PlayerRole.CB]: { depth: 24, lane: 50 },
  [PlayerRole.RB]: { depth: 28, lane: 88 },

  [PlayerRole.CDM]: { depth: 42, lane: 50 },
  [PlayerRole.LM]: { depth: 52, lane: 15 },
  [PlayerRole.CM]: { depth: 52, lane: 50 },
  [PlayerRole.RM]: { depth: 52, lane: 85 },
  [PlayerRole.CAM]: { depth: 64, lane: 50 },

  [PlayerRole.LW]: { depth: 78, lane: 18 },
  [PlayerRole.ST]: { depth: 84, lane: 50 },
  [PlayerRole.RW]: { depth: 78, lane: 82 },
}

/** How wide a group of players standing on the same spot is fanned out. */
const FAN = 17

/**
 * Where every player stands. Anyone sharing a spot — the two centre-backs of a
 * back four, the pair of holders in a 4-2-3-1 — is fanned out either side of
 * it, so they sit alongside each other rather than on top of one another.
 */
function place(
  players: Player[],
  roleOf: (player: Player) => PlayerRole,
): { player: Player; left: number; bottom: number }[] {
  const bySpot = new Map<string, Player[]>()

  // Sorted by spot so each row reads left to right across the pitch.
  const ordered = [...players].sort((a, b) => {
    const left = SPOTS[roleOf(a)] ?? SPOTS[PlayerRole.CM]
    const right = SPOTS[roleOf(b)] ?? SPOTS[PlayerRole.CM]
    return left.depth - right.depth || left.lane - right.lane
  })

  for (const player of ordered) {
    const spot = SPOTS[roleOf(player)] ?? SPOTS[PlayerRole.CM]
    const key = `${spot.depth}:${spot.lane}`
    const group = bySpot.get(key)

    if (group) {
      group.push(player)
    } else {
      bySpot.set(key, [player])
    }
  }

  const placed: { player: Player; left: number; bottom: number }[] = []

  for (const group of bySpot.values()) {
    const spot = SPOTS[roleOf(group[0])] ?? SPOTS[PlayerRole.CM]
    const spread = Math.min(FAN * (group.length - 1), 58)
    const start = spot.lane - spread / 2

    group.forEach((player, index) => {
      const left =
        group.length === 1 ? spot.lane : start + (spread / (group.length - 1)) * index

      // Keep everyone inside the touchlines however crowded the spot is.
      placed.push({
        player,
        left: Math.min(92, Math.max(8, left)),
        bottom: spot.depth,
      })
    })
  }

  return placed
}

export function PitchView({
  players,
  onSelect,
  selectedId,
  slotRoleOf,
}: {
  players: Player[]
  onSelect?: (player: Player) => void
  selectedId?: string | null
  /**
   * The job the chosen shape asks of a given player. Passing it draws each
   * shirt where the formation puts it and marks anyone out of position, so a
   * manager can see a misfit before kick-off rather than after it.
   */
  slotRoleOf?: (player: Player) => PlayerRole | null
}) {
  // A shirt is drawn where its job belongs. Without a shape to read it from,
  // the player's own role stands in — which is what a bench sheet wants.
  const roleOf = (player: Player) => slotRoleOf?.(player) ?? player.role

  return (
    <div
      className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-line sm:aspect-[4/3]"
      style={{
        background: 'linear-gradient(170deg, #1b5e34 0%, #0e3a20 100%)',
      }}
    >
      <PitchMarkings />

      {place(players, roleOf).map(({ player, left, bottom }) => (
        <PlayerToken
          key={player.id}
          player={player}
          slotRole={roleOf(player)}
          left={left}
          bottom={bottom}
          selected={player.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

function PitchMarkings() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 size-full text-white/25"
    >
      {/* Mown stripes */}
      {Array.from({ length: 6 }).map((_, index) => (
        <rect
          key={index}
          x={0}
          y={(index * 100) / 6}
          width={100}
          height={100 / 6}
          fill={index % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent'}
        />
      ))}

      <g stroke="currentColor" strokeWidth="0.4" fill="none" vectorEffect="non-scaling-stroke">
        <rect x="2" y="2" width="96" height="96" />
        <line x1="2" y1="50" x2="98" y2="50" />
        <circle cx="50" cy="50" r="12" />
        <circle cx="50" cy="50" r="0.8" fill="currentColor" stroke="none" />
        {/* Penalty areas */}
        <rect x="26" y="2" width="48" height="16" />
        <rect x="38" y="2" width="24" height="7" />
        <rect x="26" y="82" width="48" height="16" />
        <rect x="38" y="91" width="24" height="7" />
      </g>
    </svg>
  )
}

/** How a shirt is outlined when its occupant does not play that job. */
const FIT_RING: Record<Fit, string> = {
  native: 'border-white/70',
  close: 'border-draw',
  poor: 'border-loss',
}

function PlayerToken({
  player,
  slotRole,
  left,
  bottom,
  selected,
  onSelect,
}: {
  player: Player
  slotRole: PlayerRole
  left: number
  bottom: number
  selected: boolean
  onSelect?: (player: Player) => void
}) {
  const tone =
    player.condition >= 80 ? 'bg-win' : player.condition >= 55 ? 'bg-draw' : 'bg-loss'

  // Out of position costs a player part of their rating, so the badge says so.
  const fit = fitOf(player.role, slotRole)

  const content = (
    <>
      <span
        className={`relative flex size-11 items-center justify-center rounded-full border-2 text-sm font-black shadow-lg transition-transform sm:size-12 ${
          selected
            ? 'scale-110 border-violet bg-violet text-white'
            : `${FIT_RING[fit]} bg-bg/90 text-ink`
        } ${player.isAvailable ? '' : 'opacity-50'}`}
      >
        {player.shirtNumber}

        {/* Fitness ring sits on the badge so it reads at a glance. */}
        <span
          aria-hidden
          className={`absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-bg ${tone}`}
        />
      </span>

      <span className="mt-1 max-w-[6.5rem] truncate rounded bg-black/55 px-1.5 py-0.5 text-[0.65rem] font-medium text-white">
        {player.name}
      </span>

      <span className="flex items-center gap-1 text-[0.6rem] font-bold text-white/80">
        <span
          className={`rounded px-1 text-[0.55rem] tracking-wide ${
            fit === 'native'
              ? 'bg-black/45 text-white/90'
              : fit === 'close'
                ? 'bg-draw/85 text-black'
                : 'bg-loss/85 text-white'
          }`}
        >
          {ROLE_LABELS[slotRole]}
        </span>
        {player.overall}
      </span>
    </>
  )

  const style = { left: `${left}%`, bottom: `${bottom}%` }
  const className =
    'absolute flex -translate-x-1/2 translate-y-1/2 flex-col items-center'

  if (!onSelect) {
    return (
      <span
        className={className}
        style={style}
        title={
          fit === 'native'
            ? player.name
            : `${player.name} · əsl mövqeyi ${ROLE_LABELS[player.role]}`
        }
      >
        {content}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(player)}
      title={
        fit === 'native'
          ? `${player.name} · ${ROLE_LABELS[slotRole]} · ${player.overall} OVR · kondisiya ${player.condition}`
          : `${player.name} · əsl mövqeyi ${ROLE_LABELS[player.role]}, burada ${ROLE_LABELS[slotRole]} oynayır · ${player.overall} OVR`
      }
      className={`${className} cursor-pointer`}
      style={style}
    >
      {content}
    </button>
  )
}
