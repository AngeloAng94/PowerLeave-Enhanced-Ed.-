# PowerLeave - Product Requirements Document

## Original Problem Statement
Convertire PowerLeave in una piattaforma SaaS moderna per PMI italiane con design raffinato, sistema di gestione ferie completo, bacheca annunci e gestione chiusure aziendali.

## Architecture
- **Frontend**: React 18 + CSS Custom (Inter font, colori brand)
- **Backend**: FastAPI + MongoDB (Motor async)
- **Auth**: JWT + Emergent Google OAuth
- **Design**: Navy (#0F172A) + Blue (#2563EB), logo razzo
- **Theme**: Light/Dark mode con toggle animato

## Demo Users
| Email | Password | Ruolo |
|-------|----------|-------|
| admin@demo.it | demo123 | Admin (Marco Rossi) |
| mario@demo.it | demo123 | User (Mario Bianchi) |
| anna@demo.it | demo123 | User (Anna Verdi) |
| luigi@demo.it | demo123 | User (Luigi Neri) |

## What's Been Implemented (Feb 2026)

### Core Features
- ✅ Sistema autenticazione JWT + Google OAuth
- ✅ Persistenza sessione (credentials: include + CORS fix)
- ✅ Dashboard completa con stats, form richieste, approvazioni
- ✅ Calendario ferie condiviso
- ✅ Gestione team (inviti, ruoli)
- ✅ Saldo ferie per utente e tipo assenza

### New Features (Sessione Corrente)
- ✅ **Toggle Light/Dark Mode** - Animato nell'header con icona luna/sole
- ✅ **Bacheca Annunci** - CRUD completo, priorità (Urgente/Normale/Bassa), solo admin può creare
- ✅ **Chiusure Aziendali** - Periodi di ferie obbligatorie con:
  - Creazione automatica richieste ferie per tutti
  - Sistema di deroghe (richiesta/approvazione)
  - Festività italiane 2026 pre-caricate
- ✅ **Tema Dark migliorato** - Colori più profondi e raffinati

### Pages
- Dashboard (stats, form, approvazioni)
- Calendario (vista mensile, legenda colori)
- Richieste Ferie (lista con filtri)
- Bacheca Annunci (comunicazioni aziendali)
- Chiusure Aziendali (festività, shutdown, deroghe)
- Team (gestione membri)
- Statistiche (report utilizzo)
- Impostazioni (profilo, organizzazione)

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/session (OAuth)
- GET /api/auth/me
- POST /api/auth/logout

### Leave Management
- GET/POST /api/leave-requests
- PUT /api/leave-requests/{id}/review
- GET /api/leave-types
- GET /api/leave-balances
- GET /api/stats
- GET /api/calendar/monthly

### Announcements
- GET /api/announcements
- POST /api/announcements (admin)
- PUT /api/announcements/{id} (admin)
- DELETE /api/announcements/{id} (admin)

### Closures
- GET /api/closures
- POST /api/closures (admin)
- DELETE /api/closures/{id} (admin)
- POST /api/closures/{id}/exception
- GET /api/closures/exceptions
- PUT /api/closures/exceptions/{id}/review (admin)

### Team
- GET /api/team
- POST /api/team/invite (admin)
- PUT /api/team/{id} (admin)
- DELETE /api/team/{id} (admin)

## Test Results (Sessione Corrente)
- Backend: 100% (22 test passati)
- Frontend: 100% (tutti i test E2E)
- File test: /app/backend/tests/test_powerleave_api.py

## Known Issues
- Sidebar fuori viewport su alcune risoluzioni (issue CSS responsive minore)

## Next Tasks (P1)
- [ ] Migliorare layout sidebar responsive
- [ ] Integrazione Google Calendar
- [ ] Integrazione Outlook Calendar
- [ ] Notifiche email (SendGrid)

## Future Tasks (P2)
- [ ] Export CSV/PDF report
- [ ] App mobile PWA
- [ ] Dashboard analytics avanzate
- [ ] Multi-language support
