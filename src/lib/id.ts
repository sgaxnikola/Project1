export function createId(prefix = ''): string {
  // Prefer crypto.randomUUID when available (modern browsers)
  const uuid = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : null;
  const base = uuid ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}_${base}` : base;
}
