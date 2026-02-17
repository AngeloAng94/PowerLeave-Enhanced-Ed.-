# PowerLeave - Product Requirements Document

## Original Problem Statement
Convertire il progetto PowerLeave (sistema gestione ferie) in una piattaforma SaaS moderna e vendibile per PMI italiane, con:
- Autenticazione JWT + Google OAuth
- Database MongoDB
- Design moderno e mobile responsive
- Supporto multi-tenant
- Integrazione calendario (Google + Outlook)

## Architecture
- **Frontend**: React 18 + CSS Custom Properties (no Tailwind build issues)
- **Backend**: FastAPI + Motor (async MongoDB driver)
- **Database**: MongoDB (multi-tenant con org_id)
- **Auth**: JWT tokens + Emergent Google OAuth

## User Personas
1. **Admin HR**: Gestisce richieste ferie del team, invita membri, configura azienda
2. **Dipendente**: Richiede ferie, visualizza saldi, consulta calendario team

## Core Requirements (Static)
- [x] Registrazione utente con creazione organizzazione
- [x] Login con JWT
- [x] Google OAuth (Emergent-managed)
- [x] Dashboard con statistiche
- [x] Creazione richieste ferie
- [x] Workflow approvazione/rifiuto
- [x] Calendario mensile con visualizzazione ferie
- [x] Gestione team (inviti, ruoli)
- [x] Saldi ferie per tipo
- [x] Festività italiane precaricate

## What's Been Implemented (Feb 2026)
### Backend (server.py)
- Auth endpoints: register, login, logout, session (OAuth)
- Leave types CRUD
- Leave requests CRUD + approval workflow
- Statistics endpoint
- Calendar monthly view
- Team management (list, invite, remove)
- Leave balances with optimized queries (no N+1)
- Company closures (holidays)

### Frontend (App.js)
- Landing page con pricing e features
- Login/Register forms + Google OAuth button
- Dashboard con stats cards
- Calendario interattivo
- Team management table
- Settings page
- Mobile responsive design
- Dark/Light theme toggle

## Prioritized Backlog

### P0 (Critical)
- ✅ Auth flow completo
- ✅ Leave request workflow
- ✅ Calendar view

### P1 (Important)
- [ ] Notifiche email (SendGrid/Resend)
- [ ] Export report PDF/CSV
- [ ] Google Calendar sync

### P2 (Nice to have)
- [ ] Outlook Calendar sync
- [ ] Push notifications
- [ ] Advanced analytics
- [ ] Bulk operations

## Next Tasks
1. Aggiungere notifiche email per approvazioni/rifiuti
2. Implementare export CSV delle richieste
3. Aggiungere validazione email per inviti team
4. Dashboard analytics avanzate

## Test Credentials
- Email: test2@test.it
- Password: test123
- Role: Admin
