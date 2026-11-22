/** Guides the user through selecting a recipient, amount, and transfer confirmation. */
import { AlertTriangle, ArrowLeft, Check, Delete, Copy, Loader2, Search, ShieldCheck, Snowflake } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../api';
import { copyText } from '../clipboard';
import Sheet from '../components/Sheet';
import { useToast } from '../components/Toast';
import { Avatar, Money, primaryButton, secondaryButton, textInput } from '../components/ui';
import { formatDateTime, formatMoney, formatRupees, newIdempotencyKey, shortRef } from '../format';
import { deriveContacts } from '../insights';
import { navigate } from '../router';
import { useData } from '../store';
import type { Contact, TransferResult } from '../types';

type Step = 'recipient' | 'amount' | 'result';

/** Appends a key press to the typed amount, allowing at most 2 decimals. */
function pressKey(cur: string, key: string): string {
  if (key === 'back') return cur.length <= 1 ? '' : cur.slice(0, -1);
  if (key === '.') {
    if (cur.includes('.')) return cur;
    return (cur === '' ? '0' : cur) + '.';
  }
  if (cur === '0') return key === '0' ? cur : key;
  const [whole, dec] = cur.split('.');
  if (dec !== undefined && dec.length >= 2) return cur;
  if (dec === undefined && whole.length >= 8) return cur;
  return cur + key;
}

function formatTyped(value: string): string {
  if (value === '') return '0';
  const [whole, dec] = value.split('.');
  const grouped = Number(whole).toLocaleString('en-IN');
  return dec !== undefined ? `${grouped}.${dec}` : grouped;
}

export default function SendPage({ initialHandle }: { initialHandle?: string }) {
  const { wallet, txs, refresh } = useData();

  const [step, setStep] = useState<Step>('recipient');
  const [recipient, setRecipient] = useState<Contact | null>(null);
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [result, setResult] = useState<TransferResult | null>(null);
  // One key per payment attempt. It is kept after a network error so a retry can never double-charge.
  const keyRef = useRef('');

  // Deep link: #/send/bob@swift jumps straight to the amount screen.
  useEffect(() => {
    if (!initialHandle) return;
    let cancelled = false;
    api
      .lookup(initialHandle)
      .then((u) => {
        if (cancelled) return;
        setRecipient({ handle: u.swiftHandle, name: u.fullName });
        setStep('amount');
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [initialHandle]);

  const amountNum = Number(amountStr || '0');

  // Validation shown under the amount, like a real payments app.
  let amountError: string | null = null;
  if (wallet && amountNum > 0) {
    if (amountNum > wallet.balance) amountError = 'Insufficient balance';
    else if (amountNum > wallet.txLimit) amountError = `Above your card limit of ${formatRupees(wallet.txLimit)}`;
  }
  const canReview = !!wallet && !wallet.cardFrozen && amountNum > 0 && !amountError;

  // Physical keyboard support on the amount screen.
  useEffect(() => {
    if (step !== 'amount' || reviewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      if (/^[0-9]$/.test(e.key) || e.key === '.') {
        keyRef.current = '';
        setAmountStr((cur) => pressKey(cur, e.key));
      } else if (e.key === 'Backspace') {
        keyRef.current = '';
        setAmountStr((cur) => pressKey(cur, 'back'));
      } else if (e.key === 'Enter' && canReview) {
        openReview();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, reviewOpen, canReview]);

  if (!wallet) return null;

  function openReview() {
    if (!keyRef.current) keyRef.current = newIdempotencyKey();
    setPayError(null);
    setReviewOpen(true);
  }

  function chooseRecipient(c: Contact) {
    keyRef.current = '';
    setRecipient(c);
    setStep('amount');
  }

  function addQuick(n: number) {
    keyRef.current = '';
    setAmountStr(String(Math.round((Number(amountStr || '0') + n) * 100) / 100));
  }

  async function pay() {
    if (!recipient) return;
    setBusy(true);
    setPayError(null);
    try {
      const r = await api.transfer(keyRef.current, {
        receiverHandle: recipient.handle,
        amount: amountNum,
        note: note.trim() || undefined,
      });
      keyRef.current = '';
      setResult(r);
      setReviewOpen(false);
      setStep('result');
      await refresh();
    } catch (e) {
      if (e instanceof ApiError && e.status < 500 && e.status !== 409) {
        setPayError(e.message);
      } else {
        setPayError("We couldn't reach Swift. Your money is safe, and trying again won't charge you twice.");
      }
    } finally {
      setBusy(false);
    }
  }

  function startOver() {
    keyRef.current = '';
    setRecipient(null);
    setAmountStr('');
    setNote('');
    setResult(null);
    setPayError(null);
    setStep('recipient');
  }

  if (step === 'result' && result && recipient) {
    return (
      <ResultView
        result={result}
        recipient={recipient}
        onDone={() => navigate('home')}
        onAgain={startOver}
        onRetry={() => {
          setResult(null);
          setStep('amount');
        }}
      />
    );
  }

  if (step === 'recipient' || !recipient) {
    return <RecipientStep selfHandle={wallet.swiftHandle} contacts={deriveContacts(txs)} onChoose={chooseRecipient} />;
  }

  // ---- Amount step ----
  const fontSize = amountStr.length > 9 ? 'text-4xl' : amountStr.length > 6 ? 'text-5xl' : 'text-6xl';
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'];

  return (
    <div className="mx-auto max-w-md animate-fade-up">
      <button onClick={() => setStep('recipient')} className="mb-5 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeft size={18} /> Change recipient
      </button>

      <div className="flex flex-col items-center text-center">
        <Avatar name={recipient.name} handle={recipient.handle} size={64} />
        <p className="mt-3 text-lg font-semibold">Paying {recipient.name}</p>
        <p className="text-sm text-muted">{recipient.handle}</p>
      </div>

      {wallet.cardFrozen && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-cobalt/30 bg-cobalt/10 p-4 text-sm">
          <Snowflake size={18} className="mt-0.5 shrink-0 text-cobalt" />
          <div className="flex-1">
            <p className="font-medium text-ink">Your card is frozen</p>
            <p className="text-white/75">Unfreeze it to send money.</p>
          </div>
          <button onClick={() => navigate('card')} className="font-medium text-cobalt">
            Unfreeze
          </button>
        </div>
      )}

      <div className="mt-8 text-center">
        <p className={`font-semibold tracking-tight tabular-nums ${fontSize} ${amountStr === '' ? 'text-white/40' : 'text-ink'}`}>
          <span className="mr-1 text-muted">₹</span>
          {formatTyped(amountStr)}
        </p>
        <p className={`mt-2 h-5 text-sm ${amountError ? 'text-cobalt' : 'text-muted'}`} role={amountError ? 'alert' : undefined}>
          {amountError ?? `Balance ${formatMoney(wallet.balance)}`}
          {amountError?.startsWith('Above') && (
            <button onClick={() => navigate('card')} className="ml-2 font-medium text-cobalt">
              Change limit
            </button>
          )}
        </p>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {[100, 500, 1000].map((n) => (
          <button key={n} onClick={() => addQuick(n)} className="rounded-full border border-white/10 bg-surface2 px-4 py-1.5 text-sm font-medium transition hover:border-white/30">
            +₹{n.toLocaleString('en-IN')}
          </button>
        ))}
      </div>

      <input
        value={note}
        onChange={(e) => {
          keyRef.current = '';
          setNote(e.target.value);
        }}
        maxLength={60}
        placeholder="Add a note (optional)"
        aria-label="Note"
        className={`${textInput} mt-6 text-center`}
      />

      <div className="mt-4 grid grid-cols-3 gap-1">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => {
              keyRef.current = '';
              setAmountStr((cur) => pressKey(cur, k));
            }}
            aria-label={k === 'back' ? 'Delete' : k === '.' ? 'Decimal point' : k}
            className="flex h-14 items-center justify-center rounded-2xl text-2xl font-medium transition hover:bg-white/5 active:bg-white/10"
          >
            {k === 'back' ? <Delete size={24} /> : k}
          </button>
        ))}
      </div>

      <button onClick={openReview} disabled={!canReview} className={`${primaryButton} mt-4 w-full`}>
        Review payment
      </button>

      {/* Review sheet */}
      <Sheet open={reviewOpen} onClose={() => !busy && setReviewOpen(false)} title="Review payment">
        <div className="rounded-2xl bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            <Avatar name={recipient.name} handle={recipient.handle} size={46} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{recipient.name}</p>
              <p className="truncate text-sm text-muted">{recipient.handle}</p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-credit/15 px-2.5 py-1 text-xs font-medium text-credit">
              <ShieldCheck size={12} /> Verified
            </span>
          </div>
        </div>

        <dl className="mt-4 divide-y divide-white/5 text-[15px]">
          <div className="flex justify-between py-3">
            <dt className="text-muted">Amount</dt>
            <dd className="font-semibold"><Money value={amountNum} /></dd>
          </div>
          <div className="flex justify-between py-3">
            <dt className="text-muted">Fee</dt>
            <dd className="font-medium text-credit">Free</dd>
          </div>
          {note.trim() && (
            <div className="flex justify-between gap-6 py-3">
              <dt className="text-muted">Note</dt>
              <dd className="text-right">{note.trim()}</dd>
            </div>
          )}
          <div className="flex justify-between py-3">
            <dt className="text-muted">You pay</dt>
            <dd className="text-lg font-semibold"><Money value={amountNum} /></dd>
          </div>
        </dl>

        {payError && (
          <p role="alert" className="mt-2 flex items-start gap-2 rounded-xl border border-cobalt/40 bg-cobalt/10 p-3 text-sm text-ink">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-cobalt" /> {payError}
          </p>
        )}

        <button onClick={pay} disabled={busy} className={`${primaryButton} mt-4 w-full`}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : null}
          {busy ? 'Sending…' : payError ? 'Try again' : `Pay ${formatMoney(amountNum)}`}
        </button>
        <p className="mt-3 text-center text-xs text-muted">Protected against duplicate charges.</p>
      </Sheet>
    </div>
  );

}

/* ------------------------------------------------------------------ */

type Lookup =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found'; user: Contact }
  | { status: 'notfound' }
  | { status: 'self' };

function RecipientStep({ selfHandle, contacts, onChoose }: { selfHandle: string; contacts: Contact[]; onChoose: (c: Contact) => void }) {
  const [query, setQuery] = useState('');
  const [lookup, setLookup] = useState<Lookup>({ status: 'idle' });

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setLookup({ status: 'idle' });
      return;
    }
    let cancelled = false;
    setLookup({ status: 'loading' });
    const timer = setTimeout(() => {
      api
        .lookup(q)
        .then((u) => {
          if (cancelled) return;
          setLookup(u.swiftHandle === selfHandle ? { status: 'self' } : { status: 'found', user: { handle: u.swiftHandle, name: u.fullName } });
        })
        .catch((e) => {
          if (cancelled) return;
          setLookup(e instanceof ApiError && e.status === 404 ? { status: 'notfound' } : { status: 'idle' });
        });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, selfHandle]);

  return (
    <div className="mx-auto max-w-lg animate-fade-up">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Send money</h1>
      <p className="mt-1 text-sm text-muted">Pay anyone instantly with their @swift handle.</p>

      <div className="relative mt-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && lookup.status === 'found') onChoose(lookup.user);
          }}
          placeholder="Enter a handle, e.g. bob@swift"
          aria-label="Recipient handle"
          autoCapitalize="none"
          autoCorrect="off"
          className={`${textInput} pl-11`}
        />
        {lookup.status === 'loading' && <Loader2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-muted" />}
      </div>

      <div className="mt-3 min-h-[76px]" aria-live="polite">
        {lookup.status === 'found' && (
          <button
            onClick={() => onChoose(lookup.user)}
            className="flex w-full animate-fade-up items-center gap-3 rounded-2xl border border-cobalt/40 bg-cobalt/10 p-3.5 text-left transition hover:bg-cobalt/15"
          >
            <Avatar name={lookup.user.name} handle={lookup.user.handle} size={48} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{lookup.user.name}</span>
              <span className="block truncate text-sm text-muted">{lookup.user.handle}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-credit/15 px-2.5 py-1 text-xs font-medium text-credit">
              <Check size={12} /> Swift account
            </span>
          </button>
        )}
        {lookup.status === 'notfound' && (
          <p className="rounded-2xl border border-white/10 bg-surface p-4 text-sm text-muted">
            No Swift account found for that handle. Check the spelling and try again.
          </p>
        )}
        {lookup.status === 'self' && (
          <p className="rounded-2xl border border-white/10 bg-surface p-4 text-sm text-muted">That's your own handle. Enter someone else's.</p>
        )}
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-base font-semibold">Recent</h2>
        {contacts.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-surface p-5 text-sm text-muted">
            People you pay will show up here. Try <span className="text-ink">bob@swift</span> or <span className="text-ink">alice@swift</span>.
          </p>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-surface p-2">
            {contacts.map((c) => (
              <button key={c.handle} onClick={() => onChoose(c)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/5">
                <Avatar name={c.name} handle={c.handle} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{c.name}</span>
                  <span className="block truncate text-sm text-muted">{c.handle}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ResultView({
  result,
  recipient,
  onDone,
  onAgain,
  onRetry,
}: {
  result: TransferResult;
  recipient: Contact;
  onDone: () => void;
  onAgain: () => void;
  onRetry: () => void;
}) {
  const toast = useToast();
  const ok = result.status === 'SUCCESS';
  const frozen = result.message.toLowerCase().includes('frozen');
  const limit = result.message.toLowerCase().includes('limit');

  return (
    <div className="mx-auto max-w-md pt-4 text-center">
      <div
        className={`mx-auto flex h-24 w-24 animate-pop items-center justify-center rounded-full ${
          ok ? 'bg-credit' : 'bg-cobalt'
        }`}
      >
        {ok ? (
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path className="check-draw" d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        ) : (
          <AlertTriangle size={44} color="#231F20" />
        )}
      </div>

      <h1 className="mt-6 text-2xl font-semibold">{ok ? 'Payment successful' : "Payment didn't go through"}</h1>
      {ok ? (
        <>
          <Money value={result.amount} className="mt-3 block text-5xl font-semibold" />
          <p className="mt-3 text-muted">
            Paid to <span className="font-medium text-ink">{recipient.name}</span>
          </p>
          <p className="text-sm text-muted">{recipient.handle}</p>
        </>
      ) : (
        <p className="mx-auto mt-3 max-w-xs text-muted">{result.message}</p>
      )}

      <dl className="mt-8 divide-y divide-white/5 rounded-2xl bg-surface px-4 text-left text-sm">
        <div className="flex justify-between py-3">
          <dt className="text-muted">Date and time</dt>
          <dd>{formatDateTime(result.createdAt)}</dd>
        </div>
        <div className="flex items-center justify-between py-3">
          <dt className="text-muted">Transaction ID</dt>
          <dd>
            <button
              className="inline-flex items-center gap-2 font-mono text-[13px]"
              onClick={async () => toast((await copyText(shortRef(result.referenceId))) ? 'Transaction ID copied' : 'Could not copy')}
              aria-label="Copy transaction ID"
            >
              {shortRef(result.referenceId)} <Copy size={14} className="text-muted" />
            </button>
          </dd>
        </div>
        {ok && (
          <div className="flex justify-between py-3">
            <dt className="text-muted">Balance now</dt>
            <dd className="tabular-nums">{formatMoney(result.senderBalanceAfter)}</dd>
          </div>
        )}
      </dl>

      <div className="mt-8 space-y-3">
        {ok ? (
          <>
            <button onClick={onDone} className={`${primaryButton} w-full`}>
              Done
            </button>
            <button onClick={onAgain} className={`${secondaryButton} w-full`}>
              Send to someone else
            </button>
          </>
        ) : (
          <>
            {frozen || limit ? (
              <button onClick={() => navigate('card')} className={`${primaryButton} w-full`}>
                {frozen ? 'Unfreeze card' : 'Change card limit'}
              </button>
            ) : (
              <button onClick={onRetry} className={`${primaryButton} w-full`}>
                Back to amount
              </button>
            )}
            <button onClick={onDone} className={`${secondaryButton} w-full`}>
              Go home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
