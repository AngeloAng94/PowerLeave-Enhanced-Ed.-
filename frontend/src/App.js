import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <AppRouter />
    </AuthProvider>
  );
}

function AppRouter() {
  const { user, loading } = useAuth();
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--background)',
      }}>
        <div style={{
          width: '40px', height: '40px', border: '3px solid var(--primary)',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
      </div>
    );
  }

  // Public routes
  if (hash.startsWith('#/login')) return <LoginPage />;
  if (hash.startsWith('#/register')) return <RegisterPage />;
  if (hash.startsWith('#/auth/callback')) return <AuthCallback />;

  // Protected route
  if (hash.startsWith('#/dashboard') && user) return <Dashboard />;

  // Default: if authenticated, go to dashboard; else show landing
  if (user) return <Dashboard />;
  return <LandingPage />;
}

export default App;
