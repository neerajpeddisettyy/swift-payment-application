import { formatTime } from '../format';
import type { Currency, LedgerTx } from '../types';
import { Avatar, Money } from './ui';

interface Props {
  tx: LedgerTx;
  currency: Currency;
  onClick: (tx: LedgerTx) => void;
}

/** One payment in a list: avatar, who, note + time, amount (money in is green). */
export default function TxRow({ tx, currency, onClick }: Props) {
  const incoming = tx.direction === 'RECEIVED';
  const failed = tx.status === 'FAILED';
  const subtitle = failed
    ? (tx.failureReason ?? 'Payment failed')
    : (tx.note ?? (incoming ? 'Received' : 'Paid'));

  return (
    <button
      onClick={() => onClick(tx)}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/5"
    >
      <Avatar name={tx.counterpartyName} handle={tx.counterpartyHandle} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{tx.counterpartyName}</p>
        <p className="truncate text-sm text-muted">
          {subtitle} · {formatTime(tx.createdAt)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        {failed ? (
          <>
            <Money value={tx.amount} currency={currency} className="font-semibold text-muted line-through" />
            <p className="text-xs text-cobalt">Failed</p>
          </>
        ) : (
          <Money
            value={tx.amount}
            currency={currency}
            signed={incoming ? '+' : false}
            className={`font-semibold ${incoming ? 'text-credit' : 'text-ink'}`}
          />
        )}
      </div>
    </button>
  );
}
