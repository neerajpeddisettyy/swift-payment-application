/** Formats currency, dates, greetings, and identifiers for the Swift interface. */
import type { Currency } from './types';

export const CURRENCIES: Currency[] = ['₹', '$', '€'];

// The ledger always settles in ₹. These indicative rates only change how amounts are DISPLAYED.
export const RATES: Record<Currency, number> = {
  '₹': 1,
  $: 0.012,
  '€': 0.011,
};

export function splitMoney(inr: number, currency: Currency) {
  const value = inr * RATES[currency];
  const locale = currency === '₹' ? 'en-IN' : 'en-US';
  const text = Math.abs(value).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const dot = text.lastIndexOf('.');
  return {
    sign: value < 0 ? '-' : '',
    symbol: currency,
    whole: text.slice(0, dot),
    decimals: text.slice(dot + 1),
  };
}

export function formatMoney(inr: number, currency: Currency = '₹'): string {
  const s = splitMoney(inr, currency);
  return `${s.sign}${s.symbol}${s.whole}.${s.decimals}`;
}

/** Whole rupees without decimals, e.g. ₹25,000 (used for limits). */
export function formatRupees(value: number): string {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}, ${formatTime(iso)}`;
}

/** "Today", "Yesterday" or "12 Nov 2026" - used for the activity feed headings. */
export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((start(new Date()) - start(d)) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/[\s@._-]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Friendly transaction id, e.g. 3F9A1C07B2D4 */
export function shortRef(ref: string): string {
  return ref.replace(/-/g, '').slice(0, 12).toUpperCase();
}
