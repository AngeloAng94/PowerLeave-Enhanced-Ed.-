# PowerLeave - Product Requirements Document

## Original Problem Statement
Sistema di gestione ferie per PMI italiane con design moderno, configurabile dalle aziende.

## Architecture
- **Frontend**: React 18 + Tailwind CSS + Sonner
- **Backend**: FastAPI + MongoDB
- **Auth**: JWT + Google OAuth
- **Theme**: Light/Dark mode

## Demo Users
| Email | Password | Ruolo |
|-------|----------|-------|
| admin@demo.it | demo123 | Admin |
| mario@demo.it | demo123 | User |
| anna@demo.it | demo123 | User |
| luigi@demo.it | demo123 | User |

## What's Been Implemented

### Session 4 - Feb 2026 (Configurabilità)
- ✅ **Pagina Impostazioni Completa** con 4 tab:
  - **Organizzazione**: Nome azienda, Email HR
  - **Tipi Assenza**: CRUD completo, colori, giorni/anno
  - **Regole**: Preavviso minimo, max consecutivi, auto-approvazione
  - **Team**: Inviti email, gestione ruoli (Admin/Manager/Membro)
- ✅ **Fix Hover Sidebar**: Testo blu su hover (non bianco)
- ✅ **API Backend nuove**: /api/leave-types CRUD, /api/settings/rules

### Session 3 - Feb 2026
- ✅ Fix contrasti dark mode
- ✅ Sidebar moderna con gradienti
- ✅ Tabella riepilogo team compatta

### Session 2 - Feb 2026
- ✅ Analytics Dashboard avanzate
- ✅ Notifiche push (toast + browser)

### Session 1 - Feb 2026
- ✅ Autenticazione JWT
- ✅ Dashboard, Calendario, Richieste
- ✅ Bacheca Annunci, Chiusure Aziendali

## Impostazioni Configurabili (Solo Admin)

### 1. Organizzazione
- Nome azienda
- Email HR/Contatto

### 2. Tipi di Assenza
- Ferie (26gg, verde)
- Permesso (32gg, blu)
- Malattia (180gg, rosso)
- Maternità/Paternità (150gg, viola)
- + Tipi custom con colore e giorni personalizzabili

### 3. Regole Richieste
- Preavviso minimo (default: 7gg)
- Max giorni consecutivi (default: 15gg)
- Auto-approvazione sotto X giorni (default: 0 = disabilitato)

### 4. Team
- Invito membri via email
- Ruoli: Admin, Manager, Membro
- Rimozione membri

## Test Status
- Backend: 95%+ API funzionanti
- Frontend: 100% UI testata

## Next Tasks (P1)
- [ ] Integrazione Google Calendar
- [ ] Notifiche email
- [ ] Export report

## Future (P2)
- [ ] Multi-livello approvazioni
- [ ] App mobile PWA
