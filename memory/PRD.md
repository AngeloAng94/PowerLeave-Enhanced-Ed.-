# PowerLeave - Product Requirements Document

## Original Problem Statement
Convertire il progetto PowerLeave (sistema gestione ferie) in una piattaforma SaaS moderna e vendibile per PMI italiane, con:
- Autenticazione JWT + Google OAuth
- Database MongoDB
- Design moderno con logo razzo blu e colori brand (#0F172A navy, #2563EB blue)
- Supporto multi-tenant
- Utenti demo per presentazioni

## Architecture
- **Frontend**: React 18 + CSS Custom (Inter font)
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB (multi-tenant con org_id)
- **Auth**: JWT tokens + Emergent Google OAuth

## User Personas
1. **Admin HR**: Gestisce richieste ferie, approva/rifiuta, invita membri
2. **Dipendente**: Richiede ferie, visualizza saldi, consulta calendario team

## Demo Users
| Email | Password | Ruolo | Nome |
|-------|----------|-------|------|
| admin@demo.it | demo123 | Admin | Marco Rossi |
| mario@demo.it | demo123 | User | Mario Bianchi |
| anna@demo.it | demo123 | User | Anna Verdi |
| luigi@demo.it | demo123 | User | Luigi Neri |

## What's Been Implemented (Feb 2026)

### Backend (server.py)
- ✅ Auth: register, login, logout, OAuth session
- ✅ Leave types CRUD
- ✅ Leave requests CRUD + approval workflow
- ✅ Statistics endpoint
- ✅ Calendar monthly view
- ✅ Team management (list, invite, remove)
- ✅ Leave balances (optimized queries)
- ✅ Company closures (Italian holidays 2026)
- ✅ Demo users auto-seeding

### Frontend (App.js)
- ✅ Landing page con logo razzo, pricing, demo banner
- ✅ Login/Register con colori brand blue
- ✅ Dashboard con stats cards
- ✅ Calendario interattivo
- ✅ Team management
- ✅ Settings
- ✅ Dark/Light theme

## Prioritized Backlog

### P0 (Done)
- ✅ Auth flow completo
- ✅ Leave request workflow
- ✅ Demo users

### P1 (Important)
- [ ] Notifiche email (SendGrid/Resend)
- [ ] Export report PDF/CSV
- [ ] Google Calendar sync

### P2 (Nice to have)
- [ ] Outlook Calendar sync
- [ ] Push notifications
- [ ] Analytics avanzate

## Notes
- Preview URL potrebbe essere in cold start - aprire dalla dashboard Emergent
- Tutti i test backend passano 100%
