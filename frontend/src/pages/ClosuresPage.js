import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { NotificationService } from '../context/NotificationContext';

export default function ClosuresPage({ user }) {
  const [closures, setClosures] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    start_date: '', end_date: '', reason: '',
    type: 'shutdown', auto_leave: false, allow_exceptions: true,
  });
  const [exceptionForm, setExceptionForm] = useState({ closure_id: '', reason: '' });
  const [showExceptionForm, setShowExceptionForm] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [c, e] = await Promise.all([
        api.get('/api/closures?year=2026'),
        api.get('/api/closures/exceptions'),
      ]);
      setClosures(c);
      setExceptions(e);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/closures', formData);
      NotificationService.success('Creata', 'Chiusura aziendale creata');
      setFormData({ start_date: '', end_date: '', reason: '', type: 'shutdown', auto_leave: false, allow_exceptions: true });
      setShowForm(false);
      loadData();
    } catch (err) { NotificationService.error('Errore', err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questa chiusura?')) return;
    try {
      await api.delete(`/api/closures/${id}`);
      NotificationService.success('Eliminata', 'Chiusura eliminata');
      loadData();
    } catch (err) { NotificationService.error('Errore', err.message); }
  };

  const handleRequestException = async (closureId) => {
    try {
      await api.post(`/api/closures/${closureId}/exception`, { reason: exceptionForm.reason });
      NotificationService.success('Inviata', 'Richiesta di deroga inviata');
      setShowExceptionForm(null);
      setExceptionForm({ closure_id: '', reason: '' });
      loadData();
    } catch (err) { NotificationService.error('Errore', err.message); }
  };

  const handleReviewException = async (exceptionId, status) => {
    try {
      await api.put(`/api/closures/exceptions/${exceptionId}/review`, { status });
      NotificationService.success(
        status === 'approved' ? 'Approvata' : 'Rifiutata',
        `Deroga ${status === 'approved' ? 'approvata' : 'rifiutata'}`
      );
      loadData();
    } catch (err) { NotificationService.error('Errore', err.message); }
  };

  const holidays = closures.filter(c => c.type === 'holiday');
  const shutdowns = closures.filter(c => c.type === 'shutdown');

  const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: '8px',
    border: '1px solid var(--border)', background: 'var(--input-bg)',
    color: 'var(--foreground)', fontSize: '14px', boxSizing: 'border-box',
  };

  return (
    <div data-testid="closures-page">
      {/* Admin Form */}
      {user?.role === 'admin' && (
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button data-testid="new-closure-btn" onClick={() => setShowForm(!showForm)} style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none',
            background: 'var(--primary)', color: 'white', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600,
          }}>{showForm ? 'Annulla' : 'Nuova Chiusura'}</button>
        </div>
      )}

      {showForm && (
        <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--foreground)' }}>Nuova Chiusura Aziendale</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px', color: 'var(--foreground)' }}>Data inizio</label>
                <input data-testid="closure-start" type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} required style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px', color: 'var(--foreground)' }}>Data fine</label>
                <input data-testid="closure-end" type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} required style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px', color: 'var(--foreground)' }}>Motivo</label>
              <input data-testid="closure-reason" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} required placeholder="Es. Chiusura estiva" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--foreground)', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.auto_leave} onChange={e => setFormData({...formData, auto_leave: e.target.checked})} />
                Crea ferie automatiche
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--foreground)', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.allow_exceptions} onChange={e => setFormData({...formData, allow_exceptions: e.target.checked})} />
                Consenti deroghe
              </label>
            </div>
            <button data-testid="closure-submit" type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Crea Chiusura</button>
          </form>
        </div>
      )}

      {/* Shutdowns */}
      {shutdowns.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--foreground)' }}>Chiusure Aziendali</h3>
          {shutdowns.map(c => (
            <div key={c.id} data-testid={`closure-${c.id}`} style={{
              padding: '16px', borderRadius: '12px', background: 'var(--card)',
              border: '1px solid var(--border)', marginBottom: '8px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>{c.reason}</div>
                  <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
                    {c.start_date} → {c.end_date}
                    {c.auto_leave && <span style={{ marginLeft: '8px', padding: '1px 6px', borderRadius: '8px', background: '#FEF3C7', color: '#D97706', fontSize: '10px' }}>Auto-ferie</span>}
                    {c.allow_exceptions && <span style={{ marginLeft: '4px', padding: '1px 6px', borderRadius: '8px', background: '#DBEAFE', color: '#2563EB', fontSize: '10px' }}>Deroghe</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {c.allow_exceptions && user?.role !== 'admin' && (
                    <button onClick={() => setShowExceptionForm(showExceptionForm === c.id ? null : c.id)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)', cursor: 'pointer', fontSize: '12px' }}>Chiedi Deroga</button>
                  )}
                  {user?.role === 'admin' && (
                    <button onClick={() => handleDelete(c.id)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#FEE2E2', color: '#DC2626', cursor: 'pointer', fontSize: '12px' }}>Elimina</button>
                  )}
                </div>
              </div>
              {showExceptionForm === c.id && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'var(--muted)', borderRadius: '8px' }}>
                  <input value={exceptionForm.reason} onChange={e => setExceptionForm({...exceptionForm, reason: e.target.value})} placeholder="Motivo della deroga..." style={{...inputStyle, marginBottom: '8px'}} />
                  <button onClick={() => handleRequestException(c.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontSize: '12px' }}>Invia</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Holidays */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--foreground)' }}>Festività Nazionali ({holidays.length})</h3>
        <div style={{ background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          {holidays.map(h => (
            <div key={h.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500, color: 'var(--foreground)', fontSize: '14px' }}>{h.reason}</span>
              <span style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>{h.start_date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Exceptions */}
      {exceptions.length > 0 && (
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--foreground)' }}>Richieste di Deroga ({exceptions.length})</h3>
          {exceptions.map(exc => (
            <div key={exc.id} data-testid={`exception-${exc.id}`} style={{
              padding: '16px', borderRadius: '12px', background: 'var(--card)',
              border: '1px solid var(--border)', marginBottom: '8px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{exc.user_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{exc.reason}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                    background: exc.status === 'approved' ? '#DCFCE7' : exc.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                    color: exc.status === 'approved' ? '#16A34A' : exc.status === 'rejected' ? '#DC2626' : '#D97706',
                  }}>{exc.status === 'approved' ? 'Approvata' : exc.status === 'rejected' ? 'Rifiutata' : 'In attesa'}</span>
                  {user?.role === 'admin' && exc.status === 'pending' && (
                    <>
                      <button onClick={() => handleReviewException(exc.id, 'approved')} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#22C55E', color: 'white', cursor: 'pointer', fontSize: '12px' }}>Approva</button>
                      <button onClick={() => handleReviewException(exc.id, 'rejected')} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#EF4444', color: 'white', cursor: 'pointer', fontSize: '12px' }}>Rifiuta</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
