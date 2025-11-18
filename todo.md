# Dashboard Gestione Ferie - TODO

## Funzionalità da Implementare

### Database e Schema
- [x] Tabella richieste ferie (leave_requests)
- [x] Tabella giorni ferie disponibili per utente (leave_balances)
- [x] Tabella tipi di assenza (leave_types)
- [x] Tabella messaggi/notifiche (messages)
- [x] Tabella annunci bacheca (announcements)

### Backend API (tRPC)
- [x] Procedura per creare richiesta ferie
- [x] Procedura per approvare/rifiutare richieste
- [x] Procedura per ottenere lista richieste (filtrate per utente/team)
- [x] Procedura per ottenere statistiche dashboard
- [ ] Procedura per ottenere calendario mensile
- [x] Procedura per gestire messaggi
- [x] Procedura per gestire annunci

### Frontend UI
- [x] Layout principale con sidebar navigazione
- [x] Dashboard con statistiche (ferie approvate, richieste in sospeso, staff disponibile, utilizzo ferie)
- [x] Form richiesta ferie con validazione
- [x] Sezione approvazione richieste per team leader/admin
- [ ] Calendario mensile interattivo con visualizzazione ferie
- [ ] Tabella riepilogativa giorni utilizzati per dipendente
- [x] Sezione bacheca annunci
- [ ] Sezione messaggi recenti
- [x] Gestione tema dark mode
- [ ] Responsive design per mobile

### Funzionalità Avanzate
- [ ] Notifiche in tempo reale per nuove richieste
- [ ] Validazione sovrapposizione ferie (max 2 persone contemporaneamente)
- [ ] Export report in PDF/Excel
- [ ] Filtri e ricerca avanzata
- [ ] Gestione politiche ferie personalizzate

### Testing
- [x] Test unitari per procedure tRPC
- [x] Test validazione form
- [x] Test logica approvazione richieste
