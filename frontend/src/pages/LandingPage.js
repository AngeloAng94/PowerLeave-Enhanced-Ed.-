import React from 'react';
import { useAuth } from '../context/AuthContext';
import { RocketLogo, Icons, ANTHERA_LOGO_URL } from '../components/Icons';
import ThemeToggle from '../components/ThemeToggle';

export default function LandingPage() {
  const { loginWithGoogle } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: '1px solid var(--border)',
        background: 'var(--card)', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <RocketLogo size={32} />
          <span style={{ fontWeight: 700, fontSize: '20px' }}>PowerLeave</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ThemeToggle />
          <a href="#/login" data-testid="nav-login" style={{
            padding: '8px 16px', borderRadius: '8px', textDecoration: 'none',
            color: 'var(--foreground)', border: '1px solid var(--border)',
            fontSize: '14px', fontWeight: 500,
          }}>Accedi</a>
          <a href="#/register" data-testid="nav-register" style={{
            padding: '8px 16px', borderRadius: '8px', textDecoration: 'none',
            color: 'white', background: 'var(--primary)',
            fontSize: '14px', fontWeight: 500,
          }}>Registrati</a>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        padding: '80px 24px', textAlign: 'center', maxWidth: '800px', margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-block', padding: '4px 16px', borderRadius: '20px',
          background: 'var(--muted)', fontSize: '13px', fontWeight: 500,
          marginBottom: '24px', color: 'var(--muted-foreground)',
        }}>
          Gestione Ferie Semplice e Veloce
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1.1, marginBottom: '20px' }}>
          Gestisci le ferie del tuo team in modo{' '}
          <span style={{ color: 'var(--primary)' }}>semplice e veloce</span>
        </h1>
        <p style={{
          fontSize: '18px', color: 'var(--muted-foreground)',
          maxWidth: '600px', margin: '0 auto 32px',
        }}>
          PowerLeave automatizza la gestione delle assenze, ferie e permessi per la tua azienda.
          Dashboard intuitiva, approvazioni rapide, analytics avanzate.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#/register" data-testid="hero-cta" style={{
            padding: '14px 32px', borderRadius: '10px', textDecoration: 'none',
            color: 'white', background: 'var(--primary)',
            fontSize: '16px', fontWeight: 600,
          }}>Inizia Gratis</a>
          <a href="#/login" style={{
            padding: '14px 32px', borderRadius: '10px', textDecoration: 'none',
            color: 'var(--foreground)', border: '1px solid var(--border)',
            fontSize: '16px', fontWeight: 500,
          }}>Demo Live</a>
        </div>
      </section>

      {/* Features */}
      <section style={{
        padding: '60px 24px', background: 'var(--muted)',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 700, marginBottom: '40px' }}>
            Tutto ciò che ti serve
          </h2>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {[
              { title: 'Dashboard Intelligente', desc: 'Panoramica completa delle assenze del team con statistiche in tempo reale.' },
              { title: 'Approvazioni Rapide', desc: 'Approva o rifiuta le richieste con un click. Notifiche istantanee.' },
              { title: 'Calendario Condiviso', desc: 'Visualizza le ferie di tutto il team in un calendario unificato.' },
              { title: 'Analytics Avanzate', desc: 'Report dettagliati su utilizzo ferie, trend e distribuzione assenze.' },
              { title: 'Chiusure Aziendali', desc: 'Gestisci le chiusure obbligatorie con sistema di deroghe.' },
              { title: 'Multi-Tenant', desc: 'Ogni azienda ha il proprio spazio isolato e configurabile.' },
            ].map((f, i) => (
              <div key={i} style={{
                padding: '24px', borderRadius: '12px', background: 'var(--card)',
                border: '1px solid var(--border)',
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '60px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '16px' }}>Prezzi Semplici</h2>
          <p style={{ color: 'var(--muted-foreground)', marginBottom: '40px' }}>Inizia gratis, scala quando cresci.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {[
              { name: 'Free', price: '0', features: ['Fino a 5 dipendenti', 'Dashboard base', 'Calendario'] },
              { name: 'Pro', price: '4.99', badge: 'POPOLARE', features: ['Fino a 50 dipendenti', 'Analytics avanzate', 'Chiusure aziendali', 'Bacheca annunci'] },
              { name: 'Enterprise', price: 'Custom', features: ['Dipendenti illimitati', 'SSO/SAML', 'API Access', 'Supporto dedicato'] },
            ].map((plan, i) => (
              <div key={i} style={{
                padding: '32px 24px', borderRadius: '12px', background: 'var(--card)',
                border: plan.badge ? '2px solid var(--primary)' : '1px solid var(--border)',
                position: 'relative',
              }}>
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                    padding: '2px 12px', borderRadius: '12px', background: 'var(--primary)',
                    color: 'white', fontSize: '11px', fontWeight: 700,
                  }}>{plan.badge}</div>
                )}
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>{plan.name}</h3>
                <div style={{ fontSize: '36px', fontWeight: 800, marginBottom: '16px' }}>
                  {plan.price === 'Custom' ? plan.price : <>€{plan.price}<span style={{ fontSize: '14px', fontWeight: 400 }}>/mese/utente</span></>}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', textAlign: 'left' }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ padding: '6px 0', fontSize: '14px', color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}>{f}</li>
                  ))}
                </ul>
                <a href="#/register" style={{
                  display: 'block', padding: '10px', borderRadius: '8px', textDecoration: 'none',
                  textAlign: 'center', fontWeight: 600, fontSize: '14px',
                  background: plan.badge ? 'var(--primary)' : 'var(--muted)',
                  color: plan.badge ? 'white' : 'var(--foreground)',
                }}>Inizia</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '24px', textAlign: 'center', borderTop: '1px solid var(--border)',
        fontSize: '13px', color: 'var(--muted-foreground)',
      }}>
        PowerLeave — Gestione Ferie Semplice e Veloce
      </footer>
    </div>
  );
}
