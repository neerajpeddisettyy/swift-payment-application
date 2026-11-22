/** Handles sign-in and account creation before entering the wallet. */
import { Eye, EyeOff, Globe, Loader2, ShieldCheck, Snowflake, Zap } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { api, setToken } from '../api';
import Arches from '../components/Arches';
import SwiftLogo from '../components/SwiftLogo';
import { Avatar, primaryButton, textInput } from '../components/ui';

interface Props {
  onAuthenticated: () => void;
}

const FEATURES = [
  { icon: Zap, title: 'Instant @swift payments', text: 'Pay anyone by handle. No account numbers, no waiting.' },
  { icon: Snowflake, title: 'Card controls in your hands', text: 'Freeze your virtual card and set spending limits in one tap.' },
  { icon: ShieldCheck, title: 'Safe by design', text: 'Every payment is protected against double charges.' },
  { icon: Globe, title: 'See balances your way', text: 'View your money in rupees, dollars or euros.' },
];

export default function LoginPage({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [handle, setHandle] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<{ token: string }>) {
    setBusy(true);
    setError(null);
    try {
      const auth = await action();
      setToken(auth.token);
      onAuthenticated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (mode === 'login') void run(() => api.login(email, password));
    else void run(() => api.register(fullName, email, handle, password));
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-midnight p-14 lg:flex">
        <Arches className="pointer-events-none absolute -bottom-10 -right-16 h-[34rem] w-[34rem] opacity-30" />
        <SwiftLogo size={44} wordmark />
        <div className="relative max-w-md">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">Money that moves as fast as a message.</h1>
          <ul className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <Icon size={20} />
                </span>
                <span>
                  <span className="block font-medium">{title}</span>
                  <span className="block text-sm text-white/75">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-muted">Portfolio project</p>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center bg-obsidian px-6 py-10">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 lg:hidden">
            <SwiftLogo size={44} wordmark />
          </div>
          <h2 className="text-3xl font-semibold tracking-tight">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="mt-2 text-sm text-muted">
            {mode === 'login' ? 'Log in to send and receive money.' : 'Get your own @swift handle in a minute.'}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-3">
            {mode === 'register' && (
              <>
                <input className={textInput} placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" required />
                <div className="relative">
                  <input className={`${textInput} pr-20`} placeholder="Choose a handle" value={handle} onChange={(e) => setHandle(e.target.value)} autoCapitalize="none" required />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">@swift</span>
                </div>
              </>
            )}
            <input className={textInput} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" autoCapitalize="none" required />
            <div className="relative">
              <input
                className={`${textInput} pr-12`}
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'login' ? 'Password' : 'Password (8+ characters)'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-cobalt/40 bg-cobalt/10 px-4 py-3 text-sm text-cobalt">
                {error}
              </p>
            )}

            <button type="submit" disabled={busy} className={`${primaryButton} w-full`}>
              {busy && <Loader2 size={18} className="animate-spin" />}
              {mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
            }}
            className="mt-4 w-full text-center text-sm text-muted hover:text-ink"
          >
            {mode === 'login' ? "New to Swift? Create an account" : 'Already have an account? Log in'}
          </button>

          <div className="my-7 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-white/10" />
            Try the demo
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => void run(() => api.login('alice@swift', 'password123'))}
              disabled={busy}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-surface p-3 text-left transition hover:border-cobalt disabled:opacity-60"
            >
              <Avatar name="Alice Sharma" handle="alice@swift" size={40} />
              <span className="text-[15px] font-medium">Login as Alice (alice@swift)</span>
            </button>
            <button
              onClick={() => void run(() => api.login('bob@swift', 'password123'))}
              disabled={busy}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-surface p-3 text-left transition hover:border-cobalt disabled:opacity-60"
            >
              <Avatar name="Bob Verma" handle="bob@swift" size={40} />
              <span className="text-[15px] font-medium">Login as Bob (bob@swift)</span>
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-muted">Tip: open Bob in a private window to watch money arrive live.</p>
        </div>
      </section>
    </main>
  );
}
