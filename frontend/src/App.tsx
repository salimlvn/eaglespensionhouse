import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/user/Dashboard';
import { clearStoredSession, getStoredSession, setStoredSession, setSignupSuccessState, type AuthSession, } from './data/auth';

const getCurrentRoute = () => {
  const hash = window.location.hash.replace(/^#/, '');

  if (!hash) {
    return '/';
  }

  return hash.startsWith('/') ? hash : `/${hash}`;
};

function App() {
  const [route, setRoute] = useState(getCurrentRoute);
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());

  useEffect(() => {
    const handleRouteChange = () => {
      setRoute(getCurrentRoute());
    };

    window.addEventListener('hashchange', handleRouteChange);

    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  const handleAuthenticated = (nextSession: AuthSession) => {
    setStoredSession(nextSession);
    setSession(nextSession);
    window.location.hash = '/dashboard';
  };

  const handleSignupSuccess = (email: string) => {
    setSignupSuccessState(email);
    window.location.hash = '/login';
  };

  const handleLogout = () => {
    clearStoredSession();
    setSession(null);
    window.location.hash = '/';
  };

  if (route === '/home') {
    return <Home />;
  }

  if (route === '/dashboard') {
    if (session) {
      return <Dashboard session={session} onLogout={handleLogout} />;
    }

    return <Login onAuthenticated={handleAuthenticated} />;
  }

  if (session && route !== '/login' && route !== '/signup') {
    return <Dashboard session={session} onLogout={handleLogout} />;
  }

  if (route === '/login') {
    return <Login onAuthenticated={handleAuthenticated} />;
  }

  if (route === '/signup') {
    return <Signup onSignupSuccess={handleSignupSuccess} />;
  }

  return (
    <Home />
  );
}

export default App;
