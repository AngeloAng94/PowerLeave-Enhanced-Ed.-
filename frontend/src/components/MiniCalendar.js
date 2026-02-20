import React, { useState } from 'react';

export default function MiniCalendar({ leaves = [], closures = [] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
  const today = new Date();

  const days = [];
  for (let i = 0; i < adjustedFirstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div data-testid="mini-calendar">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <button onClick={() => setCurrentMonth(new Date(year, month - 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground)', fontSize: '16px' }}>&lt;</button>
        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--foreground)' }}>{currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</span>
        <button onClick={() => setCurrentMonth(new Date(year, month + 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground)', fontSize: '16px' }}>&gt;</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
        {['L','M','M','G','V','S','D'].map((d, i) => (
          <div key={i} style={{ fontSize: '10px', fontWeight: 600, color: 'var(--muted-foreground)', padding: '2px' }}>{d}</div>
        ))}
        {days.map((d, i) => (
          <div key={i} style={{
            fontSize: '11px', padding: '3px', borderRadius: '4px',
            background: isToday(d) ? 'var(--primary)' : 'transparent',
            color: isToday(d) ? 'white' : d ? 'var(--foreground)' : 'transparent',
            fontWeight: isToday(d) ? 700 : 400,
          }}>
            {d || ''}
          </div>
        ))}
      </div>
    </div>
  );
}
