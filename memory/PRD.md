# PowerLeave - Product Requirements Document

## Original Problem Statement
Convertire PowerLeave in una piattaforma SaaS moderna per PMI italiane, replicando fedelmente il design originale di Manus con tutte le funzionalità.

## Architecture
- **Frontend**: React 18 + CSS Custom (Inter font, colori brand)
- **Backend**: FastAPI + MongoDB (Motor async)
- **Auth**: JWT + Emergent Google OAuth
- **Design**: Navy (#0F172A) + Blue (#2563EB), logo razzo

## Demo Users
| Email | Password | Ruolo |
|-------|----------|-------|
| admin@demo.it | demo123 | Admin (Marco Rossi) |
| mario@demo.it | demo123 | User (Mario Bianchi) |
| anna@demo.it | demo123 | User (Anna Verdi) |
| luigi@demo.it | demo123 | User (Luigi Neri) |

## What's Been Implemented (Feb 2026)

### Dashboard Completo (come originale Manus)
- ✅ Header "Power Leave" con sottotitolo italiano
- ✅ 4 Stats Cards: Ferie Approvate, Richieste in Sospeso, Staff Disponibile, Utilizzo
- ✅ Form inline "Invia una richiesta" (Tipo, Date, Ore, Note)
- ✅ Admin: "Richieste da Approvare" con pulsanti Approva/Rifiuta
- ✅ User: "Le mie Richieste" (senza pulsanti approvazione)
- ✅ "Saldo ferie Team" con cards per ogni dipendente (In Cda, Usate, Disponibili)
- ✅ Calendario integrato con legenda
- ✅ Tabella "Riepilogo Utilizzo Ferie"

### Pagine Aggiuntive
- ✅ Calendario (full month view)
- ✅ Stats (statistiche dettagliate)
- ✅ Richieste Ferie (lista con filtri)
- ✅ Team (gestione membri)
- ✅ Impostazioni

### Sidebar Menu
- Dashboard, Calendario, Stats, Richieste Ferie, Team, Impostazioni

## Test Results
- Backend: 100% (11 endpoints)
- Frontend: 95%
- Integration: 100%

## Next Tasks
- [ ] Notifiche email
- [ ] Integrazione Google Calendar
- [ ] Export CSV/PDF
