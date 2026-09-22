import { useState } from 'react'

import { Position, TacticalStyle, type LiveState, type Player, type Team } from '@/types'

const STYLES = [
  { value: TacticalStyle.Defensive, label: 'Defensive' },
  { value: TacticalStyle.Balanced, label: 'Balanced' },
  { value: TacticalStyle.Attacking, label: 'Attacking' },
] as const

const FORMATIONS = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '5-3-2'] as const

const POSITION_LABEL: Record<Position, string> = {
  [Position.GK]: 'GK',
  [Position.DEF]: 'DEF',
  [Position.MID]: 'MID',
  [Position.FWD]: 'FWD',
}

export function TacticsPanel({
  state,
  team,
  disabled,
  onStyle,
  onFormation,
  onSubstitute,
}: {
  state: LiveState
  team: Team | undefined
  disabled: boolean
  onStyle: (style: TacticalStyle) => void
  onFormation: (formation: string) => void
  onSubstitute: (playerOutId: string, playerInId: string) => void
}) {
  const [playerOut, setPlayerOut] = useState('')
  const [playerIn, setPlayerIn] = useState('')

  // The live squad is the source of truth for who is actually on the pitch.
  const onPitch = team?.players.filter((p) => p.isStarter) ?? []
  const bench = team?.players.filter((p) => !p.isStarter) ?? []
  const canSub = !disabled && state.substitutionsRemaining > 0 && playerOut && playerIn

  return (
    <div className="space-y-5">
      <div>
        <span className="label">Tactical style</span>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-black/30 p-1">
          {STYLES.map((style) => (
            <button
              key={style.value}
              type="button"
              disabled={disabled}
              onClick={() => onStyle(style.value)}
              className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                state.userStyle === style.value
                  ? 'bg-lime-400 text-pitch-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="formation">
          Formation
        </label>
        <select
          id="formation"
          className="field"
          disabled={disabled}
          value={state.userFormation}
          onChange={(e) => onFormation(e.target.value)}
        >
          {FORMATIONS.map((formation) => (
            <option key={formation} value={formation}>
              {formation}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="label mb-0">Substitution</span>
          <span className="text-xs text-slate-400">{state.substitutionsRemaining} left</span>
        </div>

        <div className="space-y-2">
          <select
            className="field"
            disabled={disabled}
            value={playerOut}
            onChange={(e) => setPlayerOut(e.target.value)}
          >
            <option value="">Player off…</option>
            {onPitch.map((player) => (
              <option key={player.id} value={player.id}>
                {describe(player)}
              </option>
            ))}
          </select>

          <select
            className="field"
            disabled={disabled}
            value={playerIn}
            onChange={(e) => setPlayerIn(e.target.value)}
          >
            <option value="">Player on…</option>
            {bench.map((player) => (
              <option key={player.id} value={player.id}>
                {describe(player)}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn-ghost w-full"
            disabled={!canSub}
            onClick={() => {
              onSubstitute(playerOut, playerIn)
              setPlayerOut('')
              setPlayerIn('')
            }}
          >
            Make substitution
          </button>
        </div>
      </div>
    </div>
  )
}

function describe(player: Player) {
  return `#${player.shirtNumber} ${player.name} · ${POSITION_LABEL[player.position]} ${player.overall}`
}
