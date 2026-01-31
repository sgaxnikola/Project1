const ICONS: Record<string, string> = {
  food: '🍽️',
  transport: '🚗',
  entertainment: '🎬',
  shopping: '🛍️',
  health: '🏥',
  education: '📚',
  utilities: '💡',
  salary: '💼',
  freelance: '💻',
  investment: '📈',
  other: '📂',
};

export function getCategoryIcon(iconKey: string): string {
  return ICONS[iconKey] ?? ICONS.other;
}

export function formatCurrency(amount: number, currency: string = 'VND'): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  const locale = currency === 'VND' ? 'vi-VN' : 'en-US';
  const options: Intl.NumberFormatOptions =
    currency === 'VND'
      ? { style: 'currency', currency: 'VND' }
      : { style: 'currency', currency, minimumFractionDigits: 2 };

  return new Intl.NumberFormat(locale, options).format(safeAmount);
}

export function formatNumber(value: string | number): string {
  // Strip all non-digits and add thousand separators.
  const numeric = String(value).replace(/\D/g, '');
  if (!numeric) return '';
  return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseFormattedNumber(value: string): number {
  const raw = value.replace(/\./g, '');
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}
