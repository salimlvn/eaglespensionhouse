import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StaffDashboard from './pages/staff/StaffDashboard';
import Dashboard from './pages/user/Dashboard';
import { clearStoredSession, getStoredSession, setStoredSession, setSignupSuccessState, type AuthSession, } from './data/auth';
import {
  clearStoredStaffSession,
  getStoredStaffSession,
  setStoredStaffSession,
  type StaffSession,
} from './data/staffAuth';

// Read the current hash route and normalize it to a slash-prefixed path.
const getCurrentRoute = () => {
  const hash = window.location.hash.replace(/^#/, '');

  if (!hash) {
    return '/';
  }

  return hash.startsWith('/') ? hash : `/${hash}`;
};

function App() {
  // Keep the active route and both session types in React state.
  const [route, setRoute] = useState(getCurrentRoute);
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());
  const [staffSession, setStaffSession] = useState<StaffSession | null>(() => getStoredStaffSession());
  const routeKey = route.toLowerCase();

  // Re-render the app whenever the hash route changes.
  useEffect(() => {
    const handleRouteChange = () => {
      setRoute(getCurrentRoute());
    };

    window.addEventListener('hashchange', handleRouteChange);

    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  // Save a guest session and move the user to the guest dashboard.
  const handleAuthenticated = (nextSession: AuthSession) => {
    setStoredSession(nextSession);
    setSession(nextSession);
    window.location.hash = '/dashboard';
  };

  // Save a staff session and move the staff user to the staff area.
  const handleStaffAuthenticated = (nextSession: StaffSession) => {
    setStoredStaffSession(nextSession);
    setStaffSession(nextSession);
    window.location.hash = '/staff/dashboard';
  };

  // Store the successful signup email so the login page can show a message.
  const handleSignupSuccess = (email: string) => {
    setSignupSuccessState(email);
    window.location.hash = '/login';
  };

  // Clear the guest session and return to the public homepage.
  const handleLogout = () => {
    clearStoredSession();
    setSession(null);
    window.location.hash = '/';
  };

  // Clear the staff session and return to the login page.
  const handleStaffLogout = () => {
    clearStoredStaffSession();
    setStaffSession(null);
    window.location.hash = '/login';
  };

  // Route public, staff, and guest pages from the URL hash.
  if (routeKey === '/home') {
    return <Home />;
  }

  if (
    routeKey === '/staff' ||
    routeKey === '/staff/dashboard' ||
    routeKey === '/staff-login' ||
    routeKey === '/admin' ||
    routeKey === '/admin/dashboard' ||
    routeKey === '/admin-login'
  ) {
    if (staffSession) {
      return <StaffDashboard session={staffSession} onLogout={handleStaffLogout} />;
    }

    return <Login onAuthenticated={handleAuthenticated} onStaffAuthenticated={handleStaffAuthenticated} />;
  }

  if (routeKey === '/dashboard') {
    if (session) {
      return <Dashboard session={session} onLogout={handleLogout} />;
    }

    return <Login onAuthenticated={handleAuthenticated} onStaffAuthenticated={handleStaffAuthenticated} />;
  }

  if (session && routeKey !== '/login' && routeKey !== '/signup') {
    return <Dashboard session={session} onLogout={handleLogout} />;
  }

  if (routeKey === '/login') {
    return <Login onAuthenticated={handleAuthenticated} onStaffAuthenticated={handleStaffAuthenticated} />;
  }

  if (routeKey === '/signup') {
    return <Signup onSignupSuccess={handleSignupSuccess} />;
  }

  return (
    <Home />
  );
}

export default App;
