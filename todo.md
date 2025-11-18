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


## Adattamenti per Compatibilità Excel

### Supporto Granularità Oraria
- [x] Aggiungere campo `hours` alla tabella `leave_requests`
- [x] Modificare calcolo giorni per supportare frazioni (0.25 = 2H, 0.5 = 4H, 1 = 8H)
- [x] Aggiornare form richiesta per permettere selezione ore
- [ ] Aggiornare visualizzazione calendario per mostrare ore

### Script Importazione Dati
- [x] Creare script Python per importare dati da Excel
- [x] Mappare dipendenti Excel → utenti database
- [x] Importare richieste storiche (2021-2024) come "approved"
- [x] Calcolare saldi ferie iniziali per ogni dipendente
- [x] Validare dati importati vs Excel originale

### Vista Storica
- [ ] Aggiungere filtro anno nella dashboard
- [ ] Implementare vista storica multi-anno
- [ ] Aggiungere export Excel per backup

### Migrazione e Training
- [x] Testare migrazione su dati campione
- [x] Documentare processo per utenti finali
- [x] Creare guida utente


## Bug Risolti

### Calendario non mostra ferie approvate
- [x] Implementare query per ottenere ferie dal database per il mese corrente
- [x] Visualizzare giorni con ferie approvate (sfondo verde)
- [x] Visualizzare giorni con ferie in sospeso (sfondo arancione)
- [x] Mostrare pallini colorati per dipendenti nei giorni di ferie
- [x] Supportare più dipendenti nello stesso giorno (pallini multipli)
- [x] Mostrare ore (2H/4H/8H) nei giorni di ferie (tooltip)
- [x] Aggiornamento automatico calendario dopo approvazione


## Funzionalità Completate

### Rinomina Applicazione
- [x] Cambiare nome da "Dashboard Gestione Ferie" a "Power Leave"
- [x] Aggiornare titolo in tutte le pagine
- [ ] Aggiornare VITE_APP_TITLE tramite Management UI (da fare manualmente)

### Bug Calendario Risolti
- [x] Correzione confronto date per visualizzare richieste pending
- [x] Aggiunta visualizzazione richieste rifiutate (rejected) con colore rosso
- [x] Testato con dati reali per dicembre 2025
- [x] Migliorato algoritmo di filtraggio date (confronto stringhe YYYY-MM-DD)

### Filtri Calendario
- [x] Implementato filtro per Membri (dropdown con lista dipendenti dinamica)
- [x] Implementato filtro per Stati (Tutte, Approvate, In Sospeso, Rifiutate)
- [x] Implementato filtro per Tipi di assenza (dinamico da database)
- [x] Applicati filtri lato client ai dati monthLeaves
- [x] Calendario si aggiorna automaticamente quando cambiano i filtri
