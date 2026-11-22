import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { CURRENCIES } from './format';
import type { Currency, LedgerTx, Wallet } from './types';

interface DataContextValue {
  wallet: Wallet | null;
  txs: LedgerTx[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  hideBalance: boolean;
  setHideBalance: (hide: boolean) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

function readCurrency(): Currency {
  const stored = localStorage.getItem('swift.currency');
  return CURRENCIES.find((c) => c === stored) ?? '₹';
}

/** One place that loads the wallet + ledger, keeps them fresh, and stores display preferences. */
export function DataProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txs, setTxs] = useState<LedgerTx[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrencyState] = useState<Currency>(readCurrency);
  const [hideBalance, setHideState] = useState<boolean>(() => localStorage.getItem('swift.hideBalance') === '1');

  const refresh = useCallback(async () => {
    try {
      const [w, ledger] = await Promise.all([api.wallet(), api.ledger()]);
      setWallet(w);
      setTxs(ledger);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your wallet');
    }
  }, []);

  // Load once, then refresh every 8s and whenever the tab regains focus,
  // so money sent from another browser appears on its own.
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 8000);
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  const setCurrency = useCallback((c: Currency) => {
    localStorage.setItem('swift.currency', c);
    setCurrencyState(c);
  }, []);

  const setHideBalance = useCallback((hide: boolean) => {
    localStorage.setItem('swift.hideBalance', hide ? '1' : '0');
    setHideState(hide);
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      wallet,
      txs,
      loading: wallet === null && error === null,
      error,
      refresh,
      currency,
      setCurrency,
      hideBalance,
      setHideBalance,
    }),
    [wallet, txs, error, refresh, currency, setCurrency, hideBalance, setHideBalance],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>');
  return ctx;
}
