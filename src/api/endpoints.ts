import { api } from './client'
import type {
  AuthResponse,
  CreateLeagueRequest,
  LeagueSummary,
  LiveState,
  Match,
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

export const leagueApi = {
  list: () => api.get<LeagueSummary[]>('/leagues'),
  get: (leagueId: string) => api.get<LeagueSummary>(`/leagues/${leagueId}`),
  create: (request: CreateLeagueRequest) => api.post<LeagueSummary>('/leagues', request),
  remove: (leagueId: string) => api.delete<void>(`/leagues/${leagueId}`),
  teams: (leagueId: string) => api.get<Team[]>(`/leagues/${leagueId}/teams`),
  standings: (leagueId: string) => api.get<StandingsRow[]>(`/leagues/${leagueId}/standings`),
  fixtures: (leagueId: string, week?: number) =>
    api.get<Match[]>(`/leagues/${leagueId}/fixtures${week ? `?week=${week}` : ''}`),
  simulateWeek: (leagueId: string) =>
    api.post<SimulateWeekResult>(`/leagues/${leagueId}/simulate-week`),
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
