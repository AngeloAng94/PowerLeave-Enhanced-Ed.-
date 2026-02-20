# PowerLeave - Product Requirements Document

## Original Problem Statement
Sistema di gestione ferie per PMI italiane con design moderno, configurabile dalle aziende. Trasformare il progetto GitHub PowerLeave in un'applicazione SaaS production-ready.

## Architecture
- **Frontend**: React 18 + CSS Custom + Sonner + React.lazy (code splitting)
- **Backend**: FastAPI modulare (14 file) + MongoDB (Motor async) + slowapi
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

### Session 7 - 20 Feb 2026 (Structural Refactoring)
- Audit v2 tabelle sincronizzate con fix applicati
- Backend: server.py (1489→77 righe) refactored in 14 moduli (config, models, auth, database, seed, 8 route files)
- Frontend: App.js (3533→57 righe) refactored in 20+ file (pages/*, components/*, context/*, lib/*)
- React.lazy code splitting su 5 pagine (StatsPage, CalendarPage, SettingsPage, AnnouncementsPage, ClosuresPage)
- Logica init_leave_balances centralizzata in database.py (risolto D08)
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
├── components/ (Icons, ThemeToggle, MiniCalendar)
└── pages/ (13 page files with React.lazy for 5)
```

## Next Tasks
- [ ] Dockerizzazione (Dockerfile + docker-compose)
- [ ] README.md professionale
- [ ] Hardening residuo: token rotation, Error Boundary, test frontend

## Future (P1-P2)
- [ ] Google Calendar integration (on hold)
- [ ] Email notifications SendGrid (on hold)
- [ ] Export report, grafici recharts, PWA
- [ ] Multi-livello approvazioni
