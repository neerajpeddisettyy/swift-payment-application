/** Displays account settings, appearance preferences, and sign-out controls. */
import { ChevronDown, Copy, ExternalLink, LogOut } from 'lucide-react';
import { copyText } from '../clipboard';
import SafetyLab from '../components/SafetyLab';
import { useToast } from '../components/Toast';
import { Avatar, PageHeader, Segmented, Skeleton, Surface, Toggle, secondaryButton } from '../components/ui';
import { CURRENCIES } from '../format';
import { useData } from '../store';
import type { ThemeMode } from '../theme';

export default function ProfilePage({
  onLogout,
  theme,
  onThemeChange,
}: {
  onLogout: () => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}) {
  const { wallet, currency, setCurrency, hideBalance, setHideBalance } = useData();
  const toast = useToast();

  if (!wallet) return <Skeleton className="h-96" />;

  const email = wallet.swiftHandle; // demo accounts log in with their handle; shown as the account id

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Profile" />

      <Surface className="flex items-center gap-4 p-5">
        <Avatar name={wallet.fullName} handle={wallet.swiftHandle} size={64} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold">{wallet.fullName}</p>
          <button
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
            onClick={async () => toast((await copyText(wallet.swiftHandle)) ? 'Your @swift ID is copied' : 'Could not copy')}
            aria-label="Copy your Swift ID"
          >
            {wallet.swiftHandle} <Copy size={14} />
          </button>
        </div>
      </Surface>

      <h2 className="mb-2 mt-7 px-1 text-sm font-medium text-muted">Preferences</h2>
      <Surface className="divide-y divide-white/5">
        <div className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="font-medium">Appearance</p>
            <p className="text-sm text-muted">Choose light or dark mode</p>
          </div>
          <Segmented
            label="Appearance"
            value={theme}
            onChange={onThemeChange}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </div>
        <div className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="font-medium">Display currency</p>
            <p className="text-sm text-muted">Amounts always settle in ₹. This only changes how you see them.</p>
          </div>
          <Segmented label="Display currency" value={currency} onChange={setCurrency} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
        </div>
        <div className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="font-medium">Hide balance</p>
            <p className="text-sm text-muted">Keep your balance private on the home screen</p>
          </div>
          <Toggle checked={hideBalance} onChange={setHideBalance} label="Hide balance" />
        </div>
      </Surface>

      <h2 className="mb-2 mt-7 px-1 text-sm font-medium text-muted">Account</h2>
      <Surface className="divide-y divide-white/5 text-[15px]">
        <div className="flex justify-between p-5">
          <span className="text-muted">Swift ID</span>
          <span>{email}</span>
        </div>
        <div className="flex justify-between p-5">
          <span className="text-muted">Card</span>
          <span className="tabular-nums">•••• {wallet.cardLast4}</span>
        </div>
      </Surface>

      <details className="group mt-7 rounded-3xl border border-white/10 bg-surface">
        <summary className="flex cursor-pointer list-none items-center justify-between p-5 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block font-medium">Developer tools</span>
            <span className="block text-sm text-muted">Prove the safety features work</span>
          </span>
          <ChevronDown size={20} className="text-muted transition group-open:rotate-180" />
        </summary>
        <div className="space-y-6 border-t border-white/5 p-5">
          <SafetyLab />
          <div className="space-y-2 text-sm">
            <a className="flex items-center gap-2 text-cobalt hover:underline" href="http://localhost:8080/swagger-ui.html" target="_blank" rel="noreferrer">
              API docs (Swagger) <ExternalLink size={14} />
            </a>
            <a className="flex items-center gap-2 text-cobalt hover:underline" href="http://localhost:8080/api/health" target="_blank" rel="noreferrer">
              Service health <ExternalLink size={14} />
            </a>
            <p className="text-muted">
              Load test: run <span className="font-mono text-ink">mvn test -Dtest=Swift1000ConcurrencyTest</span> in the backend folder.
            </p>
          </div>
        </div>
      </details>

      <button onClick={onLogout} className={`${secondaryButton} mt-7 w-full`}>
        <LogOut size={18} /> Log out
      </button>
    </div>
  );
}
