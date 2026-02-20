import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [balances, setBalances] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r, b, t] = await Promise.all([
          api.get('/api/stats'),
          api.get('/api/leave-requests'),
          api.get('/api/leave-balances'),
          api.get('/api/leave-types'),
        ]);
        setStats(s);
        setRequests(r);
        setBalances(b);
        setLeaveTypes(t);
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  if (!stats) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)' }}>Caricamento...</div>;

  const approved = requests.filter(r => r.status === 'approved');
  const pending = requests.filter(r => r.status === 'pending');
  const rejected = requests.filter(r => r.status === 'rejected');

  // Monthly trend (last 6 months)
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const count = approved.filter(r => r.start_date?.startsWith(key)).length;
    months.push({ label: d.toLocaleDateString('it-IT', { month: 'short' }), count });
  }
  const maxMonth = Math.max(1, ...months.map(m => m.count));

  // Type distribution
  const typeStats = leaveTypes.map(t => {
    const count = approved.filter(r => r.leave_type_id === t.id).length;
    return { name: t.name, color: t.color, count };
  }).filter(t => t.count > 0);
  const totalTypeCount = Math.max(1, typeStats.reduce((a, b) => a + b.count, 0));

  // Per-user summary
  const userBalances = {};
  balances.forEach(b => {
    if (!userBalances[b.user_id]) userBalances[b.user_id] = { name: b.user_name || b.user_id, types: [] };
    userBalances[b.user_id].types.push(b);
  });

  return (
    <div data-testid="stats-page">
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Totale Richieste', value: requests.length, color: '#3B82F6' },
          { label: 'Approvate', value: approved.length, color: '#22C55E' },
          { label: 'In Attesa', value: pending.length, color: '#F59E0B' },
          { label: 'Rifiutate', value: rejected.length, color: '#EF4444' },
          { label: 'Utilizzo', value: `${stats.utilization_rate}%`, color: '#8B5CF6' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '16px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{s.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Monthly Trend */}
        <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--foreground)' }}>Trend Mensile (Approvate)</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
            {months.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground)' }}>{m.count}</div>
                <div style={{
                  width: '100%', borderRadius: '4px 4px 0 0',
                  background: 'var(--primary)', opacity: 0.7 + (m.count / maxMonth) * 0.3,
                  height: `${Math.max(4, (m.count / maxMonth) * 100)}px`,
                  transition: 'height 0.3s ease',
                }} />
                <div style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Type Distribution */}
        <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--foreground)' }}>Distribuzione per Tipo</h3>
          {typeStats.length === 0 ? (
            <p style={{ color: 'var(--muted-foreground)', fontSize: '14px' }}>Nessun dato</p>
          ) : (
            <div>
              {typeStats.map((t, i) => (
                <div key={i} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>{t.name}</span>
                    <span style={{ color: 'var(--muted-foreground)' }}>{t.count} ({Math.round(t.count / totalTypeCount * 100)}%)</span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '4px', background: 'var(--muted)' }}>
                    <div style={{
                      height: '100%', borderRadius: '4px', background: t.color,
                      width: `${(t.count / totalTypeCount) * 100}%`,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Balances Table */}
      <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--foreground)' }}>Saldi per Dipendente</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid var(--border)', color: 'var(--muted-foreground)', fontWeight: 600 }}>Dipendente</th>
                {leaveTypes.map(t => (
                  <th key={t.id} style={{ textAlign: 'center', padding: '8px 12px', borderBottom: '2px solid var(--border)', color: t.color, fontWeight: 600 }}>{t.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.values(userBalances).map((ub, i) => (
                <tr key={i}>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontWeight: 500, color: 'var(--foreground)' }}>{ub.name}</td>
                  {leaveTypes.map(t => {
                    const bal = ub.types.find(b => b.leave_type_id === t.id);
                    if (!bal) return <td key={t.id} style={{ textAlign: 'center', padding: '8px 12px', borderBottom: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>—</td>;
                    return (
                      <td key={t.id} style={{ textAlign: 'center', padding: '8px 12px', borderBottom: '1px solid var(--border)', color: 'var(--foreground)' }}>
                        {bal.total_days - bal.used_days}/{bal.total_days}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
