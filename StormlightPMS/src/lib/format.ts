import { formatInTimeZone } from 'date-fns-tz';

export const MANILA_TZ = 'Asia/Manila';

export function fmtPHP(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '—';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return `${sign}₱${abs.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return formatInTimeZone(d, MANILA_TZ, 'd MMM yyyy');
}

export function fmtDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return formatInTimeZone(d, MANILA_TZ, 'd MMM yyyy, HH:mm');
}

export function manilaToday(): string {
  return formatInTimeZone(new Date(), MANILA_TZ, 'yyyy-MM-dd');
}
