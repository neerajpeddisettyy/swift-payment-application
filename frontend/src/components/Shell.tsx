/** Provides the responsive navigation layout shared by authenticated pages. */
import { CreditCard, History, Home, LogOut, Send, User } from 'lucide-react';
import type { ReactNode } from 'react';
import { navigate, Page, useRoute } from '../router';
import { useData } from '../store';
import SwiftLogo from './SwiftLogo';
import { Avatar } from './ui';

interface Props {
  onLogout: () => void;
  children: ReactNode;
}

const NAV: Array<{ page: Page; label: string; icon: typeof Home }> = [
  { page: 'home', label: 'Home', icon: Home },
  { page: 'send', label: 'Send money', icon: Send },
  { page: 'card', label: 'Card', icon: CreditCard },
  { page: 'activity', label: 'Activity', icon: History },
  { page: 'profile', label: 'Profile', icon: User },
];

export default function Shell({ onLogout, children }: Props) {
  const { page } = useRoute();
  const { wallet } = useData();

  return (
    <div className="min-h-screen bg-obsidian">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col justify-between border-r border-white/5 bg-midnight p-5 lg:flex">
        <div>
          <button onClick={() => navigate('home')} aria-label="Swift home">
            <SwiftLogo size={40} wordmark />
          </button>
          <nav className="mt-10 space-y-1" aria-label="Main">
            {NAV.map(({ page: p, label, icon: Icon }) => (
              <button
                key={p}
                onClick={() => navigate(p)}
                aria-current={page === p ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] font-medium transition ${
                  page === p ? 'bg-white/10 text-ink' : 'text-white/75 hover:bg-white/5 hover:text-ink'
                }`}
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-3">
          {wallet && (
            <button
              onClick={() => navigate('profile')}
              className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left"
            >
              <Avatar name={wallet.fullName} handle={wallet.swiftHandle} size={38} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{wallet.fullName}</span>
                <span className="block truncate text-xs text-white/75">{wallet.swiftHandle}</span>
              </span>
            </button>
          )}
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-white/75 transition hover:bg-white/5 hover:text-ink"
          >
            <LogOut size={18} /> Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-obsidian/90 px-4 py-3 backdrop-blur lg:hidden">
        <button onClick={() => navigate('home')} aria-label="Swift home">
          <SwiftLogo size={34} wordmark />
        </button>
        {wallet && (
          <button onClick={() => navigate('profile')} aria-label="Profile">
            <Avatar name={wallet.fullName} handle={wallet.swiftHandle} size={36} />
          </button>
        )}
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-5xl px-4 pb-32 pt-5 sm:px-6 lg:px-10 lg:pb-14 lg:pt-10">{children}</div>
      </main>

      {/* Mobile bottom tab bar, with a raised Pay button in the middle (like GPay) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-midnight/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="Main"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2">
          <Tab page="home" current={page} label="Home" icon={Home} />
          <Tab page="activity" current={page} label="Activity" icon={History} />
          <button onClick={() => navigate('send')} className="-mt-5 flex flex-col items-center gap-1 pb-2" aria-label="Send money">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cobalt shadow-lg shadow-cobalt/30 ring-4 ring-midnight">
              <Send size={24} />
            </span>
            <span className={`text-[11px] font-medium ${page === 'send' ? 'text-ink' : 'text-muted'}`}>Pay</span>
          </button>
          <Tab page="card" current={page} label="Card" icon={CreditCard} />
          <Tab page="profile" current={page} label="Profile" icon={User} />
        </div>
      </nav>
    </div>
  );
}

function Tab({ page, current, label, icon: Icon }: { page: Page; current: Page; label: string; icon: typeof Home }) {
  const active = page === current;
  return (
    <button
      onClick={() => navigate(page)}
      aria-current={active ? 'page' : undefined}
      className={`flex flex-col items-center gap-1 py-2.5 ${active ? 'text-ink' : 'text-muted'}`}
    >
      <Icon size={22} />
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}
