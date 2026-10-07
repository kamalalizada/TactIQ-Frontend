import { useDraggable, useDroppable } from '@dnd-kit/core'

import { PITCH_TEXT_EDGE, RatingStar, RoleChip } from '@/components/ui/Badge'
import { fitOf } from '@/lib/formations'
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
const FAN = 19

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
  formation,
  draggable = false,
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
  /** The shape's name, printed in the corner of the pitch. */
  formation?: string
  /**
   * Lets each shirt be picked up and dropped on another, or on the bench. The
   * page owns what a drop means; this only names each shirt `starter:<id>`.
   * Needs a DndContext above it.
   */
  draggable?: boolean
}) {
  // A shirt is drawn where its job belongs. Without a shape to read it from,
  // the player's own role stands in — which is what a bench sheet wants.
  const roleOf = (player: Player) => slotRoleOf?.(player) ?? player.role

  return (
    <div
      className="relative mx-auto aspect-[72/109] w-full max-w-[42rem] overflow-hidden rounded-xl shadow-xl"
      style={{ background: 'radial-gradient(ellipse at 50% 45%, #8fca55 0%, #74b443 55%, #5c9a33 100%)' }}
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
          draggable={draggable}
        />
      ))}

      {formation && (
        <span
          className={`absolute right-3 bottom-2 font-pitch text-[2rem] leading-none font-bold text-white ${PITCH_TEXT_EDGE}`}
        >
          {formation}
        </span>
      )}
    </div>
  )
}

function PitchMarkings() {
  // Drawn to a real pitch's proportions, 68 m by 105 m inside a 2 m margin, so
  // the centre circle stays round on the tall, narrow box that holds it.
  return (
    <svg
      aria-hidden
      viewBox="0 0 72 109"
      preserveAspectRatio="none"
      className="absolute inset-0 size-full text-white/85"
    >
      {/* Mown stripes */}
      {Array.from({ length: 24 }).map((_, index) => (
        <rect
          key={index}
          x={0}
          y={(index * 109) / 24}
          width={72}
          height={109 / 24}
          fill={index % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
        />
      ))}

      <g stroke="currentColor" strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke">
        <rect x="2" y="2" width="68" height="105" vectorEffect="non-scaling-stroke" />
        <line x1="2" y1="54.5" x2="70" y2="54.5" vectorEffect="non-scaling-stroke" />
        <circle cx="36" cy="54.5" r="9.15" vectorEffect="non-scaling-stroke" />
        <circle cx="36" cy="54.5" r="0.6" fill="currentColor" stroke="none" />

        {/* Top end: penalty area, goal area, spot and arc */}
        <rect x="15.84" y="2" width="40.32" height="16.5" vectorEffect="non-scaling-stroke" />
        <rect x="26.84" y="2" width="18.32" height="5.5" vectorEffect="non-scaling-stroke" />
        <circle cx="36" cy="13" r="0.5" fill="currentColor" stroke="none" />
        <path d="M 28.69 18.5 A 9.15 9.15 0 0 0 43.31 18.5" vectorEffect="non-scaling-stroke" />

        {/* Bottom end */}
        <rect x="15.84" y="90.5" width="40.32" height="16.5" vectorEffect="non-scaling-stroke" />
        <rect x="26.84" y="101.5" width="18.32" height="5.5" vectorEffect="non-scaling-stroke" />
        <circle cx="36" cy="96" r="0.5" fill="currentColor" stroke="none" />
        <path d="M 28.69 90.5 A 9.15 9.15 0 0 1 43.31 90.5" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  )
}

/** The id a starter's shirt carries while it is dragged or dropped on. */
export const starterDragId = (playerId: string) => `starter:${playerId}`

/**
 * What a shirt shows, as a football game's team sheet prints it: a starred
 * rating whose star carries fitness, the job, and the surname in white.
 * Shared by the shirt on the pitch and the copy that follows the pointer.
 */
export function TokenFace({
  player,
  role,
  mark = null,
}: {
  player: Player
  role: PlayerRole
  /** An outline round the rating and job: solid for the picked player, dashed for a drop target. */
  mark?: 'selected' | 'target' | null
}) {
  const outline =
    mark === 'selected'
      ? 'bg-white/20 outline-2 outline-white outline-solid'
      : mark === 'target'
        ? 'bg-white/10 outline-2 outline-white outline-dashed'
        : 'group-hover:bg-white/10'

  return (
    <>
      <span className={`flex flex-col items-center rounded px-1 pt-0.5 pb-1 transition-colors ${outline}`}>
        <RatingStar overall={player.overall} condition={player.condition} large />
        <RoleChip role={role} large />
      </span>

      <span
        className={`max-w-[8rem] truncate font-pitch text-[1.2rem] leading-tight font-bold tracking-wide text-white uppercase ${PITCH_TEXT_EDGE}`}
      >
        {lastName(player.name)}
      </span>
    </>
  )
}

function PlayerToken({
  player,
  slotRole,
  left,
  bottom,
  selected,
  onSelect,
  draggable,
}: {
  player: Player
  slotRole: PlayerRole
  left: number
  bottom: number
  selected: boolean
  onSelect?: (player: Player) => void
  draggable: boolean
}) {
  const id = starterDragId(player.id)
  const drag = useDraggable({ id, data: { player }, disabled: !draggable })
  const drop = useDroppable({ id, data: { player }, disabled: !draggable })

  // Out of position costs a player part of their rating; the hover text says so.
  const native = fitOf(player.role, slotRole) === 'native'

  const mark = drop.isOver && !drag.isDragging ? 'target' : selected ? 'selected' : null

  const style = { left: `${left}%`, bottom: `${bottom}%` }
  const className = `group absolute flex -translate-x-1/2 translate-y-1/2 flex-col items-center px-1 py-1 ${
    drag.isDragging ? 'opacity-30' : player.isAvailable ? '' : 'opacity-50'
  }`

  const title = native
    ? `${player.name} · ${ROLE_LABELS[slotRole]} · ${player.overall} OVR · kondisiya ${player.condition}`
    : `${player.name} · əsl mövqeyi ${ROLE_LABELS[player.role]}, burada ${ROLE_LABELS[slotRole]} oynayır · ${player.overall} OVR`

  if (!onSelect) {
    return (
      <span className={className} style={style} title={title}>
        <TokenFace player={player} role={slotRole} mark={mark} />
      </span>
    )
  }

  return (
    <button
      type="button"
      ref={(node) => {
        drag.setNodeRef(node)
        drop.setNodeRef(node)
      }}
      {...drag.attributes}
      {...drag.listeners}
      data-pick
      onClick={() => onSelect(player)}
      title={title}
      className={`${className} ${draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
      style={style}
    >
      <TokenFace player={player} role={slotRole} mark={mark} />
    </button>
  )
}

/** What a team sheet prints: the surname, or the whole name if it is one word. */
function lastName(name: string) {
  const parts = name.trim().split(/\s+/)
  // "Vini Jr." is known by the whole thing, not by its suffix.
  if (parts.length < 2 || /^(jr|sr)\.?$/i.test(parts[parts.length - 1])) return name
  return parts.slice(1).join(' ')
}
