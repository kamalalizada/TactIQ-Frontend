import { useEffect } from 'react'

import { MatchEventType, type LiveEvent } from '@/types'

/** Announces goals and substitutions as they come off the wire. */
export function GoalToast({ event, onDone }: { event: LiveEvent | null; onDone: () => void }) {
  useEffect(() => {
    if (!event) return
    const timer = setTimeout(onDone, event.eventType === MatchEventType.Goal ? 3200 : 2200)
    return () => clearTimeout(timer)
  }, [event, onDone])

  if (!event) return null

  const isGoal = event.eventType === MatchEventType.Goal

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4"
    >
      <div
        className={`animate-[toast_0.25s_ease-out] rounded-xl border px-6 py-4 text-center shadow-2xl backdrop-blur ${
          isGoal
            ? 'border-lime-400/40 bg-lime-400/15 shadow-lime-400/20'
            : 'border-white/15 bg-black/70'
        }`}
      >
        {isGoal && (
          <p className="text-3xl font-black tracking-tight text-lime-300">GOL! ⚽</p>
        )}
        <p className={isGoal ? 'mt-1 text-sm text-lime-100' : 'text-sm text-slate-200'}>
          {event.minute}′ — {event.description}
        </p>
      </div>
    </div>
  )
}
