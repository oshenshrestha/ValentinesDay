export function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function safeParseDate(dateISO) {
  if (!dateISO || typeof dateISO !== 'string') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return null;
  const d = new Date(dateISO + 'T00:00:00');
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatNiceDate(dateISO) {
  const d = safeParseDate(dateISO);
  if (!d) return '';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function diffDays(fromISO) {
  const d = safeParseDate(fromISO);
  if (!d) return 0;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}
