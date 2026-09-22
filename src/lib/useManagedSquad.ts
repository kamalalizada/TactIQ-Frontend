import { useQuery } from '@tanstack/react-query'

import { leagueApi } from '@/api/endpoints'
import type { Team } from '@/types'

/**
 * Finds the squad the user manages in whichever league this match belongs to.
 * The match DTO carries no league id, so the owning league is located by
 * scanning the user's manager-mode seasons for a fixture with this id.
 */
export function useManagedSquad(matchId: string): { squad: Team | undefined; isPending: boolean } {
  const leagues = useQuery({ queryKey: ['leagues'], queryFn: leagueApi.list })

  const managerLeagues = leagues.data?.filter((league) => league.userTeamId) ?? []

  const owner = useQuery({
    queryKey: ['match-league', matchId, managerLeagues.map((l) => l.id).join(',')],
    enabled: managerLeagues.length > 0,
    queryFn: async () => {
      for (const league of managerLeagues) {
        const fixtures = await leagueApi.fixtures(league.id)
        if (fixtures.some((fixture) => fixture.id === matchId)) return league
      }
      return null
    },
  })

  const teams = useQuery({
    queryKey: ['teams', owner.data?.id],
    queryFn: () => leagueApi.teams(owner.data!.id),
    enabled: Boolean(owner.data?.id),
  })

  return {
    squad: teams.data?.find((team) => team.id === owner.data?.userTeamId),
    isPending: leagues.isPending || owner.isPending || teams.isPending,
  }
}
