# Power Leave

**Sistema di gestione ferie e permessi per team aziendali**

Power Leave è una piattaforma web moderna e intuitiva progettata per semplificare la gestione delle ferie e dei permessi aziendali. Nata dall'esigenza di superare i limiti dei tradizionali fogli Excel, Power Leave offre un'esperienza utente fluida, approvazioni rapide e visibilità completa sulla disponibilità del team.

## Caratteristiche Principali

- **Richieste Rapide**: Form intuitivo con granularità oraria (2H, 4H, 8H)
- **Approvazioni Veloci**: Approva o rifiuta con un click, notifiche immediate
- **Calendario Visivo**: Vista mensile con codice colore per ferie, permessi e chiusure aziendali
- **Gestione Saldi**: Calcolo automatico giorni residui e utilizzo percentuale
- **Report Esportabili**: Statistiche dettagliate e export CSV per analisi
- **Controllo Accessi**: Ruoli admin/user per separare responsabilità
- **Chiusure Aziendali**: Gestione automatica festività nazionali e chiusure collettive

## Tecnologie

- **Frontend**: React 19 + Tailwind CSS 4 + shadcn/ui
- **Backend**: Express 4 + tRPC 11
- **Database**: MySQL/TiDB (Drizzle ORM)
- **Auth**: Manus OAuth
- **Testing**: Vitest

## Installazione

```bash
# Installa dipendenze
pnpm install

# Configura database
pnpm db:push

# Avvia server di sviluppo
pnpm dev

# Esegui test
pnpm test
```

## Documentazione

Per documentazione completa (manuale utente, guida implementazione, business case), consulta `Power_Leave_Documentazione_Completa.md`.

## Autore

**Angelo Anglani**

## Licenza

MIT

---

**Powered by Manus AI**
