import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RocketLogo } from '../components/Icons';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      window.location.hash = '#/dashboard';
    } catch (err) {
      setError(err.message || 'Errore di login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--background)', padding: '20px',
    }}>
      <div style={{
        width: '100%', maxWidth: '400px', padding: '40px',
        background: 'var(--card)', borderRadius: '16px',
        border: '1px solid var(--border)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <RocketLogo size={48} />
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginTop: '12px', color: 'var(--foreground)' }}>Accedi a PowerLeave</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', marginTop: '4px' }}>Inserisci le tue credenziali</p>
        </div>

        {error && (
          <div data-testid="login-error" style={{
            padding: '12px', borderRadius: '8px', background: '#FEE2E2',
            color: '#DC2626', fontSize: '13px', marginBottom: '16px',
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--foreground)' }}>Email</label>
            <input data-testid="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="nome@azienda.it" style={{
              width: '100%', padding: '10px 12px', borderRadius: '8px',
              border: '1px solid var(--border)', background: 'var(--input-bg)',
              color: 'var(--foreground)', fontSize: '14px', outline: 'none',
              boxSizing: 'border-box',
            }} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--foreground)' }}>Password</label>
            <input data-testid="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" style={{
              width: '100%', padding: '10px 12px', borderRadius: '8px',
              border: '1px solid var(--border)', background: 'var(--input-bg)',
              color: 'var(--foreground)', fontSize: '14px', outline: 'none',
              boxSizing: 'border-box',
            }} />
          </div>
          <button data-testid="login-submit" type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', borderRadius: '8px',
            background: 'var(--primary)', color: 'white', border: 'none',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>

        <div style={{ margin: '20px 0', textAlign: 'center', fontSize: '13px', color: 'var(--muted-foreground)' }}>oppure</div>

        <button data-testid="google-login" onClick={loginWithGoogle} style={{
          width: '100%', padding: '12px', borderRadius: '8px',
          background: 'var(--muted)', color: 'var(--foreground)',
          border: '1px solid var(--border)', fontSize: '14px',
          fontWeight: 500, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Accedi con Google
        </button>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--muted-foreground)' }}>
          Non hai un account? <a href="#/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>Registrati</a>
        </p>

        <div style={{ marginTop: '24px', padding: '12px', borderRadius: '8px', background: 'var(--muted)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
          <strong>Demo:</strong> admin@demo.it / demo123
        </div>
      </div>
    </div>
  );
}
