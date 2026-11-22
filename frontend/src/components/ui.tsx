/** Defines shared presentation components and common form-control styles. */
import type { ReactNode } from 'react';
import { initialsOf, splitMoney } from '../format';
import type { Currency } from '../types';

/* ---------- Avatar: brand-colour initials, colour is stable per person ---------- */
const AVATAR_COLORS = [
  { bg: '#EE3524', fg: '#FFFFFF' },
  { bg: '#231F20', fg: '#FFFFFF' },
  { bg: 'rgba(238,53,36,0.85)', fg: '#FFFFFF' },
  { bg: 'rgba(35,31,32,0.85)', fg: '#FFFFFF' },
  { bg: 'rgba(238,53,36,0.7)', fg: '#FFFFFF' },
  { bg: 'rgba(35,31,32,0.7)', fg: '#FFFFFF' },
];

export function Avatar({ name, handle, size = 44 }: { name: string; handle?: string; size?: number }) {
  const key = handle ?? name;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const color = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{ width: size, height: size, background: color.bg, color: color.fg, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}

/* ---------- Money: big whole number, smaller decimals ---------- */
export function Money({
  value,
  currency = '₹',
  className = '',
  signed = false,
}: {
  value: number;
  currency?: Currency;
  className?: string;
  signed?: '+' | '-' | false;
}) {
  const s = splitMoney(value, currency);
  return (
    <span className={`tabular-nums ${className}`}>
      {signed || s.sign}
      {s.symbol}
      {s.whole}
      <span className="text-[0.62em] font-medium opacity-70">.{s.decimals}</span>
    </span>
  );
}

/* ---------- Switch ---------- */
export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${checked ? 'bg-cobalt' : 'bg-ink/20'}`}
    >
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-obsidian shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

/* ---------- Segmented control ---------- */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="inline-flex rounded-full bg-white/5 p-1" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={o.value === value}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
            o.value === value ? 'bg-ink text-midnight' : 'text-muted hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Layout bits ---------- */
export function Surface({ className = '', children }: { className?: string; children: ReactNode }) {
  return <section className={`rounded-3xl border border-white/10 bg-surface ${className}`}>{children}</section>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-semibold">{children}</h2>
      {action}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/5 ${className}`} />;
}

export const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-full bg-cobalt px-6 py-3.5 text-[15px] font-semibold text-ink transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40';
export const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-[15px] font-semibold text-ink transition hover:bg-white/5 disabled:opacity-40';
export const textInput =
  'w-full rounded-2xl border border-white/10 bg-surface2 px-4 py-3.5 text-[15px] text-ink placeholder-muted outline-none transition focus:border-cobalt';
