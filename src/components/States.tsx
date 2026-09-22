export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-400">
      <span className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-lime-400" />
      {label}
    </div>
  )
}

export function ErrorNote({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : 'Something went wrong.'

  return (
    <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {message}
    </p>
  )
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="py-10 text-center text-sm text-slate-500">{children}</p>
}
