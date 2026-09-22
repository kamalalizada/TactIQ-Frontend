import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { auth } from '@/lib/auth'

export function Shell({ children }: { children: ReactNode }) {
  const email = auth.email

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-pitch-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span aria-hidden>⚽</span>
            <span>
              Tact<span className="text-lime-400">IQ</span>
            </span>
          </Link>

          {email && <span className="hidden text-sm text-slate-400 sm:inline">{email}</span>}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
