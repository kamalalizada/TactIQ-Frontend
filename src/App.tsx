import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { ErrorNote, Spinner } from '@/components/States'
import { auth, ensureSignedIn } from '@/lib/auth'
import { LeagueDetailPage } from '@/pages/LeagueDetailPage'
import { LeaguesPage } from '@/pages/LeaguesPage'
import { LiveMatchPage } from '@/pages/LiveMatchPage'
import { LoginPage } from '@/pages/LoginPage'
import { TeamsPage } from '@/pages/TeamsPage'

export default function App() {
  const [ready, setReady] = useState(Boolean(auth.token))
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    if (ready) return

    let cancelled = false

    ensureSignedIn()
      .then(() => !cancelled && setReady(true))
      .catch((cause) => !cancelled && setError(cause))

    return () => {
      cancelled = true
    }
  }, [ready])

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <ErrorNote error={error} />
        <p className="mt-3 text-center text-xs text-slate-500">
          Check that the API is running on port 5064.
        </p>
      </div>
    )
  }

  if (!ready) return <Spinner label="Signing in…" />

  return (
    <Routes>
      <Route path="/" element={<LeaguesPage />} />
      <Route path="/leagues/:leagueId" element={<LeagueDetailPage />} />
      <Route path="/leagues/:leagueId/teams" element={<TeamsPage />} />
      <Route path="/matches/:matchId" element={<LiveMatchPage />} />

      {/* Kept reachable for when the login wall goes back up. */}
      <Route path="/login" element={<LoginPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
