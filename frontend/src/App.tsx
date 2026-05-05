import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';

const getCurrentRoute = () => {
  const hash = window.location.hash.replace(/^#/, '');

  if (!hash) {
    return '/';
  }

  return hash.startsWith('/') ? hash : `/${hash}`;
};

function App() {
  const [route, setRoute] = useState(getCurrentRoute);

  useEffect(() => {
    const handleRouteChange = () => {
      setRoute(getCurrentRoute());
    };

    window.addEventListener('hashchange', handleRouteChange);

    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  if (route === '/login') {
    return <Login />;
  }

  if (route === '/signup') {
    return <Signup />;
  }

  return (
    <Home />
  );
}

export default App;
