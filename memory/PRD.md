# PowerLeave - Product Requirements Document

## Original Problem Statement
Sistema di gestione ferie per PMI italiane con design moderno, configurabile dalle aziende. Trasformare il progetto GitHub PowerLeave in un'applicazione SaaS production-ready.

## Architecture
- **Frontend**: React 18 + CSS Custom (variabili CSS per tema) + Sonner
- **Backend**: FastAPI + MongoDB (Motor async) + slowapi (rate limiting)
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

### Session 6 - 18 Feb 2026 (P0 Security & CI)
- SECRET_KEY fail-fast: app crasha all'avvio se manca in .env
- Rate limiting (slowapi) su /api/auth/login e /api/auth/register: 10/min per IP
- temp_password rimossa dalla response di POST /api/team/invite (log solo server-side)
- Test suite riscritta: 23 test idempotenti, 100% stabili su run consecutivi (3x verified)
- CI GitHub Actions: .github/workflows/ci.yml (backend pytest + frontend build)
- Fix 1: Schema company_closures unificato (date → start_date/end_date) + migrazione DB
- Fix 2: Indici MongoDB aggiunti su leave_types, leave_balances, announcements, closure_exceptions
- Fix 3: Paginazione su leave-requests, leave-balances, announcements
- Fix 4: Validazione password server-side (min 8 char + 1 numero)
- Fix 5: 4x datetime.now() → datetime.now(timezone.utc)
- Fix 6: CORS ristretto (methods + headers specifici)

### Session 5 - 18 Feb 2026 (Audit Tecnico)
- Audit v1: /app/AUDIT_TECNICO_POWERLEAVE.md (1023 righe)
- Audit v2 (post-P0 security): /app/AUDIT_TECNICO_POWERLEAVE_v2.md (607 righe, basato su lettura completa codice attuale)

### Session 4 - Feb 2026 (Configurabilita)
- Pagina Impostazioni (4 tab), Leave Types CRUD, Settings Rules API

### Session 3 - Feb 2026
- Fix contrasti dark mode, Sidebar moderna, Tabella team compatta

### Session 2 - Feb 2026
- Analytics Dashboard, Notifiche push (toast + browser)

### Session 1 - Feb 2026
- Auth JWT, Dashboard, Calendario, Richieste, Bacheca Annunci, Chiusure Aziendali

## Key Stats
- Backend: server.py (1480 righe, monolite)
- Frontend: App.js (3533 righe, monolite)
- DB: 8+ collections, 5 indici, 35 API endpoints
- Test: 23/23 passed (100%, 3 run consecutivi verificati)

## Next Tasks (P0 - Prima del lancio)
- [ ] Refactoring backend (server.py -> moduli)
- [ ] Refactoring frontend (App.js -> componenti separati)
- [ ] Dockerizzazione (Dockerfile + docker-compose)
- [ ] README.md professionale

## Future (P1-P2)
- [ ] Integrazione Google Calendar (on hold)
- [ ] Notifiche email SendGrid (on hold)
- [ ] Export report
- [ ] Grafici interattivi (recharts)
- [ ] Multi-livello approvazioni
- [ ] App mobile PWA
