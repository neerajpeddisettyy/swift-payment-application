/** Coordinates authentication, theme state, routing, and the main application shell. */
import { useEffect, useLayoutEffect, useState } from 'react';
import { getToken, setToken } from './api';
import Shell from './components/Shell';
import { navigate, useRoute } from './router';
import { DataProvider } from './store';
import ActivityPage from './pages/ActivityPage';
import CardPage from './pages/CardPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import SendPage from './pages/SendPage';
import { readTheme, saveTheme, type ThemeMode } from './theme';

export default function App() {
  const [loggedIn, setLoggedIn] = useState<boolean>(getToken() !== null);
  const [theme, setTheme] = useState<ThemeMode>(readTheme);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    themeColor?.setAttribute('content', theme === 'dark' ? '#000000' : '#FFFFFF');
  }, [theme]);

  // The API layer fires this event when the server says our token is invalid/expired.
  useEffect(() => {
    const onUnauthorized = () => setLoggedIn(false);
    window.addEventListener('swift:unauthorized', onUnauthorized);
    return () => window.removeEventListener('swift:unauthorized', onUnauthorized);
  }, []);

  function logout() {
    setToken(null);
    setLoggedIn(false);
    window.location.hash = '';
  }

  function changeTheme(nextTheme: ThemeMode) {
    saveTheme(nextTheme);
    setTheme(nextTheme);
  }

  if (!loggedIn) {
    return <LoginPage onAuthenticated={() => { navigate('home'); setLoggedIn(true); }} />;
  }

  return (
    <DataProvider>
      <Pages onLogout={logout} theme={theme} onThemeChange={changeTheme} />
    </DataProvider>
  );
}

function Pages({
  onLogout,
  theme,
  onThemeChange,
}: {
  onLogout: () => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}) {
  const { page, param } = useRoute();
  return (
    <Shell onLogout={onLogout}>
      <div key={page} className="animate-fade-up">
        {page === 'home' && <HomePage />}
        {page === 'send' && <SendPage key={param ?? 'new'} initialHandle={param} />}
        {page === 'card' && <CardPage />}
        {page === 'activity' && <ActivityPage />}
        {page === 'profile' && <ProfilePage onLogout={onLogout} theme={theme} onThemeChange={onThemeChange} />}
      </div>
    </Shell>
  );
}
