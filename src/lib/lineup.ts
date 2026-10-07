/**
 * Edits to a starting eleven, held as an ordered list of player ids.
 *
 * The order is what gives each player a job: the n-th id fills the n-th slot of
 * the formation. So every edit here keeps the list at the same length and only
 * moves ids between places, which is what keeps the shape intact.
 */

/** Two starters trade places, and with them the jobs those places carry. */
export function swapStarters(starters: string[], a: string, b: string): string[] {
  const from = starters.indexOf(a)
  const to = starters.indexOf(b)
  if (from < 0 || to < 0 || from === to) return starters

  const next = [...starters]
  next[from] = b
  next[to] = a
  return next
}

/** A substitute takes over the exact place, and job, of the player going off. */
export function substitute(starters: string[], outgoing: string, incoming: string): string[] {
  if (!starters.includes(outgoing) || starters.includes(incoming)) return starters
  return starters.map((id) => (id === outgoing ? incoming : id))
}
