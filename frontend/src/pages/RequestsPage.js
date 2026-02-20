import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function RequestsPage({ user }) {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get('/api/leave-requests');
        setRequests(data);
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  const statusStyle = (s) => ({
    padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
    background: s === 'approved' ? '#DCFCE7' : s === 'rejected' ? '#FEE2E2' : '#FEF3C7',
    color: s === 'approved' ? '#16A34A' : s === 'rejected' ? '#DC2626' : '#D97706',
  });

  const statusLabels = { approved: 'Approvata', rejected: 'Rifiutata', pending: 'In attesa' };

  return (
    <div data-testid="requests-page">
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: '20px', border: 'none', fontSize: '13px',
            background: filter === f ? 'var(--primary)' : 'var(--muted)',
            color: filter === f ? 'white' : 'var(--muted-foreground)',
            cursor: 'pointer', fontWeight: filter === f ? 600 : 400,
          }}>
            {f === 'all' ? 'Tutte' : statusLabels[f]} ({f === 'all' ? requests.length : requests.filter(r => r.status === f).length})
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        {filtered.map(req => (
          <div key={req.id} data-testid={`request-row-${req.id}`} style={{
            padding: '16px 20px', borderBottom: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{req.user_name}</div>
              <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
                {req.leave_type_name} — {req.start_date} → {req.end_date} ({req.days}gg, {req.hours === 8 ? 'intera' : req.hours === 4 ? 'mezza' : `${req.hours}h`})
              </div>
              {req.notes && <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '2px' }}>{req.notes}</div>}
            </div>
            <span style={statusStyle(req.status)}>{statusLabels[req.status] || req.status}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <p style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)' }}>Nessuna richiesta trovata</p>
        )}
      </div>
    </div>
  );
}
