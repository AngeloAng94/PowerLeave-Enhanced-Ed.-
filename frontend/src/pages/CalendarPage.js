import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [leaves, setLeaves] = useState([]);
  const [closures, setClosures] = useState([]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [leavesData, closuresData] = await Promise.all([
          api.get(`/api/calendar/monthly?year=${year}&month=${month}`),
          api.get(`/api/calendar/closures?year=${year}&month=${month}`),
        ]);
        setLeaves(leavesData);
        setClosures(closuresData);
      } catch (err) {
        console.error('Calendar load error:', err);
      }
    };
    loadData();
  }, [year, month]);

  const daysInMonth = new Date(year, currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(year, currentMonth.getMonth(), 1).getDay();
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
  const today = new Date();

  const days = [];
  for (let i = 0; i < adjustedFirstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const getEventsForDay = (day) => {
    if (!day) return { dayLeaves: [], dayClosure: null };
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayLeaves = leaves.filter(l => l.start_date <= dateStr && l.end_date >= dateStr);
    const dayClosure = closures.find(c => {
      const start = c.start_date || c.date;
      const end = c.end_date || c.date;
      return start <= dateStr && end >= dateStr;
    });
    return { dayLeaves, dayClosure };
  };

  const isToday = (d) => d === today.getDate() && currentMonth.getMonth() === today.getMonth() && year === today.getFullYear();

  const statusColors = { approved: '#22C55E', pending: '#F59E0B', rejected: '#EF4444' };

  return (
    <div data-testid="calendar-page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button onClick={() => setCurrentMonth(new Date(year, currentMonth.getMonth() - 1))} style={{
          padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)',
          background: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer',
        }}>Mese Precedente</button>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--foreground)' }}>
          {currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={() => setCurrentMonth(new Date(year, currentMonth.getMonth() + 1))} style={{
          padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)',
          background: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer',
        }}>Mese Successivo</button>
      </div>

      <div style={{ background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
            <div key={d} style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '13px', color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {days.map((day, i) => {
            const { dayLeaves, dayClosure } = getEventsForDay(day);
            return (
              <div key={i} style={{
                minHeight: '80px', padding: '6px', borderRight: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
                background: dayClosure ? 'rgba(239,68,68,0.05)' : isToday(day) ? 'rgba(59,130,246,0.05)' : 'transparent',
              }}>
                {day && (
                  <>
                    <div style={{
                      fontSize: '13px', fontWeight: isToday(day) ? 700 : 400,
                      color: isToday(day) ? 'var(--primary)' : 'var(--foreground)',
                      marginBottom: '4px',
                    }}>{day}</div>
                    {dayClosure && (
                      <div style={{ fontSize: '10px', padding: '1px 4px', borderRadius: '4px', background: '#FEE2E2', color: '#DC2626', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {dayClosure.reason}
                      </div>
                    )}
                    {dayLeaves.slice(0, 2).map((l, j) => (
                      <div key={j} style={{
                        fontSize: '10px', padding: '1px 4px', borderRadius: '4px',
                        background: `${statusColors[l.status] || '#999'}20`,
                        color: statusColors[l.status] || '#999',
                        marginBottom: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {l.user_name?.split(' ')[0]}
                      </div>
                    ))}
                    {dayLeaves.length > 2 && (
                      <div style={{ fontSize: '9px', color: 'var(--muted-foreground)' }}>+{dayLeaves.length - 2} altri</div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '12px', color: 'var(--muted-foreground)', flexWrap: 'wrap' }}>
        <span><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#22C55E', marginRight: '4px' }}></span>Approvata</span>
        <span><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B', marginRight: '4px' }}></span>In Attesa</span>
        <span><span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444', marginRight: '4px' }}></span>Chiusura/Festività</span>
      </div>
    </div>
  );
}
