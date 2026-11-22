/** Displays searchable transaction history and its payment details. */
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import TxDetail from '../components/TxDetail';
import TxRow from '../components/TxRow';
import { Money, PageHeader, Segmented, Skeleton, Surface } from '../components/ui';
import { dayLabel } from '../format';
import { monthStats } from '../insights';
import { navigate } from '../router';
import { useData } from '../store';
import type { LedgerTx } from '../types';

type Filter = 'ALL' | 'SENT' | 'RECEIVED';

export default function ActivityPage() {
  const { wallet, txs, currency } = useData();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [selected, setSelected] = useState<LedgerTx | null>(null);
  const stats = useMemo(() => monthStats(txs), [txs]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = txs.filter((t) => {
      if (filter !== 'ALL' && t.direction !== filter) return false;
      if (!q) return true;
      return (
        t.counterpartyName.toLowerCase().includes(q) ||
        t.counterpartyHandle.toLowerCase().includes(q) ||
        (t.note ?? '').toLowerCase().includes(q) ||
        t.referenceId.toLowerCase().includes(q) ||
        String(t.amount).includes(q)
      );
    });
    const out: Array<{ label: string; items: LedgerTx[] }> = [];
    for (const t of rows) {
      const label = dayLabel(t.createdAt);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(t);
      else out.push({ label, items: [t] });
    }
    return out;
  }, [txs, query, filter]);

  if (!wallet) return <Skeleton className="h-96" />;

  return (
    <div>
      <PageHeader title="Activity" subtitle="All your payments in one place" />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:max-w-md">
        <Surface className="p-4">
          <p className="text-sm text-muted">Spent this month</p>
          <Money value={stats.spent} currency={currency} className="mt-1 block text-xl font-semibold" />
        </Surface>
        <Surface className="p-4">
          <p className="text-sm text-muted">Received this month</p>
          <Money value={stats.received} currency={currency} className="mt-1 block text-xl font-semibold text-credit" />
        </Surface>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-80">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, note or amount"
            aria-label="Search activity"
            className="w-full rounded-full border border-white/10 bg-surface2 py-3 pl-11 pr-4 text-[15px] outline-none placeholder:text-muted focus:border-cobalt"
          />
        </div>
        <Segmented
          label="Filter activity"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'ALL', label: 'All' },
            { value: 'SENT', label: 'Sent' },
            { value: 'RECEIVED', label: 'Received' },
          ]}
        />
      </div>

      {groups.length === 0 ? (
        <Surface className="px-6 py-14 text-center">
          <p className="text-lg font-medium">{txs.length === 0 ? 'No payments yet' : 'Nothing matches your search'}</p>
          <p className="mt-1 text-sm text-muted">
            {txs.length === 0 ? 'Your payments will appear here as soon as you send or receive money.' : 'Try a different name, note or amount.'}
          </p>
          {txs.length === 0 && (
            <button onClick={() => navigate('send')} className="mt-5 rounded-full bg-cobalt px-6 py-3 text-sm font-semibold">
              Send money
            </button>
          )}
        </Surface>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.label}>
              <h2 className="mb-2 px-1 text-sm font-medium text-muted">{g.label}</h2>
              <Surface className="p-2">
                {g.items.map((t) => (
                  <TxRow key={t.id} tx={t} currency={currency} onClick={setSelected} />
                ))}
              </Surface>
            </section>
          ))}
        </div>
      )}

      <TxDetail tx={selected} currency={currency} onClose={() => setSelected(null)} />
    </div>
  );
}
