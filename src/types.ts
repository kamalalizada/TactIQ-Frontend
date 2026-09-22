// Mirrors the DTOs exposed by TactIQ.API.

export const GameMode = { GodMode: 0, ManagerMode: 1 } as const
export type GameMode = (typeof GameMode)[keyof typeof GameMode]

export const Position = { GK: 0, DEF: 1, MID: 2, FWD: 3 } as const
export type Position = (typeof Position)[keyof typeof Position]

export const TacticalStyle = { Defensive: 0, Balanced: 1, Attacking: 2 } as const
export type TacticalStyle = (typeof TacticalStyle)[keyof typeof TacticalStyle]

export const MatchEventType = { Goal: 0, YellowCard: 1, RedCard: 2, Substitution: 3 } as const
export type MatchEventType = (typeof MatchEventType)[keyof typeof MatchEventType]

export const LiveMatchStatus = { Running: 0, Paused: 1, Finished: 2 } as const
export type LiveMatchStatus = (typeof LiveMatchStatus)[keyof typeof LiveMatchStatus]

export interface AuthResponse {
  token: string
  email: string
  expiresAt: string
}

export interface LeagueSummary {
  id: string
  seasonName: string
  gameMode: GameMode
  userTeamId: string | null
  teamCount: number
  currentWeek: number
  totalWeeks: number
  isFinished: boolean
  createdAt: string
}

export interface Player {
  id: string
  name: string
  position: Position
  shirtNumber: number
  pace: number
  shooting: number
  passing: number
  dribbling: number
  defending: number
  physical: number
  overall: number
  isStarter: boolean
}

export interface Team {
  id: string
  name: string
  logoUrl: string | null
  attackRating: number
  defenseRating: number
  teamOverall: number
  players: Player[]
}

export interface MatchEvent {
  minute: number
  eventType: MatchEventType
  teamId: string
  description: string
}

export interface Match {
  id: string
  weekNumber: number
  homeTeamId: string
  homeTeamName: string
  awayTeamId: string
  awayTeamName: string
  homeGoals: number
  awayGoals: number
  isPlayed: boolean
  isUserMatch: boolean
  events: MatchEvent[]
}

export interface StandingsRow {
  rank: number
  teamId: string
  teamName: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

export interface SimulateWeekResult {
  weekNumber: number
  simulatedMatches: Match[]
  pendingUserMatch: Match | null
  nextWeek: number
  seasonFinished: boolean
}

export interface LiveEvent {
  minute: number
  eventType: MatchEventType
  teamId: string
  description: string
}

export interface LiveState {
  matchId: string
  minute: number
  status: LiveMatchStatus
  homeTeamId: string
  homeTeamName: string
  homeGoals: number
  awayTeamId: string
  awayTeamName: string
  awayGoals: number
  userStyle: TacticalStyle
  userFormation: string
  substitutionsUsed: number
  substitutionsRemaining: number
  speedMultiplier: number
  events: LiveEvent[]
}

export interface CreateLeagueRequest {
  seasonName: string
  gameMode: GameMode
  userTeamId: string | null
}

export interface StartLiveRequest {
  style: TacticalStyle
  formation: string
  speedMultiplier: number
}

export interface TacticsUpdateRequest {
  style?: TacticalStyle | null
  formation?: string | null
  substitution?: { playerOutId: string; playerInId: string } | null
}
