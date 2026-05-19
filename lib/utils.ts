/**
 * TickBill — Utility Functions
 */

/**
 * Format seconds into HH:MM:SS display string
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':');
}

/**
 * Format seconds into compact display (e.g. "2h 30m")
 */
export function formatDurationCompact(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Format seconds into decimal hours (e.g. 2.50)
 */
export function formatDecimalHours(totalSeconds: number): string {
  const hours = totalSeconds / 3600;
  return hours.toFixed(2);
}

/**
 * Format currency in EUR (Austrian locale)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-AT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a decimal number with Austrian comma separator (e.g. 1,50)
 */
export function formatDecimal(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat('de-AT', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/**
 * Format IBAN with spaces in groups of 4 (e.g. AT35 2060 1034 0137 0857)
 */
export function formatIBAN(iban: string): string {
  return iban.replace(/\s/g, '').replace(/.{4}/g, '$& ').trim();
}

/**
 * Format a date for display (Austrian format)
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Format a time for display
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('de-AT', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format a date as relative (heute, gestern, etc.)
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Heute';
  if (days === 1) return 'Gestern';
  if (days < 7) return `Vor ${days} Tagen`;

  return formatDate(dateString);
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Guten Morgen';
  if (hour < 18) return 'Guten Tag';
  return 'Guten Abend';
}

/**
 * Generate a unique color for a project
 */
const PROJECT_COLORS = [
  '#00FBB0', '#00E0A1', '#00C48B', '#00A87A',
  '#10B981', '#34D399', '#059669', '#06B6D4',
  '#0EA5E9', '#3B82F6', '#00D998', '#33FBC0',
];

export function getProjectColor(index: number): string {
  return PROJECT_COLORS[index % PROJECT_COLORS.length];
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
