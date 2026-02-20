import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { NotificationService } from '../context/NotificationContext';

export default function AnnouncementsPage({ user }) {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', priority: 'normal' });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await api.get('/api/announcements');
      setAnnouncements(data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/announcements/${editingId}`, form);
        NotificationService.success('Aggiornato', 'Annuncio aggiornato');
      } else {
        await api.post('/api/announcements', form);
        NotificationService.success('Pubblicato', 'Annuncio pubblicato');
      }
      setForm({ title: '', content: '', priority: 'normal' });
      setShowForm(false);
      setEditingId(null);
      loadAnnouncements();
    } catch (err) { NotificationService.error('Errore', err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questo annuncio?')) return;
    try {
      await api.delete(`/api/announcements/${id}`);
      NotificationService.success('Eliminato', 'Annuncio eliminato');
      loadAnnouncements();
    } catch (err) { NotificationService.error('Errore', err.message); }
  };

  const startEdit = (a) => {
    setForm({ title: a.title, content: a.content, priority: a.priority || 'normal' });
    setEditingId(a.id);
    setShowForm(true);
  };

  const priorityColors = { high: '#EF4444', normal: '#3B82F6', low: '#6B7280' };
  const priorityLabels = { high: 'Alta', normal: 'Normale', low: 'Bassa' };

  const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: '8px',
    border: '1px solid var(--border)', background: 'var(--input-bg)',
    color: 'var(--foreground)', fontSize: '14px', boxSizing: 'border-box',
  };

  return (
    <div data-testid="announcements-page">
      {user?.role === 'admin' && (
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button data-testid="new-announcement-btn" onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: '', content: '', priority: 'normal' }); }} style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none',
            background: 'var(--primary)', color: 'white', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600,
          }}>{showForm ? 'Annulla' : 'Nuovo Annuncio'}</button>
        </div>
      )}

      {showForm && (
        <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--foreground)' }}>{editingId ? 'Modifica Annuncio' : 'Nuovo Annuncio'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--foreground)' }}>Titolo</label>
              <input data-testid="announcement-title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required style={inputStyle} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--foreground)' }}>Contenuto</label>
              <textarea data-testid="announcement-content" value={form.content} onChange={e => setForm({...form, content: e.target.value})} required rows={4} style={{...inputStyle, resize: 'vertical'}} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--foreground)' }}>Priorità</label>
              <select data-testid="announcement-priority" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} style={inputStyle}>
                <option value="low">Bassa</option>
                <option value="normal">Normale</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <button data-testid="announcement-submit" type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              {editingId ? 'Aggiorna' : 'Pubblica'}
            </button>
          </form>
        </div>
      )}

      {announcements.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          Nessun annuncio pubblicato
        </div>
      ) : announcements.map(a => (
        <div key={a.id} data-testid={`announcement-${a.id}`} style={{
          padding: '20px', borderRadius: '12px', background: 'var(--card)',
          border: '1px solid var(--border)', marginBottom: '12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)' }}>{a.title}</h3>
                <span style={{
                  padding: '1px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 600,
                  background: `${priorityColors[a.priority] || '#6B7280'}20`,
                  color: priorityColors[a.priority] || '#6B7280',
                }}>{priorityLabels[a.priority] || a.priority}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                {a.author_name} — {new Date(a.created_at).toLocaleDateString('it-IT')}
              </div>
            </div>
            {user?.role === 'admin' && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => startEdit(a)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)', cursor: 'pointer', fontSize: '12px' }}>Modifica</button>
                <button onClick={() => handleDelete(a.id)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#FEE2E2', color: '#DC2626', cursor: 'pointer', fontSize: '12px' }}>Elimina</button>
              </div>
            )}
          </div>
          <p style={{ fontSize: '14px', color: 'var(--foreground)', lineHeight: 1.6 }}>{a.content}</p>
        </div>
      ))}
    </div>
  );
}
