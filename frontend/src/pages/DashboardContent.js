import React, { useState } from 'react';
import MiniCalendar from '../components/MiniCalendar';
import { Icons } from '../components/Icons';

export default function DashboardContent({ stats, pendingRequests = [], leaveTypes = [], balances = [], allRequests = [], team = [], user, onReview, onCreateRequest, onRefresh }) {
  const [inlineForm, setInlineForm] = useState({ leave_type_id: '', start_date: '', end_date: '', hours: 8, notes: '' });
  const [showInlineForm, setShowInlineForm] = useState(false);

  const rejectedRequests = allRequests.filter(r => r.status === 'rejected');
  const approvedRequests = allRequests.filter(r => r.status === 'approved');

  const handleInlineSubmit = (e) => {
    e.preventDefault();
    if (!inlineForm.start_date || !inlineForm.end_date || !inlineForm.leave_type_id) return;
    onCreateRequest(inlineForm);
    setInlineForm({ leave_type_id: '', start_date: '', end_date: '', hours: 8, notes: '' });
    setShowInlineForm(false);
  };

  const statCards = stats ? [
    { label: 'Approvate', value: stats.approved_count, color: '#22C55E' },
    { label: 'In attesa', value: stats.pending_count, color: '#F59E0B' },
    { label: 'Staff disponibile', value: `${stats.available_staff}/${stats.total_staff}`, color: '#3B82F6' },
    { label: 'Utilizzo ferie', value: `${stats.utilization_rate}%`, color: '#8B5CF6' },
  ] : [];

  const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: '8px',
    border: '1px solid var(--border)', background: 'var(--input-bg)',
    color: 'var(--foreground)', fontSize: '14px', boxSizing: 'border-box',
  };

  return (
    <div data-testid="dashboard-content">
      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {statCards.map((s, i) => (
            <div key={i} data-testid={`stat-card-${i}`} style={{
              padding: '20px', borderRadius: '12px', background: 'var(--card)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        {/* Left Column */}
        <div>
          {/* Quick Request Form */}
          {user?.role !== 'admin' && (
            <div style={{ marginBottom: '24px', padding: '20px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showInlineForm ? '16px' : 0 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)' }}>Richiedi Assenza</h3>
                <button onClick={() => setShowInlineForm(!showInlineForm)} style={{
                  padding: '6px 12px', borderRadius: '6px', border: 'none',
                  background: 'var(--primary)', color: 'white', cursor: 'pointer', fontSize: '13px',
                }}>{showInlineForm ? 'Chiudi' : 'Nuova'}</button>
              </div>
              {showInlineForm && (
                <form onSubmit={handleInlineSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px', color: 'var(--foreground)' }}>Tipo</label>
                      <select value={inlineForm.leave_type_id} onChange={e => setInlineForm({...inlineForm, leave_type_id: e.target.value})} required style={inputStyle}>
                        <option value="">Seleziona...</option>
                        {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px', color: 'var(--foreground)' }}>Durata</label>
                      <select value={inlineForm.hours} onChange={e => setInlineForm({...inlineForm, hours: parseInt(e.target.value)})} style={inputStyle}>
                        <option value={8}>Giornata intera</option>
                        <option value={4}>Mezza giornata</option>
                        <option value={2}>Permesso (2h)</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px', color: 'var(--foreground)' }}>Dal</label>
                      <input type="date" value={inlineForm.start_date} onChange={e => setInlineForm({...inlineForm, start_date: e.target.value})} required style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px', color: 'var(--foreground)' }}>Al</label>
                      <input type="date" value={inlineForm.end_date} onChange={e => setInlineForm({...inlineForm, end_date: e.target.value})} required style={inputStyle} />
                    </div>
                  </div>
                  <button type="submit" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Invia Richiesta</button>
                </form>
              )}
            </div>
          )}

          {/* Pending Requests */}
          {user?.role === 'admin' && pendingRequests.length > 0 && (
            <div style={{ marginBottom: '24px', padding: '20px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--foreground)' }}>
                Richieste in Attesa ({pendingRequests.length})
              </h3>
              {pendingRequests.map(req => (
                <div key={req.id} data-testid={`pending-request-${req.id}`} style={{
                  padding: '12px', borderRadius: '8px', background: 'var(--muted)',
                  marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{req.user_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                      {req.leave_type_name} — {req.start_date} → {req.end_date} ({req.days}gg)
                    </div>
                    {req.notes && <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px' }}>{req.notes}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button data-testid={`approve-${req.id}`} onClick={() => onReview(req.id, 'approved')} style={{
                      padding: '6px 12px', borderRadius: '6px', border: 'none',
                      background: '#22C55E', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                    }}>Approva</button>
                    <button data-testid={`reject-${req.id}`} onClick={() => onReview(req.id, 'rejected')} style={{
                      padding: '6px 12px', borderRadius: '6px', border: 'none',
                      background: '#EF4444', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                    }}>Rifiuta</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Requests */}
          <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--foreground)' }}>Ultime Richieste</h3>
            {allRequests.slice(0, 5).map(req => (
              <div key={req.id} style={{
                padding: '10px', borderRadius: '8px', borderBottom: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>{req.user_name} — {req.leave_type_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{req.start_date} → {req.end_date}</div>
                </div>
                <span style={{
                  padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                  background: req.status === 'approved' ? '#DCFCE7' : req.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                  color: req.status === 'approved' ? '#16A34A' : req.status === 'rejected' ? '#DC2626' : '#D97706',
                }}>
                  {req.status === 'approved' ? 'Approvata' : req.status === 'rejected' ? 'Rifiutata' : 'In attesa'}
                </span>
              </div>
            ))}
            {allRequests.length === 0 && (
              <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>Nessuna richiesta</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-sidebar-right">
          <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)', marginBottom: '16px' }}>
            <MiniCalendar />
          </div>

          {/* My Balances */}
          <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--foreground)' }}>I Miei Saldi</h3>
            {balances.filter(b => b.user_id === user?.user_id).map((b, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--foreground)' }}>{b.leave_type_name || b.leave_type_id}</span>
                  <span style={{ color: 'var(--muted-foreground)' }}>{b.total_days - b.used_days}/{b.total_days}</span>
                </div>
                <div style={{ height: '6px', borderRadius: '3px', background: 'var(--muted)' }}>
                  <div style={{
                    height: '100%', borderRadius: '3px',
                    background: b.leave_type_color || 'var(--primary)',
                    width: `${Math.min(100, (b.used_days / b.total_days) * 100)}%`,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
