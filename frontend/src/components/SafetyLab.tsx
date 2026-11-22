import { Loader2, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { api } from '../api';
import { formatMoney, newIdempotencyKey, shortRef } from '../format';
import { useData } from '../store';
import { primaryButton, textInput } from './ui';

interface Outcome {
  label: string;
  status: string;
  message: string;
  ref?: string;
  replayed?: boolean;
  failed: boolean;
}
interface Report {
  outcomes: Outcome[];
  before: number;
  after: number;
  amount: number;
  chargedOnce: boolean;
  sameReference: boolean;
}

/**
 * Developer tool: proves double-payment protection. Fires TWO identical requests (same
 * Idempotency-Key) at the same instant. Redis lets one through and returns the saved
 * response to the other, so the balance drops only once.
 */
export default function SafetyLab() {
  const { wallet, refresh } = useData();
  const defaultTo = wallet?.swiftHandle === 'alice@swift' ? 'bob@swift' : 'alice@swift';
  const [to, setTo] = useState(defaultTo);
  const [amount, setAmount] = useState('50');
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    const value = Number(amount);
    if (!to.trim() || !Number.isFinite(value) || value <= 0) {
      setError('Enter a handle and an amount greater than zero.');
      return;
    }
    setBusy(true);
    setError(null);
    setReport(null);
    try {
      const key = newIdempotencyKey();
      const body = { receiverHandle: to.trim(), amount: value, note: 'Duplicate payment test' };
      const before = (await api.wallet()).balance;
      const settled = await Promise.allSettled([api.transfer(key, body), api.transfer(key, body)]);
      const after = (await api.wallet()).balance;

      const outcomes: Outcome[] = settled.map((s, i) => {
        const label = `Request ${i === 0 ? 'A' : 'B'}`;
        if (s.status === 'fulfilled') {
          return {
            label,
            status: s.value.status,
            message: s.value.message,
            ref: s.value.referenceId,
            replayed: s.value.replayed,
            failed: s.value.status === 'FAILED',
          };
        }
        return { label, status: 'ERROR', message: s.reason instanceof Error ? s.reason.message : 'Failed', failed: true };
      });
      const refs = settled.flatMap((s) => (s.status === 'fulfilled' ? [s.value.referenceId] : []));
      const sameReference = refs.length === 2 && refs[0] === refs[1];
      const anySuccess = settled.some((s) => s.status === 'fulfilled' && s.value.status === 'SUCCESS');
      const chargedOnce = anySuccess && sameReference && Math.abs(before - after - value) < 0.005;
      setReport({ outcomes, before, after, amount: value, chargedOnce, sameReference });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Test failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">
        Sends the same payment twice at the same instant with one <span className="font-mono text-ink">Idempotency-Key</span>.
        A correct system charges you once.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={textInput} value={to} onChange={(e) => setTo(e.target.value)} aria-label="Receiver handle" />
        <input className={`${textInput} tabular-nums`} value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" aria-label="Amount in rupees" />
      </div>
      <button onClick={run} disabled={busy} className={primaryButton}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
        Run duplicate payment test
      </button>

      {error && <p role="alert" className="text-sm text-cobalt">{error}</p>}

      {report && (
        <div className="rounded-2xl border border-white/10 bg-surface2 p-4 text-sm">
          <ul className="space-y-2">
            {report.outcomes.map((o) => (
              <li key={o.label} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-medium">{o.label}</span>
                <span className={o.failed ? 'text-cobalt' : 'text-credit'}>{o.status}</span>
                {o.ref && <span className="font-mono text-xs text-muted">{shortRef(o.ref)}</span>}
                {o.replayed !== undefined && (
                  <span className={`rounded-full px-2 py-0.5 text-xs ${o.replayed ? 'bg-cobalt/20 text-cobalt' : 'bg-credit/15 text-credit'}`}>
                    {o.replayed ? 'duplicate blocked (served from Redis)' : 'processed'}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted tabular-nums">
            Balance {formatMoney(report.before)} to {formatMoney(report.after)}
          </p>
          <p className={`mt-2 font-medium ${report.chargedOnce ? 'text-credit' : 'text-cobalt'}`}>
            {report.chargedOnce
              ? `Charged exactly once (${formatMoney(report.amount)}). The duplicate was blocked.`
              : report.sameReference
                ? 'Both requests returned the same result and no money moved (payment was rejected).'
                : 'The two requests returned different references. Check the ledger.'}
          </p>
        </div>
      )}
    </div>
  );
}
