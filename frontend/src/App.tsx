import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/admin/AdminDashboard';
import Dashboard from './pages/user/Dashboard';
import { clearStoredSession, getStoredSession, setStoredSession, setSignupSuccessState, type AuthSession, } from './data/auth';
import {
  clearStoredAdminSession,
  getStoredAdminSession,
  setStoredAdminSession,
  type AdminSession,
} from './data/adminAuth';

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
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => getStoredAdminSession());
  const routeKey = route.toLowerCase();

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

  const handleAdminAuthenticated = (nextSession: AdminSession) => {
    setStoredAdminSession(nextSession);
    setAdminSession(nextSession);
    window.location.hash = '/admin/dashboard';
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

  const handleAdminLogout = () => {
    clearStoredAdminSession();
    setAdminSession(null);
    window.location.hash = '/login';
  };

  if (routeKey === '/home') {
    return <Home />;
  }

  if (routeKey === '/admin' || routeKey === '/admin/dashboard' || routeKey === '/admin-login') {
    if (adminSession) {
      return <AdminDashboard session={adminSession} onLogout={handleAdminLogout} />;
    }

    return <Login onAuthenticated={handleAuthenticated} onAdminAuthenticated={handleAdminAuthenticated} />;
  }

  if (routeKey === '/dashboard') {
    if (session) {
      return <Dashboard session={session} onLogout={handleLogout} />;
    }

    return <Login onAuthenticated={handleAuthenticated} onAdminAuthenticated={handleAdminAuthenticated} />;
  }

  if (session && routeKey !== '/login' && routeKey !== '/signup') {
    return <Dashboard session={session} onLogout={handleLogout} />;
  }

  if (routeKey === '/login') {
    return <Login onAuthenticated={handleAuthenticated} onAdminAuthenticated={handleAdminAuthenticated} />;
  }

  if (routeKey === '/signup') {
    return <Signup onSignupSuccess={handleSignupSuccess} />;
  }

  return (
    <Home />
  );
}

export default App;
