import { Eye, EyeOff, Snowflake } from 'lucide-react';
import type { Wallet } from '../types';
import Arches from './Arches';
import SwiftLogo from './SwiftLogo';

interface Props {
  wallet: Wallet;
  showCvv: boolean;
  onToggleCvv: () => void;
}

/** The Swift virtual debit card. Greys out and shows a frozen badge when frozen. */
export default function CardVisual({ wallet, showCvv, onToggleCvv }: Props) {
  return (
    <div
      className={`relative aspect-[1.586/1] w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-midnight p-6 shadow-2xl shadow-black/40 transition duration-300 ${
        wallet.cardFrozen ? 'opacity-75 grayscale' : ''
      }`}
    >
      <Arches className="pointer-events-none absolute -right-12 -top-16 h-72 w-72 opacity-25" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <SwiftLogo size={36} />
          <span className="text-xs font-medium text-white/75">Virtual debit</span>
        </div>

        <div>
          <p className="text-[22px] font-medium tracking-[0.14em] tabular-nums sm:text-2xl">
            •••• •••• •••• {wallet.cardLast4}
          </p>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[11px] text-muted">Card holder</p>
              <p className="text-sm font-medium">{wallet.fullName}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted">Valid thru</p>
              <p className="text-sm font-medium tabular-nums">12/29</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted">CVV</p>
              <button
                onClick={onToggleCvv}
                className="inline-flex items-center gap-1.5 text-sm font-medium tabular-nums"
                aria-label={showCvv ? 'Hide CVV' : 'Show CVV'}
              >
                {showCvv ? wallet.cvv : '•••'}
                {showCvv ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {wallet.cardFrozen && (
        <div className="absolute inset-0 flex items-center justify-center bg-midnight/55">
          <span className="inline-flex items-center gap-2 rounded-full border border-cobalt/40 bg-midnight/85 px-4 py-2 text-sm font-medium text-cobalt">
            <Snowflake size={16} /> Card frozen
          </span>
        </div>
      )}
    </div>
  );
}
