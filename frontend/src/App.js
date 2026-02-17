import React, { useState, useEffect, createContext, useContext } from 'react';
import { Toaster, toast } from 'sonner';

// ============== CONSTANTS ==============
const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_hr-powerup/artifacts/roxglb36_ChatGPT%20Image%2017%20feb%202026%2C%2010_27_22.png';

// ============== CONTEXT ==============
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// ============== API HELPERS ==============
const api = {
  async fetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Errore di rete' }));
      throw new Error(error.detail || 'Errore sconosciuto');
    }

    return response.json();
  },
  get: (endpoint) => api.fetch(endpoint),
  post: (endpoint, data) => api.fetch(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data) => api.fetch(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint) => api.fetch(endpoint, { method: 'DELETE' }),
};

// ============== AUTH PROVIDER ==============
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await api.get('/api/auth/me');
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password });
    if (data.token) localStorage.setItem('token', data.token);
    setUser(data);
    return data;
  };

  const register = async (name, email, password, organizationName) => {
    const data = await api.post('/api/auth/register', { 
      name, 
      email, 
      password, 
      organization_name: organizationName 
    });
    if (data.token) localStorage.setItem('token', data.token);
    setUser(data);
    return data;
  };

  const loginWithGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const processSession = async (sessionId) => {
    const data = await api.post('/api/auth/session', { session_id: sessionId });
    setUser(data);
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout', {});
    } catch {}
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, processSession, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

// ============== ICONS ==============
const Icons = {
  Calendar: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  ),
  Chart: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Home: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Plane: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  X: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Menu: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Sun: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Moon: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  Google: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ),
};

// ============== THEME TOGGLE ==============
function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  return (
    <button
      data-testid="theme-toggle"
      onClick={() => setDark(!dark)}
      className="p-2 rounded-lg hover:bg-muted transition-colors"
    >
      {dark ? <Icons.Sun /> : <Icons.Moon />}
    </button>
  );
}

// ============== LANDING PAGE ==============
function LandingPage() {
  const { loginWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RocketLogo size={40} />
            <span className="text-xl font-bold" style={{fontFamily: 'Inter, sans-serif'}}>
              <span style={{fontWeight: 600}}>Power</span>
              <span style={{fontWeight: 700}}>Leave</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <a href="#features" className="hidden md:inline text-muted-foreground hover:text-foreground transition-colors">
              Funzionalità
            </a>
            <a href="#pricing" className="hidden md:inline text-muted-foreground hover:text-foreground transition-colors">
              Prezzi
            </a>
            <button
              data-testid="login-btn"
              onClick={() => window.location.hash = '#/login'}
              className="btn-outline text-sm py-2 px-4"
            >
              Accedi
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4" style={{background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'}}>
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white">
                Gestisci le ferie del tuo team con{' '}
                <span style={{color: '#3B82F6'}}>semplicità</span>
              </h1>
              <p className="text-xl mb-8 leading-relaxed" style={{color: '#94A3B8'}}>
                PowerLeave è la piattaforma moderna per le PMI italiane. 
                Richieste, approvazioni e calendario in un'unica soluzione intuitiva.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  data-testid="cta-start-free"
                  onClick={() => window.location.hash = '#/register'}
                  className="btn-primary text-lg"
                  style={{backgroundColor: '#2563EB'}}
                >
                  Inizia Gratis
                </button>
                <button
                  data-testid="cta-google"
                  onClick={loginWithGoogle}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium border-2"
                  style={{borderColor: '#3B82F6', color: '#3B82F6', backgroundColor: 'transparent'}}
                >
                  <Icons.Google />
                  Continua con Google
                </button>
              </div>
              <p className="mt-6 text-sm" style={{color: '#64748B'}}>
                ✓ Gratis fino a 5 dipendenti · ✓ Nessuna carta richiesta
              </p>
              <div className="mt-6 p-4 rounded-lg" style={{backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)'}}>
                <p className="text-sm" style={{color: '#93C5FD'}}>
                  <strong>🎯 Demo:</strong> Accedi con <strong>admin@demo.it</strong> / <strong>demo123</strong>
                </p>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="p-8 rounded-2xl" style={{backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(59, 130, 246, 0.2)'}}>
                <img
                  src={LOGO_URL}
                  alt="PowerLeave Logo"
                  className="w-full max-w-md mx-auto rounded-xl"
                  style={{boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.25)'}}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Credentials Banner */}
      <section className="py-4" style={{backgroundColor: '#2563EB'}}>
        <div className="container mx-auto text-center">
          <p className="text-white font-medium">
            🚀 Prova subito! Login demo: <strong>admin@demo.it</strong> | Password: <strong>demo123</strong>
          </p>
        </div>
      </section>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-muted/50">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Tutto ciò di cui hai bisogno
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Una piattaforma completa per gestire ferie, permessi e assenze del tuo team
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Icons.Calendar />,
                title: 'Calendario Condiviso',
                desc: 'Visualizza le assenze del team in un calendario intuitivo con filtri avanzati.'
              },
              {
                icon: <Icons.Clock />,
                title: 'Approvazioni Veloci',
                desc: 'Approva o rifiuta richieste con un click. Notifiche immediate al dipendente.'
              },
              {
                icon: <Icons.Chart />,
                title: 'Report Dettagliati',
                desc: 'Statistiche sull\'utilizzo delle ferie, saldi residui e tendenze del team.'
              },
              {
                icon: <Icons.Users />,
                title: 'Gestione Team',
                desc: 'Aggiungi membri, assegna ruoli e gestisci i permessi facilmente.'
              },
              {
                icon: <Icons.Settings />,
                title: 'Personalizzabile',
                desc: 'Configura tipi di assenza, festività aziendali e politiche ferie.'
              },
              {
                icon: <Icons.Plane />,
                title: 'Mobile Ready',
                desc: 'Richiedi e approva ferie ovunque tu sia, da qualsiasi dispositivo.'
              },
            ].map((feature, i) => (
              <div key={i} className="bg-card p-6 rounded-xl border card-hover">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Prezzi semplici e trasparenti
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            Scegli il piano adatto alla tua azienda
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card p-8 rounded-2xl border">
              <h3 className="text-xl font-semibold mb-2">Starter</h3>
              <p className="text-muted-foreground mb-4">Per piccoli team</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">€0</span>
                <span className="text-muted-foreground">/mese</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Fino a 5 dipendenti', 'Calendario condiviso', 'Richieste illimitate', 'Supporto email'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Icons.Check />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                data-testid="pricing-starter"
                onClick={() => window.location.hash = '#/register'}
                className="w-full btn-outline"
              >
                Inizia Gratis
              </button>
            </div>
            <div className="bg-primary text-primary-foreground p-8 rounded-2xl relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-full">
                POPOLARE
              </div>
              <h3 className="text-xl font-semibold mb-2">Business</h3>
              <p className="opacity-80 mb-4">Per aziende in crescita</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">€4</span>
                <span className="opacity-80">/utente/mese</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Dipendenti illimitati', 'Report avanzati', 'Integrazione calendario', 'API access', 'Supporto prioritario'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Icons.Check />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                data-testid="pricing-business"
                onClick={() => window.location.hash = '#/register'}
                className="w-full bg-white text-primary hover:bg-white/90 px-6 py-3 rounded-full font-medium transition-colors"
              >
                Prova 14 Giorni Gratis
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">P</span>
              </div>
              <span className="font-semibold">PowerLeave</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2026 PowerLeave. Tutti i diritti riservati.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============== AUTH PAGES ==============
function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      window.location.hash = '#/dashboard';
      toast.success('Benvenuto!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="bg-card p-8 rounded-2xl border shadow-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-foreground font-bold text-2xl">P</span>
            </div>
            <h1 className="text-2xl font-bold">Bentornato</h1>
            <p className="text-muted-foreground">Accedi al tuo account PowerLeave</p>
          </div>

          <button
            data-testid="google-login-btn"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-2 border rounded-lg py-3 mb-6 hover:bg-muted transition-colors"
          >
            <Icons.Google />
            Continua con Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">oppure</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                data-testid="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                placeholder="nome@azienda.it"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                data-testid="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              data-testid="login-submit"
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? 'Accesso...' : 'Accedi'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            Non hai un account?{' '}
            <a href="#/register" className="text-primary hover:underline">
              Registrati
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password, orgName);
      window.location.hash = '#/dashboard';
      toast.success('Account creato con successo!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card p-8 rounded-2xl border shadow-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-foreground font-bold text-2xl">P</span>
            </div>
            <h1 className="text-2xl font-bold">Crea il tuo account</h1>
            <p className="text-muted-foreground">Inizia a gestire le ferie del tuo team</p>
          </div>

          <button
            data-testid="google-register-btn"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-2 border rounded-lg py-3 mb-6 hover:bg-muted transition-colors"
          >
            <Icons.Google />
            Registrati con Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">oppure</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome Completo</label>
              <input
                data-testid="name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                placeholder="Mario Rossi"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nome Azienda</label>
              <input
                data-testid="org-input"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                placeholder="Azienda S.r.l."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                data-testid="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                placeholder="nome@azienda.it"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                data-testid="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                placeholder="Minimo 6 caratteri"
                required
                minLength={6}
              />
            </div>
            <button
              data-testid="register-submit"
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? 'Creazione...' : 'Crea Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            Hai già un account?{' '}
            <a href="#/login" className="text-primary hover:underline">
              Accedi
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function AuthCallback() {
  const { processSession } = useAuth();
  const [error, setError] = useState(null);
  const hasProcessed = React.useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const sessionMatch = hash.match(/session_id=([^&]+)/);
    
    if (sessionMatch) {
      const sessionId = sessionMatch[1];
      processSession(sessionId)
        .then(() => {
          window.location.hash = '#/dashboard';
          toast.success('Accesso effettuato!');
        })
        .catch((err) => {
          setError(err.message);
          toast.error('Errore durante l\'accesso');
        });
    } else {
      setError('Sessione non valida');
    }
  }, [processSession]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <a href="#/login" className="text-primary hover:underline">
            Torna al login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Accesso in corso...</p>
      </div>
    </div>
  );
}

// ============== DASHBOARD ==============
function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Form state
  const [formData, setFormData] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    hours: '8',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, typesData, requestsData] = await Promise.all([
        api.get('/api/stats'),
        api.get('/api/leave-types'),
        api.get('/api/leave-requests'),
      ]);
      setStats(statsData);
      setLeaveTypes(typesData);
      
      if (user?.role === 'admin') {
        setPendingRequests(requestsData.filter(r => r.status === 'pending'));
      }
      setMyRequests(requestsData.filter(r => r.user_id === user?.user_id));
    } catch (err) {
      toast.error('Errore nel caricamento dati');
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/leave-requests', formData);
      toast.success('Richiesta inviata!');
      setShowRequestForm(false);
      setFormData({ leave_type_id: '', start_date: '', end_date: '', hours: '8', notes: '' });
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReview = async (requestId, status) => {
    try {
      await api.put(`/api/leave-requests/${requestId}/review`, { status });
      toast.success(status === 'approved' ? 'Richiesta approvata!' : 'Richiesta rifiutata');
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.hash = '#/';
  };

  const navItems = [
    { id: 'dashboard', icon: <Icons.Home />, label: 'Dashboard' },
    { id: 'calendar', icon: <Icons.Calendar />, label: 'Calendario' },
    { id: 'team', icon: <Icons.Users />, label: 'Team' },
    { id: 'settings', icon: <Icons.Settings />, label: 'Impostazioni' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-card border-r transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">P</span>
            </div>
            <span className="font-bold text-lg">PowerLeave</span>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg mb-6">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-primary font-semibold">{user?.name?.[0] || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.role === 'admin' ? 'Amministratore' : 'Membro'}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                data-testid={`nav-${item.id}`}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t">
          <button
            data-testid="new-request-btn"
            onClick={() => setShowRequestForm(true)}
            className="w-full btn-primary flex items-center justify-center gap-2 mb-3"
          >
            <Icons.Plus />
            Nuova Richiesta
          </button>
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <button
              data-testid="logout-btn"
              onClick={handleLogout}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icons.Logout />
              Esci
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b p-4 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
          <Icons.Menu />
        </button>
        <span className="font-bold">PowerLeave</span>
        <ThemeToggle />
      </div>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8 pt-20 md:pt-8 overflow-auto">
        {currentPage === 'dashboard' && (
          <DashboardContent
            stats={stats}
            pendingRequests={pendingRequests}
            myRequests={myRequests}
            user={user}
            onReview={handleReview}
          />
        )}
        {currentPage === 'calendar' && <CalendarPage />}
        {currentPage === 'team' && <TeamPage />}
        {currentPage === 'settings' && <SettingsPage />}
      </main>

      {/* Request Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Nuova Richiesta</h2>
              <button onClick={() => setShowRequestForm(false)} className="p-2 hover:bg-muted rounded-lg">
                <Icons.X />
              </button>
            </div>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo di Assenza</label>
                <select
                  data-testid="leave-type-select"
                  value={formData.leave_type_id}
                  onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border bg-background"
                  required
                >
                  <option value="">Seleziona...</option>
                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Data Inizio</label>
                  <input
                    data-testid="start-date-input"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border bg-background"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Data Fine</label>
                  <input
                    data-testid="end-date-input"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border bg-background"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ore per Giorno</label>
                <select
                  data-testid="hours-select"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border bg-background"
                >
                  <option value="2">2 ore (Permesso breve)</option>
                  <option value="4">4 ore (Mezza giornata)</option>
                  <option value="8">8 ore (Giornata intera)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Note (opzionale)</label>
                <textarea
                  data-testid="notes-input"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border bg-background resize-none"
                  rows={3}
                  placeholder="Motivo della richiesta..."
                />
              </div>
              <button data-testid="submit-request-btn" type="submit" className="w-full btn-primary">
                Invia Richiesta
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

// ============== DASHBOARD CONTENT ==============
function DashboardContent({ stats, pendingRequests, myRequests, user, onReview }) {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Bentornato, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Ecco la panoramica delle ferie del tuo team</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div data-testid="stat-approved" className="bg-card p-6 rounded-xl border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600">
              <Icons.Check />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ferie Approvate</p>
              <p className="text-2xl font-bold">{stats?.approved_count || 0}</p>
            </div>
          </div>
        </div>
        <div data-testid="stat-pending" className="bg-card p-6 rounded-xl border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center text-orange-600">
              <Icons.Clock />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Attesa</p>
              <p className="text-2xl font-bold">{stats?.pending_count || 0}</p>
            </div>
          </div>
        </div>
        <div data-testid="stat-available" className="bg-card p-6 rounded-xl border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600">
              <Icons.Users />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Staff Disponibile</p>
              <p className="text-2xl font-bold">{stats?.available_staff || 0}/{stats?.total_staff || 0}</p>
            </div>
          </div>
        </div>
        <div data-testid="stat-utilization" className="bg-card p-6 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Utilizzo Ferie</p>
              <p className="text-2xl font-bold">{stats?.utilization_rate || 0}%</p>
            </div>
            <div className="relative w-14 h-14">
              <svg className="w-full h-full -rotate-90">
                <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted opacity-20" />
                <circle
                  cx="28" cy="28" r="24"
                  fill="none" stroke="currentColor" strokeWidth="4"
                  strokeDasharray={`${((stats?.utilization_rate || 0) / 100) * 150.8} 150.8`}
                  className="text-primary"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals (Admin) or My Requests (User) */}
        {user?.role === 'admin' ? (
          <div className="bg-card p-6 rounded-xl border">
            <h2 className="text-lg font-semibold mb-4">Richieste da Approvare</h2>
            {pendingRequests?.length > 0 ? (
              <div className="space-y-4">
                {pendingRequests.slice(0, 5).map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold">{req.user_name?.[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium">{req.user_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {req.leave_type_name} · {req.start_date} - {req.end_date}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        data-testid={`approve-${req.id}`}
                        onClick={() => onReview(req.id, 'approved')}
                        className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <Icons.Check />
                      </button>
                      <button
                        data-testid={`reject-${req.id}`}
                        onClick={() => onReview(req.id, 'rejected')}
                        className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Icons.X />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nessuna richiesta in attesa</p>
            )}
          </div>
        ) : (
          <div className="bg-card p-6 rounded-xl border">
            <h2 className="text-lg font-semibold mb-4">Le Mie Richieste</h2>
            {myRequests?.length > 0 ? (
              <div className="space-y-4">
                {myRequests.slice(0, 5).map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{req.leave_type_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {req.start_date} - {req.end_date} · {req.hours}h/giorno
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      req.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                      req.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                      'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
                    }`}>
                      {req.status === 'approved' ? 'Approvata' : req.status === 'rejected' ? 'Rifiutata' : 'In Attesa'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nessuna richiesta</p>
            )}
          </div>
        )}

        {/* Quick Calendar Preview */}
        <div className="bg-card p-6 rounded-xl border">
          <h2 className="text-lg font-semibold mb-4">Prossime Assenze</h2>
          <MiniCalendar />
        </div>
      </div>
    </div>
  );
}

// ============== MINI CALENDAR ==============
function MiniCalendar() {
  const [leaves, setLeaves] = useState([]);
  const now = new Date();

  useEffect(() => {
    api.get(`/api/calendar/monthly?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
      .then(setLeaves)
      .catch(() => {});
  }, []);

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

  return (
    <div>
      <p className="text-center font-medium mb-4">{months[now.getMonth()]} {now.getFullYear()}</p>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((d, i) => (
          <div key={i} className="text-xs font-medium text-muted-foreground py-2">{d}</div>
        ))}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const hasLeave = leaves.some(l => l.start_date <= dateStr && l.end_date >= dateStr && l.status === 'approved');
          const isToday = day === now.getDate();

          return (
            <div
              key={day}
              className={`aspect-square flex items-center justify-center text-sm rounded-lg ${
                isToday ? 'bg-primary text-primary-foreground font-bold' :
                hasLeave ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : ''
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============== CALENDAR PAGE ==============
function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [leaves, setLeaves] = useState([]);
  const [closures, setClosures] = useState([]);

  useEffect(() => {
    loadCalendarData();
  }, [currentMonth]);

  const loadCalendarData = async () => {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const [leavesData, closuresData] = await Promise.all([
        api.get(`/api/calendar/monthly?year=${year}&month=${month}`),
        api.get(`/api/calendar/closures?year=${year}&month=${month}`),
      ]);
      setLeaves(leavesData);
      setClosures(closuresData);
    } catch {}
  };

  const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Calendario Ferie</h1>
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 hover:bg-muted rounded-lg"><Icons.ChevronLeft /></button>
          <span className="font-semibold min-w-[150px] text-center">
            {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-lg"><Icons.ChevronRight /></button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span>Approvate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500"></div>
          <span>In Attesa</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-600"></div>
          <span>Festività</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500"></div>
          <span>Chiusura Aziendale</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card rounded-xl border p-4">
        <div className="grid grid-cols-7 gap-2">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((d) => (
            <div key={d} className="text-center font-semibold text-muted-foreground py-3">{d}</div>
          ))}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayLeaves = leaves.filter(l => l.start_date <= dateStr && l.end_date >= dateStr);
            const closure = closures.find(c => c.date === dateStr);
            const isToday = day === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear();
            const isWeekend = (startOffset + i) % 7 >= 5;

            return (
              <div
                key={day}
                className={`min-h-[100px] p-2 rounded-lg border ${
                  isToday ? 'ring-2 ring-primary border-primary' :
                  closure?.type === 'holiday' ? 'bg-red-100 dark:bg-red-900/20 border-red-300' :
                  closure?.type === 'shutdown' ? 'bg-amber-100 dark:bg-amber-900/20 border-amber-300' :
                  isWeekend ? 'bg-muted/50' : ''
                }`}
              >
                <span className={`text-sm font-medium ${isToday ? 'text-primary' : isWeekend ? 'text-muted-foreground' : ''}`}>
                  {day}
                </span>
                {closure && (
                  <div className={`text-xs mt-1 ${closure.type === 'holiday' ? 'text-red-600' : 'text-amber-600'}`}>
                    {closure.reason}
                  </div>
                )}
                <div className="mt-1 space-y-1">
                  {dayLeaves.slice(0, 3).map((leave, idx) => (
                    <div
                      key={idx}
                      className={`text-xs px-2 py-0.5 rounded truncate ${
                        leave.status === 'approved' ? 'bg-green-500 text-white' :
                        leave.status === 'pending' ? 'bg-orange-500 text-white' :
                        'bg-gray-400 text-white'
                      }`}
                      title={`${leave.user_name} - ${leave.leave_type_name}`}
                    >
                      {leave.user_name?.split(' ')[0]}
                    </div>
                  ))}
                  {dayLeaves.length > 3 && (
                    <div className="text-xs text-muted-foreground">+{dayLeaves.length - 3}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============== TEAM PAGE ==============
function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteData, setInviteData] = useState({ name: '', email: '', role: 'user' });

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      const data = await api.get('/api/team');
      setMembers(data);
    } catch {}
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      const result = await api.post('/api/team/invite', inviteData);
      toast.success(`Utente creato! Password: ${result.temp_password}`);
      setShowInvite(false);
      setInviteData({ name: '', email: '', role: 'user' });
      loadTeam();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm('Sei sicuro di voler rimuovere questo membro?')) return;
    try {
      await api.delete(`/api/team/${userId}`);
      toast.success('Membro rimosso');
      loadTeam();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Gestione Team</h1>
        {user?.role === 'admin' && (
          <button
            data-testid="invite-btn"
            onClick={() => setShowInvite(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Icons.Plus />
            Invita Membro
          </button>
        )}
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-6 py-4 font-semibold">Nome</th>
                <th className="text-left px-6 py-4 font-semibold">Email</th>
                <th className="text-left px-6 py-4 font-semibold">Ruolo</th>
                {user?.role === 'admin' && <th className="text-right px-6 py-4 font-semibold">Azioni</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.user_id} className="border-t">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold">{member.name?.[0]}</span>
                      </div>
                      <span className="font-medium">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{member.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      member.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-muted'
                    }`}>
                      {member.role === 'admin' ? 'Admin' : 'Membro'}
                    </span>
                  </td>
                  {user?.role === 'admin' && (
                    <td className="px-6 py-4 text-right">
                      {member.user_id !== user.user_id && (
                        <button
                          data-testid={`remove-${member.user_id}`}
                          onClick={() => handleRemove(member.user_id)}
                          className="text-destructive hover:underline text-sm"
                        >
                          Rimuovi
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Invita Membro</h2>
              <button onClick={() => setShowInvite(false)} className="p-2 hover:bg-muted rounded-lg">
                <Icons.X />
              </button>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome</label>
                <input
                  data-testid="invite-name"
                  type="text"
                  value={inviteData.name}
                  onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border bg-background"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  data-testid="invite-email"
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border bg-background"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ruolo</label>
                <select
                  data-testid="invite-role"
                  value={inviteData.role}
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border bg-background"
                >
                  <option value="user">Membro</option>
                  <option value="admin">Amministratore</option>
                </select>
              </div>
              <button data-testid="invite-submit" type="submit" className="w-full btn-primary">
                Invita
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============== SETTINGS PAGE ==============
function SettingsPage() {
  const { user } = useAuth();
  const [org, setOrg] = useState(null);
  const [orgName, setOrgName] = useState('');
  const [balances, setBalances] = useState([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [orgData, balancesData] = await Promise.all([
        api.get('/api/organization'),
        api.get('/api/leave-balances'),
      ]);
      setOrg(orgData);
      setOrgName(orgData?.name || '');
      setBalances(balancesData);
    } catch {}
  };

  const handleUpdateOrg = async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/organization', { name: orgName });
      toast.success('Azienda aggiornata');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Impostazioni</h1>

      {/* Organization Settings */}
      {user?.role === 'admin' && (
        <div className="bg-card p-6 rounded-xl border">
          <h2 className="text-lg font-semibold mb-4">Dati Azienda</h2>
          <form onSubmit={handleUpdateOrg} className="flex gap-4">
            <input
              data-testid="org-name-input"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg border bg-background"
              placeholder="Nome azienda"
            />
            <button data-testid="save-org-btn" type="submit" className="btn-primary">
              Salva
            </button>
          </form>
        </div>
      )}

      {/* Leave Balances */}
      <div className="bg-card p-6 rounded-xl border">
        <h2 className="text-lg font-semibold mb-4">Saldi Ferie {new Date().getFullYear()}</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Dipendente</th>
                <th className="text-left px-4 py-3 font-semibold">Tipo</th>
                <th className="text-right px-4 py-3 font-semibold">Totali</th>
                <th className="text-right px-4 py-3 font-semibold">Usati</th>
                <th className="text-right px-4 py-3 font-semibold">Residui</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((b, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3 font-medium">{b.user_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.leave_type_name}</td>
                  <td className="px-4 py-3 text-right">{b.total_days}</td>
                  <td className="px-4 py-3 text-right">{b.used_days}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">{b.remaining_days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============== MAIN APP ==============
function App() {
  return (
    <AuthProvider>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

function AppRouter() {
  const { user, loading } = useAuth();
  const [route, setRoute] = useState(window.location.hash.slice(2) || '');

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash.slice(2) || '');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Check for session_id in URL (OAuth callback)
  if (window.location.hash.includes('session_id=')) {
    return <AuthCallback />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Public routes
  if (route === '' || route === '/') return <LandingPage />;
  if (route === 'login') return <LoginPage />;
  if (route === 'register') return <RegisterPage />;
  if (route === 'auth/callback') return <AuthCallback />;

  // Protected routes
  if (!user) {
    window.location.hash = '#/login';
    return null;
  }

  if (route === 'dashboard' || route.startsWith('dashboard')) return <Dashboard />;

  // Default to dashboard for authenticated users
  return <Dashboard />;
}

export default App;
