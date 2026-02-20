# PowerLeave - Product Requirements Document

## Original Problem Statement
Sistema di gestione ferie per aziende italiane con design moderno, configurabile dalle aziende. Trasformare il progetto GitHub PowerLeave in un'applicazione SaaS production-ready.

## Architecture
- **Frontend**: React 18 + CSS Custom + Sonner + React.lazy (code splitting)
- **Backend**: FastAPI modulare (14 file) + MongoDB (Motor async) + slowapi
- **Auth**: JWT + Google OAuth (predisposto via Emergent)
- **Theme**: Light/Dark mode con persistenza localStorage (default: dark)

## Demo Users
| Email | Password | Ruolo |
|-------|----------|-------|
| admin@demo.it | demo123 | Admin |
| mario@demo.it | demo123 | User |
| anna@demo.it | demo123 | User |
| luigi@demo.it | demo123 | User |

## What's Been Implemented

### Session 8 - 20 Feb 2026 (UI/UX Fix)
- **Dark mode ripristinato come default** - ThemeToggle ora usa dark mode quando non c'è preferenza salvata
- **Logo originale ripristinato** - Immagine razzo al posto dell'icona SVG "P"
- **ThemeToggle aggiunto a tutte le pagine** - Landing, Login, Register ora hanno il toggle tema
- **Branding corretto** - Rimosso "PMI Italiane", ora dice "Gestione Ferie Semplice e Veloce"
- **Link home su Login/Register** - Logo cliccabile per tornare alla landing
- **Audit v2 aggiornato** - Aggiunte Appendice B (Refactoring) e Appendice C (Fix UI/UX)

### Session 7 - 19 Feb 2026 (Structural Refactoring)
- Audit v2 tabelle sincronizzate con fix applicati
- Backend: server.py (1489→77 righe) refactored in 14 moduli (config, models, auth, database, seed, 8 route files)
- Frontend: App.js (3533→57 righe) refactored in 20+ file (pages/*, components/*, context/*, lib/*)
- React.lazy code splitting su 5 pagine (StatsPage, CalendarPage, SettingsPage, AnnouncementsPage, ClosuresPage)
- Test: 30/30 backend + 100% frontend (testing agent iteration 5)

### Session 6 - 18 Feb 2026 (P0 Security & Fixes)
- SECRET_KEY fail-fast, rate limiting 10/min, temp_password rimossa dalla API
- Schema company_closures unificato (date→start_date/end_date)
- Indici MongoDB aggiunti, paginazione, validazione password, datetime UTC, CORS ristretto
- Test suite riscritta: 23 test idempotenti

### Sessions 1-5 (Previous)
- Auth JWT, Dashboard, Calendario, Richieste, Bacheca, Chiusure
- Analytics Dashboard, Notifiche push, Impostazioni (4 tab)
- Dark mode, Sidebar moderna, Fix contrasti
- Audit tecnici v1 e v2

## Current Code Structure
```
backend/ (14 file)
├── server.py (77 righe - wiring)
├── config.py, models.py, auth.py, database.py, seed.py
└── routes/ (auth, leave, stats, calendar, team, organization, announcements, closures)

frontend/src/ (20+ file)
├── App.js (57 righe - wiring)
├── lib/api.js, context/AuthContext.js, context/NotificationContext.js
├── components/ (Icons, ThemeToggle)
└── pages/ (13 page files with React.lazy for 5)
```

## Next Tasks (P0)
- [ ] Aggiungere `response_model` agli endpoint FastAPI (D04)
- [ ] Helper centralizzato init_leave_balances (D08)

## Upcoming Tasks (P1)
- [ ] Dockerizzazione (Dockerfile + docker-compose)
- [ ] README.md professionale

## Future (P2-P3)
- [ ] Google Calendar integration (on hold per utente)
- [ ] Email notifications SendGrid (on hold per utente)
- [ ] Export report, grafici recharts, PWA
- [ ] Multi-livello approvazioni
- [ ] Hardening: token rotation, Error Boundary, test frontend
