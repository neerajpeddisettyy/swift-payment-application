/** Reads and persists the user's light or dark theme preference. */
export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'swift.theme';

export function readTheme(): ThemeMode {
  const savedTheme = localStorage.getItem(STORAGE_KEY);
  if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function saveTheme(theme: ThemeMode): void {
  localStorage.setItem(STORAGE_KEY, theme);
}
