import { api } from './client'
import type {
  AuthResponse,
  CreateSeasonRequest,
  CupBracket,
  CupRoundResult,
  HeadToHeadSummary,
  LeagueStatistics,
  LiveState,
  Match,
  SeasonSummary,
  SetLineupRequest,
  SimulateWeekResult,
  StandingsRow,
  StartLiveRequest,
  TacticsUpdateRequest,
  Team,
} from '@/types'

export const authApi = {
  register: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { email, password }),
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
}

/** A season owns the squads and holds one or more competitions. */
export const seasonApi = {
  list: () => api.get<SeasonSummary[]>('/seasons'),
  get: (seasonId: string) => api.get<SeasonSummary>(`/seasons/${seasonId}`),
  create: (request: CreateSeasonRequest) => api.post<SeasonSummary>('/seasons', request),
  remove: (seasonId: string) => api.delete<void>(`/seasons/${seasonId}`),
  teams: (seasonId: string, country?: string) =>
    api.get<Team[]>(
      `/seasons/${seasonId}/teams${country ? `?country=${encodeURIComponent(country)}` : ''}`,
    ),
  /** Sets the managed club's formation and starting eleven. */
  setLineup: (seasonId: string, request: SetLineupRequest) =>
    api.patch<Team>(`/seasons/${seasonId}/lineup`, request),
  /** Picks the managed club; only allowed before the season kicks off. */
  setUserTeam: (seasonId: string, teamId: string) =>
    api.patch<SeasonSummary>(`/seasons/${seasonId}/user-team`, { teamId }),
  /** Season-wide by default; pass a competition to narrow it to one league. */
  statistics: (seasonId: string, competitionId?: string) =>
    api.get<LeagueStatistics>(
      `/seasons/${seasonId}/statistics${competitionId ? `?competitionId=${competitionId}` : ''}`,
    ),
  headToHead: (seasonId: string, teamA: string, teamB: string) =>
    api.get<HeadToHeadSummary>(
      `/seasons/${seasonId}/head-to-head?teamA=${teamA}&teamB=${teamB}`,
    ),
  /**
   * Advances every competition in the season by one week. Pass includeUserMatch
   * to settle the manager's own match rather than leaving it to be played live.
   */
  simulateWeek: (seasonId: string, includeUserMatch = false) =>
    api.post<SimulateWeekResult[]>(
      `/seasons/${seasonId}/simulate-week${includeUserMatch ? '?includeUserMatch=true' : ''}`,
    ),
}

/** Tables and fixtures belong to a competition inside a season. */
export const competitionApi = {
  standings: (competitionId: string) =>
    api.get<StandingsRow[]>(`/competitions/${competitionId}/standings`),
  fixtures: (competitionId: string, week?: number) =>
    api.get<Match[]>(`/competitions/${competitionId}/fixtures${week ? `?week=${week}` : ''}`),
  simulateWeek: (competitionId: string, includeUserMatch = false) =>
    api.post<SimulateWeekResult>(
      `/competitions/${competitionId}/simulate-week${
        includeUserMatch ? '?includeUserMatch=true' : ''
      }`,
    ),
}

export const cupApi = {
  bracket: (seasonId: string) => api.get<CupBracket>(`/seasons/${seasonId}/champions-league`),
  start: (seasonId: string) => api.post<CupBracket>(`/seasons/${seasonId}/champions-league/start`),
  playRound: (seasonId: string, includeUserMatch = false) =>
    api.post<CupRoundResult>(
      `/seasons/${seasonId}/champions-league/play-round${
        includeUserMatch ? '?includeUserMatch=true' : ''
      }`,
    ),
}

export const matchApi = {
  startLive: (matchId: string, request: StartLiveRequest) =>
    api.post<LiveState>(`/matches/${matchId}/start-live`, request),
  state: (matchId: string) => api.get<LiveState>(`/matches/${matchId}/live`),
  updateTactics: (matchId: string, request: TacticsUpdateRequest) =>
    api.patch<LiveState>(`/matches/${matchId}/tactics`, request),
  setSpeed: (matchId: string, speedMultiplier: number) =>
    api.post<LiveState>(`/matches/${matchId}/speed`, { speedMultiplier }),
  pause: (matchId: string) => api.post<LiveState>(`/matches/${matchId}/pause`),
  resume: (matchId: string) => api.post<LiveState>(`/matches/${matchId}/resume`),
  finish: (matchId: string) => api.post<LiveState>(`/matches/${matchId}/finish`),
}
