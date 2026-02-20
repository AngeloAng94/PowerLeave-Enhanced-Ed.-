import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import { NotificationService } from '../context/NotificationContext';
import api from '../lib/api';
import { RocketLogo, Icons } from '../components/Icons';
import ThemeToggle from '../components/ThemeToggle';
import DashboardContent from './DashboardContent';
import RequestsPage from './RequestsPage';
import TeamPage from './TeamPage';

// Lazy-loaded pages
const StatsPage = lazy(() => import('./StatsPage'));
const CalendarPage = lazy(() => import('./CalendarPage'));
const SettingsPage = lazy(() => import('./SettingsPage'));
const AnnouncementsPage = lazy(() => import('./AnnouncementsPage'));
const ClosuresPage = lazy(() => import('./ClosuresPage'));

const LoadingFallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', color: 'var(--muted-foreground)' }}>
    <div style={{ width: '32px', height: '32px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
  </div>
);

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data state
  const [stats, setStats] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [team, setTeam] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [statsData, requestsData, typesData, balancesData, teamData] = await Promise.all([
        api.get('/api/stats'),
        api.get('/api/leave-requests'),
        api.get('/api/leave-types'),
        api.get('/api/leave-balances'),
        api.get('/api/team'),
      ]);
      setStats(statsData);
      setAllRequests(requestsData);
      setPendingRequests(requestsData.filter(r => r.status === 'pending'));
      setLeaveTypes(typesData);
      setBalances(balancesData);
      setTeam(teamData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleReview = async (requestId, status) => {
    try {
      await api.put(`/api/leave-requests/${requestId}/review`, { status });
      const req = allRequests.find(r => r.id === requestId);
      NotificationService.success(
        status === 'approved' ? 'Richiesta Approvata' : 'Richiesta Rifiutata',
        `La richiesta di ${req?.user_name || 'utente'} è stata ${status === 'approved' ? 'approvata' : 'rifiutata'}.`
      );
      loadDashboardData();
    } catch (err) {
      NotificationService.error('Errore', err.message);
    }
  };

  const handleCreateRequest = async (data) => {
    try {
      await api.post('/api/leave-requests', data);
      NotificationService.success('Richiesta Inviata', 'La tua richiesta di assenza è stata inviata con successo.');
      setShowRequestModal(false);
      loadDashboardData();
    } catch (err) {
      NotificationService.error('Errore', err.message);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.dashboard },
    { id: 'calendar', label: 'Calendario', icon: Icons.calendar },
    { id: 'requests', label: 'Richieste', icon: Icons.fileText },
    { id: 'announcements', label: 'Bacheca', icon: Icons.megaphone },
    { id: 'closures', label: 'Chiusure', icon: Icons.lock },
    ...(user?.role === 'admin' ? [
      { id: 'team', label: 'Team', icon: Icons.users },
      { id: 'stats', label: 'Statistiche', icon: Icons.barChart },
      { id: 'settings', label: 'Impostazioni', icon: Icons.settings },
    ] : []),
  ];

  const renderPage = () => {
    const lazyPage = (component) => <Suspense fallback={<LoadingFallback />}>{component}</Suspense>;

    switch (currentPage) {
      case 'dashboard':
        return <DashboardContent stats={stats} pendingRequests={pendingRequests} leaveTypes={leaveTypes} balances={balances} allRequests={allRequests} team={team} user={user} onReview={handleReview} onCreateRequest={handleCreateRequest} onRefresh={loadDashboardData} />;
      case 'calendar':
        return lazyPage(<CalendarPage />);
      case 'requests':
        return <RequestsPage user={user} />;
      case 'team':
        return <TeamPage user={user} onRefresh={loadDashboardData} />;
      case 'stats':
        return lazyPage(<StatsPage />);
      case 'settings':
        return lazyPage(<SettingsPage />);
      case 'announcements':
        return lazyPage(<AnnouncementsPage user={user} />);
      case 'closures':
        return lazyPage(<ClosuresPage user={user} />);
      default:
        return <DashboardContent stats={stats} pendingRequests={pendingRequests} leaveTypes={leaveTypes} balances={balances} allRequests={allRequests} team={team} user={user} onReview={handleReview} onCreateRequest={handleCreateRequest} onRefresh={loadDashboardData} />;
    }
  };

  return (
    <div data-testid="dashboard-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      {/* Desktop Sidebar */}
      <aside style={{
        width: '260px', background: 'linear-gradient(180deg, var(--card) 0%, var(--card-foreground-alt, var(--card)) 100%)',
        borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflow: 'auto',
        '@media (maxWidth: 768px)': { display: 'none' },
      }} className="desktop-sidebar">
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <RocketLogo size={32} />
            <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--foreground)' }}>PowerLeave</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px' }}>
          {navItems.map(item => (
            <button data-testid={`nav-${item.id}`} key={item.id} onClick={() => { setCurrentPage(item.id); setMobileMenuOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                padding: '10px 12px', borderRadius: '8px', border: 'none',
                background: currentPage === item.id ? 'var(--primary)' : 'transparent',
                color: currentPage === item.id ? 'white' : 'var(--muted-foreground)',
                cursor: 'pointer', fontSize: '14px', fontWeight: currentPage === item.id ? 600 : 400,
                marginBottom: '2px', textAlign: 'left',
                transition: 'all 0.15s ease',
              }}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', marginBottom: '8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--primary)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 600,
            }}>{user?.name?.charAt(0) || '?'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{user?.role === 'admin' ? 'Amministratore' : 'Dipendente'}</div>
            </div>
          </div>
          <button data-testid="logout-btn" onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
            padding: '8px 12px', borderRadius: '8px', border: 'none',
            background: 'transparent', color: 'var(--muted-foreground)',
            cursor: 'pointer', fontSize: '13px',
          }}>
            {Icons.logout} Esci
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Bar */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 24px', borderBottom: '1px solid var(--border)',
          background: 'var(--card)', position: 'sticky', top: 0, zIndex: 40,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{
              display: 'none', background: 'none', border: 'none',
              color: 'var(--foreground)', cursor: 'pointer', padding: '4px',
            }}>
              {mobileMenuOpen ? Icons.x : Icons.menu}
            </button>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)' }}>
              {navItems.find(n => n.id === currentPage)?.label || 'Dashboard'}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ThemeToggle />
            {user?.role === 'admin' && currentPage === 'dashboard' && (
              <button data-testid="new-request-btn" onClick={() => setShowRequestModal(true)} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px',
                background: 'var(--primary)', color: 'white', border: 'none',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}>
                {Icons.plus} Nuova Richiesta
              </button>
            )}
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="mobile-menu-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 50,
          }} onClick={() => setMobileMenuOpen(false)}>
            <div style={{
              width: '280px', height: '100%', background: 'var(--card)',
              padding: '20px', borderRight: '1px solid var(--border)',
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <RocketLogo size={28} />
                <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--foreground)' }}>PowerLeave</span>
              </div>
              {navItems.map(item => (
                <button key={item.id} onClick={() => { setCurrentPage(item.id); setMobileMenuOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                    padding: '10px 12px', borderRadius: '8px', border: 'none',
                    background: currentPage === item.id ? 'var(--primary)' : 'transparent',
                    color: currentPage === item.id ? 'white' : 'var(--muted-foreground)',
                    cursor: 'pointer', fontSize: '14px', fontWeight: currentPage === item.id ? 600 : 400,
                    marginBottom: '2px', textAlign: 'left',
                  }}>
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Page Content */}
        <main style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
          {renderPage()}
        </main>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <RequestModal leaveTypes={leaveTypes} onSubmit={handleCreateRequest} onClose={() => setShowRequestModal(false)} />
      )}
    </div>
  );
}

function RequestModal({ leaveTypes, onSubmit, onClose }) {
  const [form, setForm] = useState({ leave_type_id: leaveTypes[0]?.id || '', start_date: '', end_date: '', hours: 8, notes: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.start_date || !form.end_date) return;
    onSubmit(form);
  };

  const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: '8px',
    border: '1px solid var(--border)', background: 'var(--input-bg)',
    color: 'var(--foreground)', fontSize: '14px', boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 100, padding: '20px',
    }} onClick={onClose}>
      <div data-testid="request-modal" style={{
        background: 'var(--card)', borderRadius: '16px', padding: '24px',
        width: '100%', maxWidth: '440px', border: '1px solid var(--border)',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'var(--foreground)' }}>Nuova Richiesta di Assenza</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--foreground)' }}>Tipo</label>
            <select data-testid="request-type" value={form.leave_type_id} onChange={e => setForm({...form, leave_type_id: e.target.value})} style={inputStyle}>
              {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--foreground)' }}>Dal</label>
              <input data-testid="request-start" type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} required style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--foreground)' }}>Al</label>
              <input data-testid="request-end" type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} required style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--foreground)' }}>Durata</label>
            <select data-testid="request-hours" value={form.hours} onChange={e => setForm({...form, hours: parseInt(e.target.value)})} style={inputStyle}>
              <option value={8}>Giornata intera</option>
              <option value={4}>Mezza giornata</option>
              <option value={2}>Permesso orario (2h)</option>
            </select>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--foreground)' }}>Note</label>
            <textarea data-testid="request-notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} placeholder="Motivo della richiesta..." style={{...inputStyle, resize: 'vertical'}} />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--muted)', color: 'var(--foreground)', cursor: 'pointer', fontSize: '13px' }}>Annulla</button>
            <button data-testid="request-submit" type="submit" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Invia Richiesta</button>
          </div>
        </form>
      </div>
    </div>
  );
}
