/** Displays the wallet overview, quick actions, recent activity, and card summary. */
import { ChevronRight, CreditCard, Eye, EyeOff, History, Plus, Send, Share2, Snowflake } from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';
import { copyText } from '../clipboard';
import Arches from '../components/Arches';
import Sparkline from '../components/Sparkline';
import { useToast } from '../components/Toast';
import TxDetail from '../components/TxDetail';
import TxRow from '../components/TxRow';
import { Avatar, Money, Segmented, SectionTitle, Skeleton, Surface } from '../components/ui';
import { CURRENCIES, firstName, formatRupees, greeting } from '../format';
import { deriveContacts, monthStats } from '../insights';
import { navigate } from '../router';
import { useData } from '../store';
import type { Currency, LedgerTx } from '../types';

export default function HomePage() {
  const { wallet, txs, currency, setCurrency, hideBalance, setHideBalance, loading, error } = useData();
  const toast = useToast();
  const [selected, setSelected] = useState<LedgerTx | null>(null);
  const contacts = useMemo(() => deriveContacts(txs), [txs]);
  const stats = useMemo(() => monthStats(txs), [txs]);

  if (!wallet) {
    if (error && !loading) {
      return (
        <p role="alert" className="rounded-2xl border border-cobalt/40 bg-cobalt/10 px-5 py-4 text-sm text-cobalt">
          {error}. Is the Swift backend running on port 8080?
        </p>
      );
    }
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-56" />
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const copyHandle = async () => {
    toast((await copyText(wallet.swiftHandle)) ? 'Your @swift ID is copied' : 'Could not copy', 'success');
  };
  const maxStat = Math.max(stats.spent, stats.received, 1);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">{greeting()}</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{firstName(wallet.fullName)}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          {/* Balance */}
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-midnight p-6">
            <Arches className="pointer-events-none absolute -right-10 -top-12 h-64 w-64 opacity-25" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/75">Total balance</p>
                <button
                  onClick={() => setHideBalance(!hideBalance)}
                  className="rounded-full p-2 text-white/75 transition hover:bg-white/10"
                  aria-label={hideBalance ? 'Show balance' : 'Hide balance'}
                >
                  {hideBalance ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="mt-1 text-5xl font-semibold tracking-tight">
                {hideBalance ? <span className="tabular-nums">{currency}••••••</span> : <Money value={wallet.balance} currency={currency} />}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={copyHandle}
                  className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium transition hover:bg-white/15"
                  aria-label={`Copy your ID ${wallet.swiftHandle}`}
                >
                  {wallet.swiftHandle}
                </button>
                <Segmented
                  label="Display currency"
                  value={currency}
                  onChange={setCurrency}
                  options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                />
              </div>
              <Sparkline balance={wallet.balance} txs={txs} className="mt-5 h-16 w-full" />
            </div>
          </section>

          {/* Quick actions */}
          <div className="grid grid-cols-4 gap-3">
            <Action label="Send" onClick={() => navigate('send')} primary icon={<Send size={22} />} />
            <Action label="Card" onClick={() => navigate('card')} icon={<CreditCard size={22} />} />
            <Action label="History" onClick={() => navigate('activity')} icon={<History size={22} />} />
            <Action label="Share ID" onClick={copyHandle} icon={<Share2 size={22} />} />
          </div>

          {/* People */}
          <div>
            <SectionTitle>Send again</SectionTitle>
            <div className="no-scrollbar -mx-1 flex gap-4 overflow-x-auto px-1 pb-1">
              <button onClick={() => navigate('send')} className="flex w-16 shrink-0 flex-col items-center gap-2" aria-label="Send to someone new">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-white/30 text-white/75">
                  <Plus size={22} />
                </span>
                <span className="text-xs text-muted">New</span>
              </button>
              {contacts.map((c) => (
                <button key={c.handle} onClick={() => navigate('send', c.handle)} className="flex w-16 shrink-0 flex-col items-center gap-2">
                  <Avatar name={c.name} handle={c.handle} size={56} />
                  <span className="w-full truncate text-center text-xs">{firstName(c.name)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div>
            <SectionTitle
              action={
                txs.length > 0 && (
                  <button onClick={() => navigate('activity')} className="flex items-center gap-1 text-sm text-cobalt hover:underline">
                    See all <ChevronRight size={16} />
                  </button>
                )
              }
            >
              Recent activity
            </SectionTitle>
            <Surface className="p-2">
              {txs.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="font-medium">No payments yet</p>
                  <p className="mt-1 text-sm text-muted">Send your first payment to see it here.</p>
                </div>
              ) : (
                txs.slice(0, 5).map((t) => <TxRow key={t.id} tx={t} currency={currency} onClick={setSelected} />)
              )}
            </Surface>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-5">
          {/* Card summary */}
          <button onClick={() => navigate('card')} className="block w-full text-left">
            <Surface className="p-5 transition hover:border-white/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-midnight">
                    {wallet.cardFrozen ? <Snowflake size={20} className="text-cobalt" /> : <CreditCard size={20} />}
                  </span>
                  <span>
                    <span className="block font-medium">Swift Virtual Card</span>
                    <span className="block text-sm text-muted tabular-nums">•••• {wallet.cardLast4}</span>
                  </span>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    wallet.cardFrozen ? 'bg-cobalt/10 text-cobalt' : 'bg-credit/15 text-credit'
                  }`}
                >
                  {wallet.cardFrozen ? 'Frozen' : 'Active'}
                </span>
              </div>
              <p className="mt-4 text-sm text-muted">
                Per-payment limit <span className="font-medium text-ink">{formatRupees(wallet.txLimit)}</span>
              </p>
            </Surface>
          </button>

          {/* This month */}
          <Surface className="p-5">
            <SectionTitle>This month</SectionTitle>
            <div className="space-y-4">
              <Bar label="Spent" value={stats.spent} max={maxStat} color="bg-cobalt" currency={currency} />
              <Bar label="Received" value={stats.received} max={maxStat} color="bg-credit" currency={currency} />
            </div>
            <p className="mt-4 text-xs text-muted">
              {stats.count} completed payment{stats.count === 1 ? '' : 's'}
            </p>
          </Surface>
        </div>
      </div>

      <TxDetail tx={selected} currency={currency} onClose={() => setSelected(null)} />
    </div>
  );
}

function Action({ label, icon, onClick, primary }: { label: string; icon: ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button onClick={onClick} className="group flex flex-col items-center gap-2">
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-full transition group-active:scale-95 sm:h-16 sm:w-16 ${
          primary ? 'bg-cobalt text-ink' : 'border border-white/10 bg-surface2 text-ink group-hover:border-white/30'
        }`}
      >
        {icon}
      </span>
      <span className="text-xs font-medium text-white/90">{label}</span>
    </button>
  );
}

function Bar({ label, value, max, color, currency }: { label: string; value: number; max: number; color: string; currency: Currency }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-muted">{label}</span>
        <Money value={value} currency={currency} className="font-medium" />
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max((value / max) * 100, value > 0 ? 4 : 0)}%` }} />
      </div>
    </div>
  );
}
