import { Position, type Player } from '@/types'

const POSITION_LABELS: Record<Position, string> = {
  [Position.GK]: 'GK',
  [Position.DEF]: 'DEF',
  [Position.MID]: 'MID',
  [Position.FWD]: 'FWD',
}

const POSITION_STYLES: Record<Position, string> = {
  [Position.GK]: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  [Position.DEF]: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
  [Position.MID]: 'bg-lime-400/15 text-lime-300 border-lime-400/30',
  [Position.FWD]: 'bg-rose-400/15 text-rose-300 border-rose-400/30',
}

const ATTRIBUTES = [
  { key: 'pace', label: 'PAC' },
  { key: 'shooting', label: 'SHO' },
  { key: 'passing', label: 'PAS' },
  { key: 'dribbling', label: 'DRI' },
  { key: 'defending', label: 'DEF' },
  { key: 'physical', label: 'PHY' },
] as const

export function PlayerCard({ player }: { player: Player }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{player.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`rounded border px-1.5 py-0.5 text-[0.65rem] font-bold ${
                POSITION_STYLES[player.position]
              }`}
            >
              {POSITION_LABELS[player.position]}
            </span>
            <span className="text-xs text-slate-500">#{player.shirtNumber}</span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-2xl leading-none font-black tabular-nums">{player.overall}</div>
          <div className="text-[0.6rem] tracking-wide text-slate-500 uppercase">OVR</div>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-x-3 gap-y-1.5 text-xs">
        {ATTRIBUTES.map((attribute) => (
          <div key={attribute.key} className="flex justify-between gap-1">
            <dt className="text-slate-500">{attribute.label}</dt>
            <dd className="font-semibold tabular-nums">{player[attribute.key]}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
