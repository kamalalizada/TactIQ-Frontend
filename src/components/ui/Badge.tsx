import { Position } from '@/types'

const POSITION_LABELS: Record<Position, string> = {
  [Position.GK]: 'GK',
  [Position.DEF]: 'DEF',
  [Position.MID]: 'MID',
  [Position.FWD]: 'FWD',
}

const POSITION_COLOURS: Record<Position, string> = {
  [Position.GK]: 'bg-pos-gk/15 text-pos-gk border-pos-gk/30',
  [Position.DEF]: 'bg-pos-def/15 text-pos-def border-pos-def/30',
  [Position.MID]: 'bg-pos-mid/15 text-pos-mid border-pos-mid/30',
  [Position.FWD]: 'bg-pos-fwd/15 text-pos-fwd border-pos-fwd/30',
}

export function PositionBadge({ position }: { position: Position }) {
  return (
    <span
      className={`inline-block rounded border px-1.5 py-0.5 text-[0.65rem] font-bold ${POSITION_COLOURS[position]}`}
    >
      {POSITION_LABELS[position]}
    </span>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'accent' | 'win'
}) {
  const tones = {
    neutral: 'border-line bg-white/5 text-muted',
    accent: 'border-accent/30 bg-accent/15 text-accent',
    win: 'border-win/30 bg-win/15 text-win',
  }

  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide uppercase ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export { POSITION_LABELS }
