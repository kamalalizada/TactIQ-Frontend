// Mirrors the DTOs exposed by TactIQ.API.

export const GameMode = { GodMode: 0, ManagerMode: 1 } as const
export type GameMode = (typeof GameMode)[keyof typeof GameMode]

export const Position = { GK: 0, DEF: 1, MID: 2, FWD: 3 } as const
export type Position = (typeof Position)[keyof typeof Position]

export const TacticalStyle = { Defensive: 0, Balanced: 1, Attacking: 2 } as const
export type TacticalStyle = (typeof TacticalStyle)[keyof typeof TacticalStyle]

export const MatchEventType = {
  Goal: 0,
  YellowCard: 1,
  RedCard: 2,
  Substitution: 3,
  Injury: 4,
  Assist: 5,
  Save: 6,
  ShotOffTarget: 7,
  Penalty: 8,
  OwnGoal: 9,
} as const
export type MatchEventType = (typeof MatchEventType)[keyof typeof MatchEventType]

export const LiveMatchStatus = { Running: 0, Paused: 1, Finished: 2 } as const
export type LiveMatchStatus = (typeof LiveMatchStatus)[keyof typeof LiveMatchStatus]

export const CupRound = {
  GroupStage: 0,
  RoundOf16: 1,
  QuarterFinal: 2,
  SemiFinal: 3,
  Final: 4,
} as const
export type CupRound = (typeof CupRound)[keyof typeof CupRound]

export const CUP_ROUND_LABELS: Record<CupRound, string> = {
  0: 'Group Stage',
  1: 'Round of 16',
  2: 'Quarterfinals',
  3: 'Semifinals',
  4: 'Final',
}

/** A season now holds several competitions rather than being one table. */
export const CompetitionKind = { League: 0, ChampionsLeague: 1, DomesticCup: 2 } as const
export type CompetitionKind = (typeof CompetitionKind)[keyof typeof CompetitionKind]

export interface AuthResponse {
  token: string
  email: string
  expiresAt: string
}

export interface CompetitionSummary {
  id: string
  name: string
  country: string | null
  kind: CompetitionKind
  teamCount: number
  currentWeek: number
  totalWeeks: number
  currentRound: CupRound | null
  winnerTeamId: string | null
  winnerTeamName: string | null
  isFinished: boolean
}

export interface SeasonSummary {
  id: string
  name: string
  gameMode: GameMode
  userTeamId: string | null
  userTeamName: string | null
  isFinished: boolean
  createdAt: string
  competitions: CompetitionSummary[]
}

export interface Player {
  id: string
  name: string
  position: Position
  shirtNumber: number
  age: number
  nationality: string
  pace: number
  shooting: number
  passing: number
  dribbling: number
  defending: number
  physical: number
  overall: number
  isStarter: boolean
  /** Where a starter stands in the shape, counted across each line from the left. */
  lineupSlot: number
  /** Fitness carried between matches, 0-100. */
  condition: number
  matchesInjured: number
  matchesSuspended: number
  yellowCards: number
  /** False while injured or suspended; such a player cannot be picked. */
  isAvailable: boolean
}

export interface Team {
  id: string
  name: string
  country: string
  logoUrl: string | null
  /** The shape the manager has chosen, as "4-4-2". */
  formation: string
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
  playerId: string | null
  assistPlayerId: string | null
}

export interface Match {
  id: string
  competitionId: string
  competitionName: string
  kind: CompetitionKind
  weekNumber: number
  groupName: string | null
  round: CupRound | null
  leg: number | null
  tieId: string | null
  homePenalties: number | null
  awayPenalties: number | null
  homeTeamId: string
  homeTeamName: string
  homeTeamLogoUrl: string | null
  awayTeamId: string
  awayTeamName: string
  awayTeamLogoUrl: string | null
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
  logoUrl: string | null
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
  competitionId: string
  weekNumber: number
  simulatedMatches: Match[]
  pendingUserMatch: Match | null
  nextWeek: number
  competitionFinished: boolean
}

export interface LiveEvent {
  minute: number
  eventType: MatchEventType
  teamId: string
  description: string
  playerId: string | null
  assistPlayerId: string | null
}

/** A player as they stand in the running match, not as the squad stores them. */
export interface LivePlayer {
  id: string
  name: string
  position: Position
  shirtNumber: number
  overall: number
  /** Remaining stamina, 0-100, which falls as the match runs. */
  stamina: number
  onPitch: boolean
  sentOff: boolean
  injured: boolean
  yellowCards: number
}

export interface LiveState {
  matchId: string
  seasonId: string
  competitionId: string
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
  /** The managed side as it stands right now, for the bench sheet. */
  squad: LivePlayer[]
  events: LiveEvent[]
}

export interface CreateSeasonRequest {
  name: string
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

export interface PlayerStatRow {
  rank: number
  playerId: string
  playerName: string
  position: Position
  teamId: string
  teamName: string
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  matchesPlayed: number
}

export interface TeamFormRow {
  teamId: string
  teamName: string
  /** Most recent result first: "W", "D" or "L". */
  form: string[]
  goalsFor: number
  goalsAgainst: number
  pointsFromForm: number
}

export interface LeagueStatistics {
  topScorers: PlayerStatRow[]
  topAssists: PlayerStatRow[]
  mostBooked: PlayerStatRow[]
  form: TeamFormRow[]
  matchesPlayed: number
  totalGoals: number
  goalsPerMatch: number
  cleanSheets: number
  biggestWin: string | null
}

export interface GroupRow {
  rank: number
  teamId: string
  teamName: string
  logoUrl: string | null
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  qualified: boolean
}

export interface CupGroup {
  name: string
  table: GroupRow[]
}

export interface CupTie {
  tieId: string
  round: CupRound
  homeTeamId: string
  homeTeamName: string
  homeTeamLogoUrl: string | null
  awayTeamId: string
  awayTeamName: string
  awayTeamLogoUrl: string | null
  homeAggregate: number
  awayAggregate: number
  isComplete: boolean
  winnerTeamId: string | null
  decidedOnPenalties: boolean
  legs: Match[]
}

export interface CupBracket {
  competitionId: string
  name: string
  started: boolean
  finished: boolean
  currentRound: CupRound | null
  winnerTeamId: string | null
  winnerTeamName: string | null
  groups: CupGroup[]
  ties: CupTie[]
}

export interface CupRoundResult {
  round: CupRound
  simulatedMatches: Match[]
  pendingUserMatch: Match | null
  nextRound: CupRound | null
  cupFinished: boolean
  winnerTeamId: string | null
  winnerTeamName: string | null
}

export interface HeadToHeadMatch {
  matchId: string
  weekNumber: number
  homeTeamName: string
  homeGoals: number
  awayGoals: number
  awayTeamName: string
}

export interface HeadToHeadSummary {
  teamAId: string
  teamAName: string
  teamBId: string
  teamBName: string
  teamAWins: number
  draws: number
  teamBWins: number
  teamAGoals: number
  teamBGoals: number
  matches: HeadToHeadMatch[]
}

export interface SetLineupRequest {
  formation: string
  starterIds: string[]
}
