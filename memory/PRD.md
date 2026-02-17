# PowerLeave - Product Requirements Document

## Original Problem Statement
Convertire PowerLeave in una piattaforma SaaS moderna per PMI italiane con design raffinato, sistema di gestione ferie completo, bacheca annunci, gestione chiusure aziendali e analytics avanzate.

## Architecture
- **Frontend**: React 18 + Tailwind CSS + Sonner (Toast)
- **Backend**: FastAPI + MongoDB (Motor async)
- **Auth**: JWT + Emergent Google OAuth
- **Design**: Navy (#0F172A) + Blue (#3B82F6), logo razzo
- **Theme**: Light/Dark mode con toggle animato nell'header

## Demo Users
| Email | Password | Ruolo |
|-------|----------|-------|
| admin@demo.it | demo123 | Admin (Marco Rossi) |
| mario@demo.it | demo123 | User (Mario Bianchi) |
| anna@demo.it | demo123 | User (Anna Verdi) |
| luigi@demo.it | demo123 | User (Luigi Neri) |

## What's Been Implemented

### Core Features
- ✅ Sistema autenticazione JWT + Google OAuth
- ✅ Persistenza sessione (credentials: include + CORS fix)
- ✅ Dashboard completa con stats, form richieste, approvazioni
- ✅ Calendario ferie condiviso
- ✅ Gestione team (inviti, ruoli)
- ✅ Saldo ferie per utente e tipo assenza

### Session 2 - Feb 2026
- ✅ **Analytics Dashboard Avanzate**:
  - 4 KPI Cards con gradienti colorati (verde, arancione, blu, viola)
  - Trend Assenze Mensili (grafico a barre)
  - Distribuzione per Tipo (progress bars con percentuali)
  - Utilizzo Ferie per Dipendente (cards con avatar e progress)
  - Tabella dettagliata saldi con percentuali utilizzo
- ✅ **Sistema Notifiche Push**:
  - Toast notifications (Sonner) in-app
  - Browser notifications (con richiesta permesso)
  - Notifiche per: approvazione/rifiuto ferie, deroghe chiusure
- ✅ **Fix Contrasti Colori**:
  - Dark mode: #F1F5F9 su #030712 (buon contrasto)
  - Migliorati colori testo per leggibilità
- ✅ **Fix Badge POPOLARE**:
  - Sfondo giallo (#F59E0B) con testo scuro
  - Posizionamento migliorato con padding
- ✅ **Toggle Light/Dark Mode** - Animato nell'header
- ✅ **Bacheca Annunci** - CRUD completo con priorità
- ✅ **Chiusure Aziendali** - Con 12 festività italiane 2026

### Pages
- Dashboard (stats, form, approvazioni)
- Calendario (vista mensile)
- Richieste Ferie (lista con filtri)
- Bacheca Annunci (comunicazioni aziendali)
- Chiusure Aziendali (festività, shutdown, deroghe)
- Team (gestione membri)
- **Statistiche** (Analytics Dashboard avanzate)
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
- GET/POST/PUT/DELETE /api/announcements

### Closures
- GET/POST/DELETE /api/closures
- POST /api/closures/{id}/exception
- GET /api/closures/exceptions
- PUT /api/closures/exceptions/{id}/review

### Team
- GET/POST/PUT/DELETE /api/team

## Test Results (Session 2)
- Backend: 95.5% (21/22 tests - 1 flaky non critico)
- Frontend: 100% (tutti e2e passati)
- File test: /app/test_reports/iteration_4.json

## Festività Italiane 2026 (Pre-caricate)
1. Capodanno (1 gennaio)
2. Epifania (6 gennaio)
3. Pasqua (5 aprile)
4. Lunedì dell'Angelo (6 aprile)
5. Festa della Liberazione (25 aprile)
6. Festa dei Lavoratori (1 maggio)
7. Festa della Repubblica (2 giugno)
8. Ferragosto (15 agosto)
9. Ognissanti (1 novembre)
10. Immacolata Concezione (8 dicembre)
11. Natale (25 dicembre)
12. Santo Stefano (26 dicembre)

## Next Tasks (P1)
- [ ] Integrazione Google Calendar
- [ ] Integrazione Outlook Calendar
- [ ] Notifiche email (SendGrid)
- [ ] Export CSV/PDF report

## Future Tasks (P2)
- [ ] App mobile PWA
- [ ] Multi-language support
- [ ] Webhook per integrazioni esterne
