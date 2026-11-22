import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { copyText } from '../clipboard';
import { formatDateTime, shortRef } from '../format';
import { navigate } from '../router';
import type { Currency, LedgerTx } from '../types';
import Sheet from './Sheet';
import { Avatar, Money, primaryButton } from './ui';

interface Props {
  tx: LedgerTx | null;
  currency: Currency;
  onClose: () => void;
}

/** Receipt-style detail sheet for one payment. */
export default function TxDetail({ tx, currency, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyRef() {
    if (!tx) return;
    if (await copyText(shortRef(tx.referenceId))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <Sheet open={tx !== null} onClose={onClose}>
      {tx && (
        <div>
          <div className="flex flex-col items-center text-center">
            <Avatar name={tx.counterpartyName} handle={tx.counterpartyHandle} size={64} />
            <p className="mt-3 text-sm text-muted">{tx.direction === 'SENT' ? 'Paid to' : 'Received from'}</p>
            <p className="text-lg font-semibold">{tx.counterpartyName}</p>
            <p className="text-sm text-muted">{tx.counterpartyHandle}</p>
            <Money
              value={tx.amount}
              currency={currency}
              signed={tx.direction === 'RECEIVED' && tx.status === 'SUCCESS' ? '+' : false}
              className={`mt-4 text-4xl font-semibold ${
                tx.status === 'FAILED' ? 'text-muted line-through' : tx.direction === 'RECEIVED' ? 'text-credit' : 'text-ink'
              }`}
            />
            <span
              className={`mt-3 rounded-full px-3 py-1 text-xs font-medium ${
                tx.status === 'SUCCESS' ? 'bg-credit/15 text-credit' : 'bg-cobalt/15 text-cobalt'
              }`}
            >
              {tx.status === 'SUCCESS' ? 'Completed' : 'Failed'}
            </span>
          </div>

          <dl className="mt-6 divide-y divide-white/5 rounded-2xl bg-white/[0.03] px-4 text-sm">
            <Row label="Date and time" value={formatDateTime(tx.createdAt)} />
            {tx.note && <Row label="Note" value={tx.note} />}
            {tx.failureReason && <Row label="Reason" value={tx.failureReason} />}
            <div className="flex items-center justify-between py-3">
              <dt className="text-muted">Transaction ID</dt>
              <dd>
                <button onClick={copyRef} className="inline-flex items-center gap-2 font-mono text-[13px]" aria-label="Copy transaction ID">
                  {shortRef(tx.referenceId)}
                  {copied ? <Check size={14} className="text-credit" /> : <Copy size={14} className="text-muted" />}
                </button>
              </dd>
            </div>
          </dl>

          {tx.direction === 'SENT' && (
            <button
              className={`${primaryButton} mt-5 w-full`}
              onClick={() => {
                onClose();
                navigate('send', tx.counterpartyHandle);
              }}
            >
              Pay {tx.counterpartyName.split(' ')[0]} again
            </button>
          )}
        </div>
      )}
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
