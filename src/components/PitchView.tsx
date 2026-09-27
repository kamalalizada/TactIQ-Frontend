import { Position, type Player } from '@/types'

/**
 * The starting eleven laid out on a pitch, the way a football game shows it.
 *
 * Players are placed by line rather than by a stored formation: the API does
 * not persist one, so the shape is read back from how many players sit in each
 * position. A 1-4-4-2 squad draws as 4-4-2, a 1-4-3-3 as 4-3-3, and so on.
 */
const LINES: { position: Position; label: string }[] = [
  { position: Position.GK, label: 'QAP' },
  { position: Position.DEF, label: 'MÜD' },
  { position: Position.MID, label: 'YAR' },
  { position: Position.FWD, label: 'HÜC' },
]

/** Vertical band each line occupies, as a percentage from the goal line up. */
const BANDS: Record<Position, number> = {
  [Position.GK]: 8,
  [Position.DEF]: 30,
  [Position.MID]: 55,
  [Position.FWD]: 80,
}

export function PitchView({
  players,
  onSelect,
  selectedId,
}: {
  players: Player[]
  onSelect?: (player: Player) => void
  selectedId?: string | null
}) {
  return (
    <div
      className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-line sm:aspect-[4/3]"
      style={{
        background: 'linear-gradient(170deg, #1b5e34 0%, #0e3a20 100%)',
      }}
    >
      <PitchMarkings />

      {LINES.map(({ position }) => {
        // The array order is the pitch order: left to right within each line.
        const line = players.filter((player) => player.position === position)

        return line.map((player, index) => {
          // Spread the line evenly across the width, leaving a margin either side.
          const step = 100 / (line.length + 1)
          const left = step * (index + 1)

          return (
            <PlayerToken
              key={player.id}
              player={player}
              left={left}
              bottom={BANDS[position]}
              selected={player.id === selectedId}
              onSelect={onSelect}
            />
          )
        })
      })}
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

function PlayerToken({
  player,
  left,
  bottom,
  selected,
  onSelect,
}: {
  player: Player
  left: number
  bottom: number
  selected: boolean
  onSelect?: (player: Player) => void
}) {
  const tone =
    player.condition >= 80 ? 'bg-win' : player.condition >= 55 ? 'bg-draw' : 'bg-loss'

  const content = (
    <>
      <span
        className={`relative flex size-11 items-center justify-center rounded-full border-2 text-sm font-black shadow-lg transition-transform sm:size-12 ${
          selected
            ? 'scale-110 border-violet bg-violet text-white'
            : 'border-white/70 bg-bg/90 text-ink'
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

      <span className="text-[0.6rem] font-bold text-white/80">{player.overall}</span>
    </>
  )

  const style = { left: `${left}%`, bottom: `${bottom}%` }
  const className =
    'absolute flex -translate-x-1/2 translate-y-1/2 flex-col items-center'

  if (!onSelect) {
    return (
      <span className={className} style={style} title={player.name}>
        {content}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(player)}
      title={`${player.name} · ${player.overall} OVR · kondisiya ${player.condition}`}
      className={`${className} cursor-pointer`}
      style={style}
    >
      {content}
    </button>
  )
}
