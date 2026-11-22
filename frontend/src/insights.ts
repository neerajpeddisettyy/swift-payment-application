import type { Contact, LedgerTx } from './types';

/** People you have paid or been paid by, most recent first. */
export function deriveContacts(txs: LedgerTx[], limit = 8): Contact[] {
  const seen = new Set<string>();
  const out: Contact[] = [];
  for (const t of txs) {
    if (t.status !== 'SUCCESS' && t.direction !== 'SENT') continue;
    if (seen.has(t.counterpartyHandle)) continue;
    seen.add(t.counterpartyHandle);
    out.push({ handle: t.counterpartyHandle, name: t.counterpartyName });
    if (out.length >= limit) break;
  }
  return out;
}

/** Money out / money in for the current calendar month (successful payments only). */
export function monthStats(txs: LedgerTx[]) {
  const now = new Date();
  let spent = 0;
  let received = 0;
  let count = 0;
  for (const t of txs) {
    if (t.status !== 'SUCCESS') continue;
    const d = new Date(t.createdAt);
    if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) continue;
    count += 1;
    if (t.direction === 'SENT') spent += t.amount;
    else received += t.amount;
  }
  return { spent, received, count };
}

/** Rebuilds past balances by walking the ledger backwards from today's balance. */
export function balanceSeries(balance: number, txs: LedgerTx[]): number[] {
  const settled = txs.filter((t) => t.status === 'SUCCESS').slice(0, 24); // newest first
  const series = [balance];
  let running = balance;
  for (const t of settled) {
    running += t.direction === 'RECEIVED' ? -t.amount : t.amount;
    series.unshift(running);
  }
  return series.length < 2 ? [balance, balance] : series;
}
