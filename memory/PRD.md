# PowerLeave - Product Requirements Document

## Original Problem Statement
Sistema di gestione ferie per PMI italiane con design moderno, configurabile dalle aziende. Trasformare il progetto GitHub PowerLeave in un'applicazione SaaS production-ready.

## Architecture
- **Frontend**: React 18 + CSS Custom (variabili CSS per tema) + Sonner
- **Backend**: FastAPI + MongoDB (Motor async)
- **Auth**: JWT + Google OAuth (predisposto via Emergent)
- **Theme**: Light/Dark mode con persistenza localStorage

## Demo Users
| Email | Password | Ruolo |
|-------|----------|-------|
| admin@demo.it | demo123 | Admin |
| mario@demo.it | demo123 | User |
| anna@demo.it | demo123 | User |
| luigi@demo.it | demo123 | User |

## What's Been Implemented

### Session 5 - 18 Feb 2026 (Audit Tecnico)
- Audit tecnico completo generato: `/app/AUDIT_TECNICO_POWERLEAVE.md` (1023 righe)
- Copre: Architettura, Sicurezza, Backend, Frontend, DB Schema, API Reference (35 endpoint), Testing, CI/CD, Performance, Istruzioni Riproduzione, Debito Tecnico, Roadmap

### Session 4 - Feb 2026 (Configurabilita)
- Pagina Impostazioni Completa con 4 tab (Org, Leave Types, Rules, Team)
- Fix Hover Sidebar
- API Backend nuove: /api/leave-types CRUD, /api/settings/rules

### Session 3 - Feb 2026
- Fix contrasti dark mode
- Sidebar moderna con gradienti
- Tabella riepilogo team compatta

### Session 2 - Feb 2026
- Analytics Dashboard avanzate
- Notifiche push (toast + browser)

### Session 1 - Feb 2026
- Autenticazione JWT
- Dashboard, Calendario, Richieste
- Bacheca Annunci, Chiusure Aziendali

## Key Stats
- Backend: server.py (1463 righe, monolite)
- Frontend: App.js (3533 righe, monolite)
- CSS: index.css (541 righe)
- DB: 8 collections, 5 indici, 35 API endpoints
- Test: 95.5% backend, 100% frontend (4 iterazioni)

## Next Tasks (P0 - Prima del lancio)
- [ ] Rendere il progetto completamente funzionante e privo di bug
- [ ] Refactoring backend (server.py -> moduli)
- [ ] Refactoring frontend (App.js -> componenti separati)
- [ ] Fix sicurezza (SECRET_KEY, rate limiting)
- [ ] Dockerizzazione
- [ ] README.md professionale

## Future (P1-P2)
- [ ] Integrazione Google Calendar (on hold)
- [ ] Notifiche email SendGrid (on hold)
- [ ] Export report
- [ ] Grafici interattivi (recharts)
- [ ] Multi-livello approvazioni
- [ ] App mobile PWA
