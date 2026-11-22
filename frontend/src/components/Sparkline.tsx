import { useMemo } from 'react';
import { balanceSeries } from '../insights';
import type { LedgerTx } from '../types';

/** Small, axis-free balance trend line for the hero card. */
export default function Sparkline({ balance, txs, className = '' }: { balance: number; txs: LedgerTx[]; className?: string }) {
  const points = useMemo(() => balanceSeries(balance, txs), [balance, txs]);
  const W = 400;
  const H = 80;
  const PAD = 6;
  const min = Math.min(...points);
  const span = Math.max(...points) - min || 1;
  const x = (i: number) => PAD + (i / (points.length - 1)) * (W - 2 * PAD);
  const y = (v: number) => H - PAD - ((v - min) / span) * (H - 2 * PAD);
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(p).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(1)} ${H} L${x(0).toFixed(1)} ${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} preserveAspectRatio="none" role="img" aria-label="Balance trend">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EE3524" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#EE3524" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkFill)" />
      <path d={line} fill="none" stroke="var(--chart-line)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
