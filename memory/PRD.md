# PowerLeave - Product Requirements Document

## Original Problem Statement
Sistema di gestione ferie per PMI italiane con design moderno, analytics avanzate, notifiche push.

## Architecture
- **Frontend**: React 18 + Tailwind CSS + Sonner (Toast)
- **Backend**: FastAPI + MongoDB
- **Auth**: JWT + Google OAuth
- **Theme**: Light/Dark mode con toggle animato

## Demo Users
| Email | Password | Ruolo |
|-------|----------|-------|
| admin@demo.it | demo123 | Admin |
| mario@demo.it | demo123 | User |
| anna@demo.it | demo123 | User |
| luigi@demo.it | demo123 | User |

## What's Been Implemented

### Session 3 - Feb 2026
- ✅ **Fix Contrasti Dark Mode**: Input/select ora leggibili
- ✅ **Sidebar Moderna**: Gradienti, bordi arrotondati, animazioni hover
- ✅ **Tabella Riepilogo Team**: Una riga per dipendente con colonne per tipo assenza (Ferie/Permessi/Malattia - Usati/Disponibili)
- ✅ **Layout responsive perfetto**: Desktop sidebar fissa, mobile hamburger drawer

### Session 2 - Feb 2026
- ✅ Analytics Dashboard avanzate
- ✅ Notifiche push (toast + browser)
- ✅ Badge POPOLARE fix

### Session 1 - Feb 2026
- ✅ Autenticazione JWT
- ✅ Dashboard, Calendario, Richieste
- ✅ Bacheca Annunci
- ✅ Chiusure Aziendali con deroghe
- ✅ Festività italiane 2026

## Test Results
- Backend: 95%+
- Frontend: 100% E2E

## Next Tasks (P1)
- [ ] Integrazione Google Calendar
- [ ] Integrazione Outlook Calendar
- [ ] Notifiche email

## Future Tasks (P2)
- [ ] Export CSV/PDF
- [ ] App mobile PWA
