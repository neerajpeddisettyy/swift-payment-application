/** Shows the virtual card and provides card-freeze and spending-limit controls. */
import { CreditCard, Eye, Info, Snowflake } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import CardVisual from '../components/CardVisual';
import { useToast } from '../components/Toast';
import { Money, PageHeader, Skeleton, Surface, Toggle } from '../components/ui';
import { formatRupees } from '../format';
import { monthStats } from '../insights';
import { useData } from '../store';

const PRESETS = [1000, 5000, 10000, 25000, 50000];

export default function CardPage() {
  const { wallet, txs, refresh, currency } = useData();
  const toast = useToast();
  const [showCvv, setShowCvv] = useState(false);
  const [limit, setLimit] = useState(wallet?.txLimit ?? 25000);
  const [busy, setBusy] = useState(false);
  const stats = useMemo(() => monthStats(txs), [txs]);

  // Keep the slider in sync with the server value.
  useEffect(() => {
    if (wallet) setLimit(wallet.txLimit);
  }, [wallet?.txLimit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced save: when the slider rests for 500ms, save once.
  useEffect(() => {
    if (!wallet || limit === wallet.txLimit) return;
    const timer = setTimeout(async () => {
      try {
        await api.setLimit(limit);
        await refresh();
        toast(`Payment limit set to ${formatRupees(limit)}`);
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Could not update the limit', 'error');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [limit, wallet?.txLimit]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!wallet) return <Skeleton className="h-96" />;

  async function toggleFreeze(next: boolean) {
    setBusy(true);
    try {
      await api.setFrozen(next);
      await refresh();
      toast(next ? 'Card frozen. Outgoing payments are blocked.' : 'Card unfrozen. You can send money again.');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not update the card', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Card" subtitle="Your Swift virtual debit card and spending controls" />

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <CardVisual wallet={wallet} showCvv={showCvv} onToggleCvv={() => setShowCvv((v) => !v)} />
          <div className="mt-5 grid max-w-md grid-cols-2 gap-3">
            <Surface className="p-4">
              <p className="text-sm text-muted">Spent this month</p>
              <Money value={stats.spent} currency={currency} className="mt-1 block text-xl font-semibold" />
            </Surface>
            <Surface className="p-4">
              <p className="text-sm text-muted">Payments</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{stats.count}</p>
            </Surface>
          </div>
        </div>

        <div className="space-y-4">
          <Surface className="divide-y divide-white/5">
            <div className="flex items-center gap-4 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-ink">
                <Snowflake size={20} />
              </span>
              <div className="flex-1">
                <p className="font-medium">Freeze card</p>
                <p className="text-sm text-muted">Instantly blocks all outgoing payments</p>
              </div>
              <Toggle checked={wallet.cardFrozen} onChange={toggleFreeze} label="Freeze card" disabled={busy} />
            </div>

            <div className="p-5">
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cobalt/15 text-ink">
                  <CreditCard size={20} />
                </span>
                <div className="flex-1">
                  <label htmlFor="limit" className="font-medium">
                    Limit per payment
                  </label>
                  <p className="text-sm text-muted">Payments above this amount are declined</p>
                </div>
                <p className="text-lg font-semibold tabular-nums">{formatRupees(limit)}</p>
              </div>
              <input
                id="limit"
                type="range"
                min={100}
                max={100000}
                step={100}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="mt-5 w-full"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setLimit(p)}
                    aria-pressed={limit === p}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                      limit === p ? 'border-cobalt bg-cobalt/15 text-ink' : 'border-white/10 text-muted hover:text-ink'
                    }`}
                  >
                    {formatRupees(p)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5">
                <Eye size={20} />
              </span>
              <div className="flex-1">
                <p className="font-medium">Card details</p>
                <p className="text-sm text-muted">Tap the eye on your card to reveal the CVV</p>
              </div>
            </div>
          </Surface>

          <p className="flex gap-2 px-1 text-sm text-muted">
            <Info size={16} className="mt-0.5 shrink-0" />
            Freezing only stops money going out. You can still receive payments while your card is frozen.
          </p>
        </div>
      </div>
    </div>
  );
}
