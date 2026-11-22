import { useMemo, useSyncExternalStore } from 'react';

// A tiny hash router (#/home, #/send, #/send/bob@swift ...) so we need no extra library.
export type Page = 'home' | 'send' | 'card' | 'activity' | 'profile';
export interface Route {
  page: Page;
  param?: string;
}

const PAGES: Page[] = ['home', 'send', 'card', 'activity', 'profile'];

function parse(hash: string): Route {
  const [first, ...rest] = hash.replace(/^#\/?/, '').split('/');
  const page = PAGES.includes(first as Page) ? (first as Page) : 'home';
  const param = rest.length > 0 ? decodeURIComponent(rest.join('/')) : undefined;
  return { page, param };
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  return useMemo(() => parse(hash), [hash]);
}

export function navigate(page: Page, param?: string): void {
  window.location.hash = param ? `#/${page}/${encodeURIComponent(param)}` : `#/${page}`;
  window.scrollTo({ top: 0 });
}
