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
- [x] Sezione messaggi recenti
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


## Funzionalità Mancanti dal Design Originale

### Sezione "Il mio saldo ferie"
- [x] Card con avatar e dettagli per ogni membro del team
- [x] Visualizzazione ore in F2A (Ferie e Assenze Autorizzate)
- [x] Visualizzazione ore usate
- [x] Visualizzazione ore disponibili
- [x] Grid responsive con 4 colonne su desktop

### Calendario Mensile Completo
- [x] Navigazione mese precedente/successivo
- [ ] Filtri per membro del team (UI pronta, logica da implementare)
- [ ] Filtri per stato (UI pronta, logica da implementare)
- [ ] Filtri per tipo di assenza (UI pronta, logica da implementare)
- [x] Legenda con colori (Approvate verde, In Sospeso arancione, Festività rosso)
- [ ] Visualizzazione giorni con ferie approvate (logica da collegare al database)
- [ ] Visualizzazione giorni con ferie in sospeso (logica da collegare al database)
- [ ] Visualizzazione festività (logica da implementare)
- [ ] Visualizzazione giorni di chiusura aziendale (logica da implementare)
- [x] Evidenziazione giorno corrente
- [ ] Avatar sovrapposti per più persone in ferie nello stesso giorno

### Sezione Integrazioni
- [ ] Sincronizzazione calendario Outlook
- [ ] Sincronizzazione Teams
- [ ] Caricamento file per importazione dati
- [ ] Download template per importazione

### Sezione Chiusura Aziendale
- [ ] Form per impostare periodi di chiusura aziendale
- [ ] Visualizzazione chiusure programmate

### Tabella Riepilogativa
- [x] Tabella con elenco dipendenti
- [x] Colonna tipo assenza
- [x] Colonna giorni utilizzati
- [x] Colonna saldo residuo
- [x] Filtro per tipo di assenza
