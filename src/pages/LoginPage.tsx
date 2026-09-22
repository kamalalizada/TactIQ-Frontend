import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { authApi } from '@/api/endpoints'
import { ErrorNote } from '@/components/States'
import { auth } from '@/lib/auth'

type Mode = 'login' | 'register'

export function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = useMutation({
    mutationFn: () =>
      mode === 'login' ? authApi.login(email, password) : authApi.register(email, password),
    onSuccess: (result) => {
      auth.save(result.token, result.email)
      navigate('/', { replace: true })
    },
  })

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Tact<span className="text-lime-400">IQ</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">Football simulation &amp; management</p>
        </div>

        <form
          className="card space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            submit.mutate()
          }}
        >
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-black/30 p-1">
            {(['login', 'register'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  mode === value ? 'bg-lime-400 text-pitch-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {value === 'login' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>

          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="field"
              placeholder="manager@tactiq.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="field"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {submit.isError && <ErrorNote error={submit.error} />}

          <button type="submit" className="btn-primary w-full" disabled={submit.isPending}>
            {submit.isPending ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
