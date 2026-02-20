import React, { useEffect, useState } from 'react';
import api from '../lib/api';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function AuthCallback() {
  const [status, setStatus] = useState('Elaborazione login...');

  useEffect(() => {
    const processCallback = async () => {
      const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const sessionId = params.get('session_id');

      if (!sessionId) {
        setStatus('Errore: sessione non trovata');
        setTimeout(() => { window.location.hash = '#/login'; }, 2000);
        return;
      }

      try {
        const data = await api.post('/api/auth/session', { session_id: sessionId });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        window.location.hash = '#/dashboard';
        window.location.reload();
      } catch (err) {
        setStatus('Errore di autenticazione: ' + (err.message || 'Riprova'));
        setTimeout(() => { window.location.hash = '#/login'; }, 3000);
      }
    };
    processCallback();
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--background)',
    }}>
      <div style={{
        textAlign: 'center', padding: '40px',
        background: 'var(--card)', borderRadius: '16px',
        border: '1px solid var(--border)',
      }}>
        <div style={{
          width: '40px', height: '40px', border: '3px solid var(--primary)',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 1s linear infinite', margin: '0 auto 16px',
        }} />
        <p style={{ color: 'var(--foreground)', fontSize: '16px' }}>{status}</p>
      </div>
    </div>
  );
}
