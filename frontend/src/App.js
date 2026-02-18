import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Toaster, toast } from 'sonner';

// ============== CONSTANTS ==============
const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_hr-powerup/artifacts/roxglb36_ChatGPT%20Image%2017%20feb%202026%2C%2010_27_22.png';

// ============== NOTIFICATION SYSTEM ==============
const NotificationService = {
  permission: 'default',
  
  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('Browser non supporta notifiche');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    }
    
    return false;
  },
  
  async sendNotification(title, options = {}) {
    // Always show toast
    const toastType = options.type || 'info';
    if (toastType === 'success') {
      toast.success(title, { description: options.body });
    } else if (toastType === 'error') {
      toast.error(title, { description: options.body });
    } else {
      toast(title, { description: options.body });
    }
    
    // Try browser notification
    if (this.permission === 'granted' || await this.requestPermission()) {
      try {
        new Notification(title, {
          body: options.body,
          icon: LOGO_URL,
          badge: LOGO_URL,
          tag: options.tag || 'powerleave',
          ...options
        });
      } catch (e) {
        console.log('Notifica browser non disponibile:', e);
      }
    }
  },
  
  // Specific notification types
  leaveApproved(userName, dates) {
    this.sendNotification('✅ Richiesta Approvata!', {
      body: `La richiesta ferie di ${userName} (${dates}) è stata approvata`,
      type: 'success',
      tag: 'leave-approved'
    });
  },
  
  leaveRejected(userName, dates) {
    this.sendNotification('❌ Richiesta Rifiutata', {
      body: `La richiesta ferie di ${userName} (${dates}) è stata rifiutata`,
      type: 'error', 
      tag: 'leave-rejected'
    });
  },
  
  newLeaveRequest(userName, dates) {
    this.sendNotification('📋 Nuova Richiesta Ferie', {
      body: `${userName} ha richiesto ferie per ${dates}`,
      type: 'info',
      tag: 'new-leave'
    });
  },
  
  closureException(userName, status) {
    const approved = status === 'approved';
    this.sendNotification(approved ? '✅ Deroga Approvata' : '❌ Deroga Rifiutata', {
      body: `La richiesta di deroga di ${userName} è stata ${approved ? 'approvata' : 'rifiutata'}`,
      type: approved ? 'success' : 'error',
      tag: 'closure-exception'
    });
  }
};

// ============== CONTEXT ==============
const AuthContext = createContext(null);
const NotificationContext = createContext(NotificationService);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const useNotifications = () => useContext(NotificationContext);

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
// Rocket Logo Component (matching the PowerLeave brand)
const RocketLogo = ({ size = 40, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={className}
    style={{filter: 'drop-shadow(0 2px 4px rgba(37, 99, 235, 0.3))'}}
  >
    <path 
      d="M45 85 L35 75 L40 65 L30 55 L35 45 L40 50 L50 30 L55 15 L60 30 L70 50 L65 45 L70 55 L60 65 L65 75 L55 85 L50 70 Z" 
      fill="#2563EB"
    />
  </svg>
);

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
  Megaphone: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  Lock: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
function ThemeToggle({ className = '' }) {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <button
      data-testid="theme-toggle"
      onClick={() => setDark(!dark)}
      className={`relative p-2.5 rounded-xl transition-all duration-300 ${
        dark 
          ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-yellow-300 shadow-lg shadow-indigo-500/30' 
          : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-400/30'
      } hover:scale-110 ${className}`}
      title={dark ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
    >
      <div className="relative w-5 h-5">
        {/* Sun */}
        <div className={`absolute inset-0 transition-all duration-500 ${dark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}>
          <Icons.Sun />
        </div>
        {/* Moon */}
        <div className={`absolute inset-0 transition-all duration-500 ${dark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`}>
          <Icons.Moon />
        </div>
      </div>
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
              <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                POPOLARE
              </div>
              <h3 className="text-xl font-semibold mb-2 mt-6">Business</h3>
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
    <div className="min-h-screen flex items-center justify-center px-4" style={{background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'}}>
      <div className="w-full max-w-md">
        <div className="bg-card p-8 rounded-2xl border shadow-lg">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4">
              <RocketLogo size={64} />
            </div>
            <h1 className="text-2xl font-bold">Bentornato</h1>
            <p className="text-muted-foreground">Accedi al tuo account PowerLeave</p>
          </div>

          {/* Demo credentials box */}
          <div className="mb-6 p-4 rounded-lg" style={{backgroundColor: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.3)'}}>
            <p className="text-sm text-center" style={{color: '#3B82F6'}}>
              <strong>Demo:</strong> admin@demo.it / demo123
            </p>
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'}}>
      <div className="w-full max-w-md">
        <div className="bg-card p-8 rounded-2xl border shadow-lg">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4">
              <RocketLogo size={64} />
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
      // Find the request to get user info
      const request = pendingRequests.find(r => r.id === requestId);
      await api.put(`/api/leave-requests/${requestId}/review`, { status });
      
      // Send notification
      const dates = request ? `${request.start_date} - ${request.end_date}` : '';
      const userName = request?.user_name || 'Dipendente';
      
      if (status === 'approved') {
        NotificationService.leaveApproved(userName, dates);
      } else {
        NotificationService.leaveRejected(userName, dates);
      }
      
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
    { id: 'requests', icon: <Icons.Plane />, label: 'Richieste Ferie' },
    { id: 'announcements', icon: <Icons.Megaphone />, label: 'Bacheca' },
    { id: 'closures', icon: <Icons.Lock />, label: 'Chiusure' },
    { id: 'team', icon: <Icons.Users />, label: 'Team' },
    { id: 'stats', icon: <Icons.Chart />, label: 'Statistiche' },
    { id: 'settings', icon: <Icons.Settings />, label: 'Impostazioni' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Layout with Sidebar */}
      <div className="hidden md:flex">
        {/* Desktop Sidebar - Modern design */}
        <aside className="w-72 h-screen bg-gradient-to-b from-card to-card/95 border-r flex flex-col sticky top-0">
          {/* Logo section */}
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                <RocketLogo size={28} />
              </div>
              <span className="font-bold text-xl tracking-tight">
                Power<span className="text-primary">Leave</span>
              </span>
            </div>
          </div>

          {/* User profile card */}
          <div className="px-4 mb-4">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">{user?.name?.[0] || 'U'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${user?.role === 'admin' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                  {user?.role === 'admin' ? 'Amministratore' : 'Membro'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-3">Menu</p>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  data-testid={`nav-${item.id}`}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    currentPage === item.id
                      ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-[1.02]'
                      : 'text-muted-foreground hover:bg-primary/10 hover:text-primary hover:translate-x-1'
                  }`}
                >
                  <span className={`${currentPage === item.id ? 'scale-110' : ''} transition-transform`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Bottom actions */}
          <div className="p-4 space-y-3">
            <button
              data-testid="new-request-btn"
              onClick={() => setShowRequestForm(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] transition-all duration-200"
            >
              <Icons.Plus />
              Nuova Richiesta
            </button>
            <button
              data-testid="logout-btn"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all"
            >
              <Icons.Logout />
              <span className="text-sm">Esci</span>
            </button>
          </div>
        </aside>

        {/* Desktop Main Content */}
        <main className="flex-1 flex flex-col min-h-screen bg-background">
          <div className="flex items-center justify-between px-8 py-4 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-30">
            <h2 className="text-xl font-bold text-foreground">
              {currentPage === 'dashboard' && 'Dashboard'}
              {currentPage === 'calendar' && 'Calendario'}
              {currentPage === 'stats' && 'Statistiche'}
              {currentPage === 'requests' && 'Richieste Ferie'}
              {currentPage === 'announcements' && 'Bacheca Annunci'}
              {currentPage === 'closures' && 'Chiusure Aziendali'}
              {currentPage === 'team' && 'Team'}
              {currentPage === 'settings' && 'Impostazioni'}
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Ciao, {user?.name?.split(' ')[0]}</span>
              <ThemeToggle />
            </div>
          </div>
          <div className="flex-1 overflow-auto p-8">
            {currentPage === 'dashboard' && <DashboardContent stats={stats} pendingRequests={pendingRequests} myRequests={myRequests} user={user} onReview={handleReview} />}
            {currentPage === 'calendar' && <CalendarPage />}
            {currentPage === 'stats' && <StatsPage />}
            {currentPage === 'requests' && <RequestsPage user={user} />}
            {currentPage === 'announcements' && <AnnouncementsPage user={user} />}
            {currentPage === 'closures' && <ClosuresPage user={user} />}
            {currentPage === 'team' && <TeamPage />}
            {currentPage === 'settings' && <SettingsPage />}
          </div>
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden min-h-screen flex flex-col bg-background">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setSidebarOpen(false)} />
        )}
        
        {/* Mobile Sidebar Drawer - Modern */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-card flex flex-col transform transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-5 flex-1 overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                <RocketLogo size={24} />
              </div>
              <span className="font-bold text-lg">Power<span className="text-primary">Leave</span></span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold">{user?.name?.[0] || 'U'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-sm">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.role === 'admin' ? 'Amministratore' : 'Membro'}</p>
              </div>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setCurrentPage(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    currentPage === item.id
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 space-y-2">
            <button onClick={() => { setShowRequestForm(true); setSidebarOpen(false); }} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg">
              <Icons.Plus /> Nuova Richiesta
            </button>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/50">
              <Icons.Logout /> <span className="text-sm">Esci</span>
            </button>
          </div>
        </aside>

        {/* Mobile header */}
        <div className="fixed top-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 hover:bg-muted rounded-xl transition-colors">
            <Icons.Menu />
          </button>
          <span className="font-bold text-lg">Power<span className="text-primary">Leave</span></span>
          <ThemeToggle />
        </div>

        {/* Mobile content */}
        <div className="flex-1 overflow-auto pt-16 p-4">
          {currentPage === 'dashboard' && <DashboardContent stats={stats} pendingRequests={pendingRequests} myRequests={myRequests} user={user} onReview={handleReview} />}
          {currentPage === 'calendar' && <CalendarPage />}
          {currentPage === 'stats' && <StatsPage />}
          {currentPage === 'requests' && <RequestsPage user={user} />}
          {currentPage === 'announcements' && <AnnouncementsPage user={user} />}
          {currentPage === 'closures' && <ClosuresPage user={user} />}
          {currentPage === 'team' && <TeamPage />}
          {currentPage === 'settings' && <SettingsPage />}
        </div>
      </div>

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

// ============== DASHBOARD CONTENT (Full Design) ==============
function DashboardContent({ stats, pendingRequests, myRequests, user, onReview }) {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [team, setTeam] = useState([]);
  const [formData, setFormData] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    hours: '8',
    notes: '',
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthLeaves, setMonthLeaves] = useState([]);

  useEffect(() => {
    loadExtraData();
  }, []);

  useEffect(() => {
    loadCalendarData();
  }, [currentMonth]);

  const loadExtraData = async () => {
    try {
      const [typesData, balancesData, teamData, requestsData] = await Promise.all([
        api.get('/api/leave-types'),
        api.get('/api/leave-balances'),
        api.get('/api/team'),
        api.get('/api/leave-requests'),
      ]);
      setLeaveTypes(typesData);
      setBalances(balancesData);
      setTeam(teamData);
      setAllRequests(requestsData);
    } catch {}
  };

  const loadCalendarData = async () => {
    try {
      const data = await api.get(`/api/calendar/monthly?year=${currentMonth.getFullYear()}&month=${currentMonth.getMonth() + 1}`);
      setMonthLeaves(data);
    } catch {}
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/leave-requests', formData);
      toast.success('Richiesta inviata con successo!');
      setFormData({ leave_type_id: '', start_date: '', end_date: '', hours: '8', notes: '' });
      loadExtraData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  // Get balances per user (aggregated)
  const userBalances = team.map(member => {
    const memberBalances = balances.filter(b => b.user_id === member.user_id);
    const totalDays = memberBalances.reduce((sum, b) => sum + (b.total_days || 0), 0);
    const usedDays = memberBalances.reduce((sum, b) => sum + (b.used_days || 0), 0);
    return {
      ...member,
      totalDays,
      usedDays,
      availableDays: totalDays - usedDays
    };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Power Leave</h1>
        <p className="text-muted-foreground">Pianifica, visualizza e approva le ferie del tuo team con facilità.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-xl border">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg" style={{backgroundColor: 'rgba(59, 130, 246, 0.1)'}}>
              <Icons.Plane />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ferie Approvate</p>
              <p className="text-2xl font-bold">{stats?.approved_count || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl border">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg" style={{backgroundColor: 'rgba(249, 115, 22, 0.1)'}}>
              <Icons.Clock />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Richieste in Sospeso</p>
              <p className="text-2xl font-bold">{stats?.pending_count || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl border">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg" style={{backgroundColor: 'rgba(34, 197, 94, 0.1)'}}>
              <Icons.Users />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Staff Disponibile Oggi</p>
              <p className="text-2xl font-bold">{stats?.available_staff || 0}/{stats?.total_staff || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Utilizzo Ferie Team</p>
              <p className="text-2xl font-bold">{stats?.utilization_rate || 0}%</p>
            </div>
            <div className="relative w-12 h-12">
              <svg className="w-full h-full -rotate-90">
                <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted opacity-20" />
                <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4"
                  strokeDasharray={`${((stats?.utilization_rate || 0) / 100) * 125.6} 125.6`}
                  className="text-primary" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Request Form + Pending Approvals */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Request Form */}
        <div className="xl:col-span-2 bg-card p-6 rounded-xl border">
          <h2 className="text-lg font-semibold mb-4">Invia una richiesta</h2>
          <form onSubmit={handleSubmitRequest}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo di assenza</label>
                <select
                  value={formData.leave_type_id}
                  onChange={(e) => setFormData({...formData, leave_type_id: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border bg-background"
                  required
                >
                  <option value="">Seleziona tipo</option>
                  {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Data Inizio</label>
                <input type="date" value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border bg-background" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Data Fine</label>
                <input type="date" value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border bg-background" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Ore per giorno</label>
                <select value={formData.hours}
                  onChange={(e) => setFormData({...formData, hours: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border bg-background">
                  <option value="2">2 ore</option>
                  <option value="4">4 ore (mezza giornata)</option>
                  <option value="8">8 ore (giornata intera)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Note aggiuntive</label>
                <input type="text" value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border bg-background"
                  placeholder="Opzionale..." />
              </div>
            </div>
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Icons.Plane /> Invia Richiesta
            </button>
          </form>
        </div>

        {/* Admin: Pending Approvals | User: My Requests */}
        {user?.role === 'admin' ? (
          <div className="bg-card p-6 rounded-xl border">
            <h2 className="text-lg font-semibold mb-4">Richieste da Approvare</h2>
            {pendingRequests?.length > 0 ? (
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <div key={req.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: '#2563EB'}}>
                        <span className="text-white text-sm font-semibold">{req.user_name?.[0]}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{req.user_name}</p>
                        <p className="text-xs text-muted-foreground">{req.leave_type_name}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{req.start_date} → {req.end_date}</p>
                    <div className="flex gap-2">
                      <button onClick={() => onReview(req.id, 'approved')}
                        className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
                        style={{backgroundColor: '#22C55E'}}>
                        Approva
                      </button>
                      <button onClick={() => onReview(req.id, 'rejected')}
                        className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
                        style={{backgroundColor: '#EF4444'}}>
                        Rifiuta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">Nessuna richiesta in attesa</p>
            )}
          </div>
        ) : (
          <div className="bg-card p-6 rounded-xl border">
            <h2 className="text-lg font-semibold mb-4">Le Mie Richieste</h2>
            {myRequests?.length > 0 ? (
              <div className="space-y-3">
                {myRequests.slice(0, 5).map(req => (
                  <div key={req.id} className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{req.leave_type_name}</p>
                      <p className="text-xs text-muted-foreground">{req.start_date} → {req.end_date}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      req.status === 'approved' ? 'text-white' : 
                      req.status === 'rejected' ? 'text-white' : 'text-white'
                    }`} style={{
                      backgroundColor: req.status === 'approved' ? '#22C55E' : 
                                       req.status === 'rejected' ? '#EF4444' : '#F97316'
                    }}>
                      {req.status === 'approved' ? 'Approvata' : req.status === 'rejected' ? 'Rifiutata' : 'In Attesa'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">Nessuna richiesta</p>
            )}
          </div>
        )}
      </div>

      {/* Team Balances - Admin vede tutti, User vede solo se stesso */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{user?.role === 'admin' ? 'Saldo ferie Team' : 'Il mio saldo ferie'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {(user?.role === 'admin' ? userBalances : userBalances.filter(m => m.user_id === user?.user_id)).map(member => (
            <div key={member.user_id} className="bg-card p-4 rounded-xl border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#2563EB'}}>
                  <span className="text-white font-semibold">{member.name?.[0]}</span>
                </div>
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role === 'admin' ? 'Team Leader' : 'Team Member'}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">In Cda</p>
                  <p className="text-lg font-bold" style={{color: '#3B82F6'}}>{member.totalDays}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Usate</p>
                  <p className="text-lg font-bold" style={{color: '#EF4444'}}>{member.usedDays}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Disponibili</p>
                  <p className="text-lg font-bold" style={{color: '#22C55E'}}>{member.availableDays}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-card p-6 rounded-xl border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Calendario {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-muted rounded-lg"><Icons.ChevronLeft /></button>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-muted rounded-lg"><Icons.ChevronRight /></button>
          </div>
        </div>
        
        {/* Calendar Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{backgroundColor: '#22C55E'}}></span> Approvate</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{backgroundColor: '#F97316'}}></span> In Attesa</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{backgroundColor: '#EF4444'}}></span> Rifiutate</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
          ))}
          {Array.from({ length: startOffset }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayLeaves = monthLeaves.filter(l => l.start_date <= dateStr && l.end_date >= dateStr);
            const isToday = day === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth();
            const isWeekend = (startOffset + i) % 7 >= 5;

            return (
              <div key={day} className={`min-h-[60px] p-1 rounded border text-xs ${isToday ? 'ring-2 ring-primary' : ''} ${isWeekend ? 'bg-muted/30' : ''}`}>
                <span className={`font-medium ${isToday ? 'text-primary' : ''}`}>{day}</span>
                {dayLeaves.slice(0, 2).map((l, idx) => (
                  <div key={idx} className="mt-1 px-1 py-0.5 rounded truncate text-white text-[10px]"
                    style={{backgroundColor: l.status === 'approved' ? '#22C55E' : l.status === 'pending' ? '#F97316' : '#9CA3AF'}}>
                    {l.user_name?.split(' ')[0]}
                  </div>
                ))}
                {dayLeaves.length > 2 && <div className="text-[10px] text-muted-foreground">+{dayLeaves.length - 2}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Usage Summary Table */}
      <div className="bg-card p-6 rounded-xl border">
        <h2 className="text-lg font-semibold mb-4">Riepilogo Utilizzo Ferie</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Dipendente</th>
                <th className="text-left py-3 px-4">Tipo Assenza</th>
                <th className="text-right py-3 px-4">Giorni Utilizzati</th>
                <th className="text-right py-3 px-4">Giorni Residui</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((b, i) => (
                <tr key={i} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">{b.user_name}</td>
                  <td className="py-3 px-4">{b.leave_type_name}</td>
                  <td className="py-3 px-4 text-right" style={{color: '#EF4444'}}>{b.used_days}</td>
                  <td className="py-3 px-4 text-right" style={{color: '#22C55E'}}>{b.remaining_days}</td>
                </tr>
              ))}
            </tbody>
          </table>
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

// ============== STATS PAGE (ANALYTICS AVANZATE) ==============
function StatsPage() {
  const [stats, setStats] = useState(null);
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [team, setTeam] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('year');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [statsData, balancesData, requestsData, teamData] = await Promise.all([
        api.get('/api/stats'),
        api.get('/api/leave-balances'),
        api.get('/api/leave-requests'),
        api.get('/api/team'),
      ]);
      setStats(statsData);
      setBalances(balancesData);
      setRequests(requestsData);
      setTeam(teamData);
    } catch {}
  };

  // Calculate analytics
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  // Monthly distribution for current year
  const monthlyData = Array(12).fill(0);
  approvedRequests.forEach(req => {
    const month = new Date(req.start_date).getMonth();
    monthlyData[month] += req.days || 1;
  });
  const maxMonthlyValue = Math.max(...monthlyData, 1);

  // Leave type distribution
  const leaveTypeStats = {};
  approvedRequests.forEach(req => {
    const type = req.leave_type_name || 'Altro';
    leaveTypeStats[type] = (leaveTypeStats[type] || 0) + (req.days || 1);
  });
  const totalLeaveDays = Object.values(leaveTypeStats).reduce((a, b) => a + b, 0) || 1;

  // Per-employee usage
  const employeeUsage = {};
  team.forEach(member => {
    const memberBalances = balances.filter(b => b.user_id === member.user_id);
    const totalDays = memberBalances.reduce((sum, b) => sum + (b.total_days || 0), 0);
    const usedDays = memberBalances.reduce((sum, b) => sum + (b.used_days || 0), 0);
    employeeUsage[member.user_id] = {
      name: member.name,
      totalDays,
      usedDays,
      percentage: totalDays > 0 ? Math.round((usedDays / totalDays) * 100) : 0
    };
  });

  const leaveTypeColors = {
    'Ferie': '#22C55E',
    'Permesso': '#3B82F6',
    'Malattia': '#EF4444',
    'Maternità/Paternità': '#A855F7',
    'Altro': '#6B7280'
  };

  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Panoramica completa del tuo team</p>
        </div>
        <select 
          value={selectedPeriod} 
          onChange={e => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 rounded-lg border bg-card text-foreground"
        >
          <option value="year">Anno corrente</option>
          <option value="quarter">Ultimo trimestre</option>
          <option value="month">Ultimo mese</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Icons.Check />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">+12%</span>
          </div>
          <p className="text-4xl font-bold">{stats?.approved_count || 0}</p>
          <p className="text-green-100 text-sm">Richieste Approvate</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-6 rounded-2xl text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Icons.Clock />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Da gestire</span>
          </div>
          <p className="text-4xl font-bold">{stats?.pending_count || 0}</p>
          <p className="text-orange-100 text-sm">In Attesa</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Icons.Users />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Attivi</span>
          </div>
          <p className="text-4xl font-bold">{stats?.available_staff || 0}/{stats?.total_staff || 0}</p>
          <p className="text-blue-100 text-sm">Staff Disponibile Oggi</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-6 rounded-2xl text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Icons.Chart />
            </div>
          </div>
          <p className="text-4xl font-bold">{stats?.utilization_rate || 0}%</p>
          <p className="text-purple-100 text-sm">Utilizzo Medio Ferie</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <div className="bg-card p-6 rounded-2xl border">
          <h2 className="text-lg font-semibold mb-6">Trend Assenze Mensili</h2>
          <div className="flex items-end gap-2 h-48">
            {monthlyData.map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full rounded-t-lg transition-all duration-500 hover:opacity-80"
                  style={{
                    height: `${(value / maxMonthlyValue) * 100}%`,
                    minHeight: value > 0 ? '8px' : '2px',
                    backgroundColor: i === new Date().getMonth() ? '#3B82F6' : '#94A3B8'
                  }}
                  title={`${months[i]}: ${value} giorni`}
                />
                <span className="text-xs text-muted-foreground">{months[i]}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-500"></span> Mese corrente
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gray-400"></span> Altri mesi
            </span>
          </div>
        </div>

        {/* Leave Type Distribution */}
        <div className="bg-card p-6 rounded-2xl border">
          <h2 className="text-lg font-semibold mb-6">Distribuzione per Tipo</h2>
          <div className="space-y-4">
            {Object.entries(leaveTypeStats).map(([type, days]) => {
              const percentage = Math.round((days / totalLeaveDays) * 100);
              const color = leaveTypeColors[type] || '#6B7280';
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{type}</span>
                    <span className="text-sm text-muted-foreground">{days} giorni ({percentage}%)</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${percentage}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(leaveTypeStats).length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nessun dato disponibile</p>
            )}
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-card p-6 rounded-2xl border">
        <h2 className="text-lg font-semibold mb-6">Utilizzo Ferie per Dipendente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(employeeUsage).map((emp, i) => (
            <div key={i} className="p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: emp.percentage > 70 ? '#EF4444' : emp.percentage > 40 ? '#F97316' : '#22C55E' }}>
                  {emp.name?.[0]}
                </div>
                <div>
                  <p className="font-medium text-sm">{emp.name}</p>
                  <p className="text-xs text-muted-foreground">{emp.usedDays}/{emp.totalDays} giorni</p>
                </div>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${emp.percentage}%`,
                    backgroundColor: emp.percentage > 70 ? '#EF4444' : emp.percentage > 40 ? '#F97316' : '#22C55E'
                  }}
                />
              </div>
              <p className="text-right text-xs text-muted-foreground mt-1">{emp.percentage}% utilizzato</p>
            </div>
          ))}
        </div>
      </div>

      {/* Request Status Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-2xl border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600">
              <Icons.Check />
            </div>
            <div>
              <p className="text-2xl font-bold">{approvedRequests.length}</p>
              <p className="text-sm text-muted-foreground">Approvate</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Totale giorni: {approvedRequests.reduce((sum, r) => sum + (r.days || 0), 0)}
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-2xl border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600">
              <Icons.Clock />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingRequests.length}</p>
              <p className="text-sm text-muted-foreground">In Attesa</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Giorni richiesti: {pendingRequests.reduce((sum, r) => sum + (r.days || 0), 0)}
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-2xl border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600">
              <Icons.X />
            </div>
            <div>
              <p className="text-2xl font-bold">{rejectedRequests.length}</p>
              <p className="text-sm text-muted-foreground">Rifiutate</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Tasso rifiuto: {requests.length > 0 ? Math.round((rejectedRequests.length / requests.length) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Detailed Table - Grouped by Employee */}
      <div className="bg-card p-6 rounded-2xl border">
        <h2 className="text-lg font-semibold mb-4">Riepilogo Saldi Team</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-foreground">Dipendente</th>
                <th className="text-center py-3 px-4 font-semibold text-foreground" colSpan={2}>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Ferie
                  </span>
                </th>
                <th className="text-center py-3 px-4 font-semibold text-foreground" colSpan={2}>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Permessi
                  </span>
                </th>
                <th className="text-center py-3 px-4 font-semibold text-foreground" colSpan={2}>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Malattia
                  </span>
                </th>
                <th className="text-center py-3 px-4 font-semibold text-foreground">Totale Usati</th>
              </tr>
              <tr className="border-b border-border/50 text-xs text-muted-foreground">
                <th className="py-2 px-4"></th>
                <th className="py-2 px-4 text-center">Usati</th>
                <th className="py-2 px-4 text-center">Disp.</th>
                <th className="py-2 px-4 text-center">Usati</th>
                <th className="py-2 px-4 text-center">Disp.</th>
                <th className="py-2 px-4 text-center">Usati</th>
                <th className="py-2 px-4 text-center">Disp.</th>
                <th className="py-2 px-4 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Group balances by user
                const userBalances = {};
                balances.forEach(b => {
                  if (!userBalances[b.user_id]) {
                    userBalances[b.user_id] = { 
                      name: b.user_name, 
                      ferie: { used: 0, remaining: 0 },
                      permesso: { used: 0, remaining: 0 },
                      malattia: { used: 0, remaining: 0 },
                      total: 0
                    };
                  }
                  const type = b.leave_type_name?.toLowerCase() || '';
                  if (type.includes('ferie') || type.includes('ferie')) {
                    userBalances[b.user_id].ferie.used += b.used_days || 0;
                    userBalances[b.user_id].ferie.remaining += b.remaining_days || 0;
                  } else if (type.includes('permess')) {
                    userBalances[b.user_id].permesso.used += b.used_days || 0;
                    userBalances[b.user_id].permesso.remaining += b.remaining_days || 0;
                  } else if (type.includes('malattia')) {
                    userBalances[b.user_id].malattia.used += b.used_days || 0;
                    userBalances[b.user_id].malattia.remaining += b.remaining_days || 0;
                  }
                  userBalances[b.user_id].total += b.used_days || 0;
                });
                
                return Object.entries(userBalances).map(([userId, data], i) => (
                  <tr key={userId} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                          {data.name?.[0]}
                        </div>
                        <span className="font-medium text-foreground">{data.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-semibold" style={{color: '#EF4444'}}>{data.ferie.used}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-semibold" style={{color: '#22C55E'}}>{data.ferie.remaining}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-semibold" style={{color: '#EF4444'}}>{data.permesso.used}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-semibold" style={{color: '#22C55E'}}>{data.permesso.remaining}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-semibold" style={{color: '#EF4444'}}>{data.malattia.used}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-semibold" style={{color: '#22C55E'}}>{data.malattia.remaining}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                        {data.total} gg
                      </span>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============== REQUESTS PAGE ==============
function RequestsPage({ user }) {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await api.get('/api/leave-requests');
      setRequests(data);
    } catch {}
  };

  const handleReview = async (requestId, status) => {
    try {
      const request = requests.find(r => r.id === requestId);
      await api.put(`/api/leave-requests/${requestId}/review`, { status });
      
      const dates = request ? `${request.start_date} - ${request.end_date}` : '';
      const userName = request?.user_name || 'Dipendente';
      
      if (status === 'approved') {
        NotificationService.leaveApproved(userName, dates);
      } else {
        NotificationService.leaveRejected(userName, dates);
      }
      
      loadRequests();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filteredRequests = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Richieste Ferie</h1>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border bg-background">
          <option value="all">Tutte</option>
          <option value="pending">In Attesa</option>
          <option value="approved">Approvate</option>
          <option value="rejected">Rifiutate</option>
        </select>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3">Dipendente</th>
              <th className="text-left px-4 py-3">Tipo</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Stato</th>
              {user?.role === 'admin' && <th className="text-right px-4 py-3">Azioni</th>}
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map(req => (
              <tr key={req.id} className="border-t hover:bg-muted/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: '#2563EB'}}>
                      <span className="text-white text-sm">{req.user_name?.[0]}</span>
                    </div>
                    {req.user_name}
                  </div>
                </td>
                <td className="px-4 py-3">{req.leave_type_name}</td>
                <td className="px-4 py-3 text-sm">{req.start_date} → {req.end_date}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded text-xs font-medium text-white"
                    style={{backgroundColor: req.status === 'approved' ? '#22C55E' : req.status === 'rejected' ? '#EF4444' : '#F97316'}}>
                    {req.status === 'approved' ? 'Approvata' : req.status === 'rejected' ? 'Rifiutata' : 'In Attesa'}
                  </span>
                </td>
                {user?.role === 'admin' && (
                  <td className="px-4 py-3 text-right">
                    {req.status === 'pending' && (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleReview(req.id, 'approved')}
                          className="px-3 py-1 rounded text-sm text-white" style={{backgroundColor: '#22C55E'}}>
                          Approva
                        </button>
                        <button onClick={() => handleReview(req.id, 'rejected')}
                          className="px-3 py-1 rounded text-sm text-white" style={{backgroundColor: '#EF4444'}}>
                          Rifiuta
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRequests.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nessuna richiesta trovata</p>
        )}
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

// ============== ANNOUNCEMENTS PAGE (BACHECA) ==============
function AnnouncementsPage({ user }) {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', priority: 'normal' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await api.get('/api/announcements');
      setAnnouncements(data);
    } catch (err) {
      toast.error('Errore nel caricamento annunci');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/announcements/${editingId}`, formData);
        toast.success('Annuncio aggiornato!');
      } else {
        await api.post('/api/announcements', formData);
        toast.success('Annuncio pubblicato!');
      }
      setShowForm(false);
      setFormData({ title: '', content: '', priority: 'normal' });
      setEditingId(null);
      loadAnnouncements();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questo annuncio?')) return;
    try {
      await api.delete(`/api/announcements/${id}`);
      toast.success('Annuncio eliminato');
      loadAnnouncements();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEdit = (announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority
    });
    setEditingId(announcement.id);
    setShowForm(true);
  };

  const priorityColors = {
    high: 'bg-red-500',
    normal: 'bg-blue-500',
    low: 'bg-gray-500'
  };

  const priorityLabels = {
    high: 'Urgente',
    normal: 'Normale',
    low: 'Bassa'
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Bacheca Annunci</h1>
          <p className="text-muted-foreground">Comunicazioni aziendali e avvisi importanti</p>
        </div>
        {user?.role === 'admin' && (
          <button
            data-testid="new-announcement-btn"
            onClick={() => { setShowForm(true); setEditingId(null); setFormData({ title: '', content: '', priority: 'normal' }); }}
            className="btn-primary flex items-center gap-2"
          >
            <Icons.Plus /> Nuovo Annuncio
          </button>
        )}
      </div>

      {/* Announcements list */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-card p-8 rounded-xl border text-center">
            <p className="text-muted-foreground">Nessun annuncio presente</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} className="bg-card p-6 rounded-xl border relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${priorityColors[announcement.priority]}`}></div>
              <div className="flex items-start justify-between">
                <div className="flex-1 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs text-white ${priorityColors[announcement.priority]}`}>
                      {priorityLabels[announcement.priority]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(announcement.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{announcement.title}</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{announcement.content}</p>
                  <p className="text-xs text-muted-foreground mt-4">
                    Pubblicato da {announcement.author_name}
                  </p>
                </div>
                {user?.role === 'admin' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="p-2 hover:bg-muted rounded-lg text-muted-foreground"
                      title="Modifica"
                    >
                      <Icons.Settings />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg text-destructive"
                      title="Elimina"
                    >
                      <Icons.X />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editingId ? 'Modifica Annuncio' : 'Nuovo Annuncio'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-muted rounded-lg">
                <Icons.X />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Titolo</label>
                <input
                  data-testid="announcement-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border bg-background"
                  placeholder="Oggetto dell'annuncio"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Contenuto</label>
                <textarea
                  data-testid="announcement-content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border bg-background resize-none"
                  rows={5}
                  placeholder="Scrivi il messaggio..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Priorità</label>
                <select
                  data-testid="announcement-priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border bg-background"
                >
                  <option value="low">Bassa</option>
                  <option value="normal">Normale</option>
                  <option value="high">Urgente</option>
                </select>
              </div>
              <button type="submit" className="w-full btn-primary">
                {editingId ? 'Salva Modifiche' : 'Pubblica Annuncio'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============== CLOSURES PAGE (CHIUSURE AZIENDALI) ==============
function ClosuresPage({ user }) {
  const [closures, setClosures] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [selectedClosureId, setSelectedClosureId] = useState(null);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: '',
    type: 'shutdown',
    auto_leave: true,
    allow_exceptions: true
  });
  const [exceptionReason, setExceptionReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const year = new Date().getFullYear();
      const [closuresData, exceptionsData] = await Promise.all([
        api.get(`/api/closures?year=${year}`),
        api.get('/api/closures/exceptions')
      ]);
      setClosures(closuresData);
      setExceptions(exceptionsData);
    } catch (err) {
      toast.error('Errore nel caricamento');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/closures', formData);
      toast.success('Chiusura aziendale creata!');
      setShowForm(false);
      setFormData({
        start_date: '',
        end_date: '',
        reason: '',
        type: 'shutdown',
        auto_leave: true,
        allow_exceptions: true
      });
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questa chiusura?')) return;
    try {
      await api.delete(`/api/closures/${id}`);
      toast.success('Chiusura eliminata');
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRequestException = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/closures/${selectedClosureId}/exception`, { reason: exceptionReason });
      toast.success('Richiesta di deroga inviata!');
      setShowExceptionForm(false);
      setExceptionReason('');
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReviewException = async (exceptionId, status) => {
    try {
      const exception = exceptions.find(e => e.id === exceptionId);
      await api.put(`/api/closures/exceptions/${exceptionId}/review`, { status });
      
      // Send notification
      NotificationService.closureException(exception?.user_name || 'Dipendente', status);
      
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const typeLabels = {
    shutdown: 'Chiusura Aziendale',
    holiday: 'Festività'
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Chiusure Aziendali</h1>
          <p className="text-muted-foreground">Periodi di ferie obbligatorie e festività</p>
        </div>
        {user?.role === 'admin' && (
          <button
            data-testid="new-closure-btn"
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Icons.Plus /> Nuova Chiusura
          </button>
        )}
      </div>

      {/* Closures list */}
      <div className="space-y-4 mb-8">
        <h2 className="text-lg font-semibold">Prossime Chiusure</h2>
        {closures.filter(c => c.org_id || c.type === 'shutdown').length === 0 ? (
          <div className="bg-card p-8 rounded-xl border text-center">
            <p className="text-muted-foreground">Nessuna chiusura programmata</p>
          </div>
        ) : (
          closures.filter(c => c.org_id || c.type === 'shutdown').map((closure) => (
            <div key={closure.id} className="bg-card p-6 rounded-xl border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: closure.type === 'holiday' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(249, 115, 22, 0.1)' }}>
                    <Icons.Calendar />
                  </div>
                  <div>
                    <p className="font-semibold">{closure.reason}</p>
                    <p className="text-sm text-muted-foreground">
                      {closure.start_date === closure.end_date 
                        ? formatDate(closure.start_date || closure.date)
                        : `${formatDate(closure.start_date || closure.date)} - ${formatDate(closure.end_date || closure.date)}`}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${
                      closure.type === 'holiday' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {typeLabels[closure.type]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user?.role !== 'admin' && closure.allow_exceptions && closure.org_id && (
                    <button
                      onClick={() => { setSelectedClosureId(closure.id); setShowExceptionForm(true); }}
                      className="btn-outline text-sm py-2 px-4"
                    >
                      Richiedi Deroga
                    </button>
                  )}
                  {user?.role === 'admin' && closure.org_id && (
                    <button
                      onClick={() => handleDelete(closure.id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg text-destructive"
                    >
                      <Icons.X />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Holidays */}
      <div className="space-y-4 mb-8">
        <h2 className="text-lg font-semibold">Festività Nazionali {new Date().getFullYear()}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {closures.filter(c => !c.org_id && c.type === 'holiday').map((holiday) => (
            <div key={holiday.id} className="bg-card p-4 rounded-xl border flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <Icons.Calendar />
              </div>
              <div>
                <p className="font-medium text-sm">{holiday.reason}</p>
                <p className="text-xs text-muted-foreground">{formatDate(holiday.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exception Requests (Admin view) */}
      {user?.role === 'admin' && exceptions.filter(e => e.status === 'pending').length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Richieste di Deroga</h2>
          {exceptions.filter(e => e.status === 'pending').map((exception) => (
            <div key={exception.id} className="bg-card p-4 rounded-xl border flex items-center justify-between">
              <div>
                <p className="font-medium">{exception.user_name}</p>
                <p className="text-sm text-muted-foreground">{exception.reason}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleReviewException(exception.id, 'approved')}
                  className="py-2 px-4 rounded-lg text-sm font-medium text-white bg-green-500 hover:bg-green-600"
                >
                  Approva
                </button>
                <button
                  onClick={() => handleReviewException(exception.id, 'rejected')}
                  className="py-2 px-4 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600"
                >
                  Rifiuta
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Closure Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Nuova Chiusura Aziendale</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-muted rounded-lg">
                <Icons.X />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Motivo</label>
                <input
                  data-testid="closure-reason"
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border bg-background"
                  placeholder="Es: Chiusura estiva"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Data Inizio</label>
                  <input
                    data-testid="closure-start"
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
                    data-testid="closure-end"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border bg-background"
                    required
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auto_leave}
                    onChange={(e) => setFormData({ ...formData, auto_leave: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="text-sm">Crea automaticamente richieste ferie per tutti</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allow_exceptions}
                    onChange={(e) => setFormData({ ...formData, allow_exceptions: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="text-sm">Permetti richieste di deroga</span>
                </label>
              </div>
              <button type="submit" className="w-full btn-primary">
                Crea Chiusura
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Exception Request Modal */}
      {showExceptionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Richiedi Deroga</h2>
              <button onClick={() => setShowExceptionForm(false)} className="p-2 hover:bg-muted rounded-lg">
                <Icons.X />
              </button>
            </div>
            <form onSubmit={handleRequestException} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Motivazione</label>
                <textarea
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border bg-background resize-none"
                  rows={4}
                  placeholder="Spiega perché hai bisogno di lavorare durante la chiusura..."
                  required
                />
              </div>
              <button type="submit" className="w-full btn-primary">
                Invia Richiesta
              </button>
            </form>
          </div>
        </div>
      )}
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
