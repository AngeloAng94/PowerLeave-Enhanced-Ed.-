import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { NotificationService } from '../context/NotificationContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('org');
  const [org, setOrg] = useState(null);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [rules, setRules] = useState(null);
  const [team, setTeam] = useState([]);

  const [orgForm, setOrgForm] = useState({ name: '' });
  const [typeForm, setTypeForm] = useState({ name: '', color: '#22C55E', days_per_year: 26 });
  const [editingType, setEditingType] = useState(null);
  const [rulesForm, setRulesForm] = useState({ min_notice_days: 7, max_consecutive_days: 15, auto_approve_under_days: 0 });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [o, t, r, m] = await Promise.all([
        api.get('/api/organization'),
        api.get('/api/leave-types'),
        api.get('/api/settings/rules'),
        api.get('/api/team'),
      ]);
      setOrg(o);
      setOrgForm({ name: o.name || '' });
      setLeaveTypes(t);
      setRules(r);
      setRulesForm({
        min_notice_days: r.min_notice_days || 7,
        max_consecutive_days: r.max_consecutive_days || 15,
        auto_approve_under_days: r.auto_approve_under_days || 0,
      });
      setTeam(m);
    } catch (err) { console.error(err); }
  };

  const handleSaveOrg = async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/organization', orgForm);
      NotificationService.success('Salvato', 'Organizzazione aggiornata');
      loadAll();
    } catch (err) { NotificationService.error('Errore', err.message); }
  };

  const handleCreateType = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/leave-types', typeForm);
      NotificationService.success('Creato', 'Tipo di assenza creato');
      setTypeForm({ name: '', color: '#22C55E', days_per_year: 26 });
      loadAll();
    } catch (err) { NotificationService.error('Errore', err.message); }
  };

  const handleUpdateType = async (typeId) => {
    try {
      await api.put(`/api/leave-types/${typeId}`, editingType);
      NotificationService.success('Aggiornato', 'Tipo di assenza aggiornato');
      setEditingType(null);
      loadAll();
    } catch (err) { NotificationService.error('Errore', err.message); }
  };

  const handleDeleteType = async (typeId) => {
    if (!window.confirm('Eliminare questo tipo di assenza?')) return;
    try {
      await api.delete(`/api/leave-types/${typeId}`);
      NotificationService.success('Eliminato', 'Tipo di assenza eliminato');
      loadAll();
    } catch (err) { NotificationService.error('Errore', err.message); }
  };

  const handleSaveRules = async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/settings/rules', rulesForm);
      NotificationService.success('Salvato', 'Regole aggiornate');
    } catch (err) { NotificationService.error('Errore', err.message); }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/api/team/${userId}`, { role: newRole });
      NotificationService.success('Aggiornato', 'Ruolo aggiornato');
      loadAll();
    } catch (err) { NotificationService.error('Errore', err.message); }
  };

  const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: '8px',
    border: '1px solid var(--border)', background: 'var(--input-bg)',
    color: 'var(--foreground)', fontSize: '14px', boxSizing: 'border-box',
  };

  const tabs = [
    { id: 'org', label: 'Organizzazione' },
    { id: 'types', label: 'Tipi Assenza' },
    { id: 'rules', label: 'Regole' },
    { id: 'team', label: 'Team' },
  ];

  return (
    <div data-testid="settings-page">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
        {tabs.map(tab => (
          <button key={tab.id} data-testid={`settings-tab-${tab.id}`} onClick={() => setActiveTab(tab.id)} style={{
            padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none',
            background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
            color: activeTab === tab.id ? 'white' : 'var(--muted-foreground)',
            cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === tab.id ? 600 : 400,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Organization Tab */}
      {activeTab === 'org' && org && (
        <div style={{ maxWidth: '500px', padding: '24px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--foreground)' }}>Dati Organizzazione</h3>
          <form onSubmit={handleSaveOrg}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--foreground)' }}>Nome azienda</label>
              <input data-testid="org-name" value={orgForm.name} onChange={e => setOrgForm({...orgForm, name: e.target.value})} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--foreground)' }}>ID Organizzazione</label>
              <input value={org.org_id || ''} disabled style={{...inputStyle, opacity: 0.6}} />
            </div>
            <button data-testid="save-org" type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Salva</button>
          </form>
        </div>
      )}

      {/* Leave Types Tab */}
      {activeTab === 'types' && (
        <div>
          <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--foreground)' }}>Tipi di Assenza</h3>
            {leaveTypes.map(t => (
              <div key={t.id} style={{ padding: '12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {editingType && editingType.id === t.id ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
                    <input value={editingType.name} onChange={e => setEditingType({...editingType, name: e.target.value})} style={{...inputStyle, width: '150px'}} />
                    <input type="color" value={editingType.color} onChange={e => setEditingType({...editingType, color: e.target.value})} style={{ width: '40px', height: '32px', border: 'none', cursor: 'pointer' }} />
                    <input type="number" value={editingType.days_per_year} onChange={e => setEditingType({...editingType, days_per_year: parseInt(e.target.value)})} style={{...inputStyle, width: '80px'}} />
                    <button onClick={() => handleUpdateType(t.id)} style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', background: '#22C55E', color: 'white', cursor: 'pointer', fontSize: '12px' }}>Salva</button>
                    <button onClick={() => setEditingType(null)} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)', cursor: 'pointer', fontSize: '12px' }}>Annulla</button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: t.color }} />
                      <span style={{ fontWeight: 500, color: 'var(--foreground)' }}>{t.name}</span>
                      <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>({t.days_per_year} gg/anno)</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setEditingType({...t})} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)', cursor: 'pointer', fontSize: '12px' }}>Modifica</button>
                      {t.is_custom && <button onClick={() => handleDeleteType(t.id)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#FEE2E2', color: '#DC2626', cursor: 'pointer', fontSize: '12px' }}>Elimina</button>}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* New Type Form */}
          <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--foreground)' }}>Nuovo Tipo di Assenza</h3>
            <form onSubmit={handleCreateType} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--foreground)' }}>Nome</label>
                <input data-testid="new-type-name" value={typeForm.name} onChange={e => setTypeForm({...typeForm, name: e.target.value})} required placeholder="Es. Studio" style={{...inputStyle, width: '150px'}} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--foreground)' }}>Colore</label>
                <input type="color" value={typeForm.color} onChange={e => setTypeForm({...typeForm, color: e.target.value})} style={{ width: '40px', height: '36px', border: 'none', cursor: 'pointer' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--foreground)' }}>GG/Anno</label>
                <input data-testid="new-type-days" type="number" value={typeForm.days_per_year} onChange={e => setTypeForm({...typeForm, days_per_year: parseInt(e.target.value)})} style={{...inputStyle, width: '80px'}} />
              </div>
              <button data-testid="create-type-btn" type="submit" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Crea</button>
            </form>
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div style={{ maxWidth: '500px', padding: '24px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--foreground)' }}>Regole Aziendali</h3>
          <form onSubmit={handleSaveRules}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--foreground)' }}>Preavviso minimo (giorni)</label>
              <input data-testid="rule-notice" type="number" value={rulesForm.min_notice_days} onChange={e => setRulesForm({...rulesForm, min_notice_days: parseInt(e.target.value)})} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--foreground)' }}>Max giorni consecutivi</label>
              <input data-testid="rule-max-days" type="number" value={rulesForm.max_consecutive_days} onChange={e => setRulesForm({...rulesForm, max_consecutive_days: parseInt(e.target.value)})} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: 'var(--foreground)' }}>Auto-approva sotto (giorni)</label>
              <input data-testid="rule-auto-approve" type="number" value={rulesForm.auto_approve_under_days} onChange={e => setRulesForm({...rulesForm, auto_approve_under_days: parseInt(e.target.value)})} style={inputStyle} />
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '4px' }}>0 = disabilitato</div>
            </div>
            <button data-testid="save-rules" type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Salva Regole</button>
          </form>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--foreground)' }}>Gestione Ruoli Team</h3>
          {team.map(member => (
            <div key={member.user_id} style={{ padding: '12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 500, color: 'var(--foreground)' }}>{member.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{member.email}</div>
              </div>
              <select value={member.role} onChange={e => handleRoleChange(member.user_id, e.target.value)} disabled={member.user_id === user?.user_id} style={{...inputStyle, width: '140px', opacity: member.user_id === user?.user_id ? 0.5 : 1}}>
                <option value="user">Dipendente</option>
                <option value="admin">Amministratore</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
