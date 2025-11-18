# 📥 Guida Importazione Dati da Excel

Questa guida spiega come importare i dati storici dal file Excel `PianoFerie2025.xlsx` nel database della dashboard.

---

## 📋 Prerequisiti

### 1. Installare Python e Dipendenze

```bash
# Verifica che Python 3 sia installato
python3 --version

# Installa le librerie necessarie
pip3 install openpyxl mysql-connector-python python-dotenv
```

### 2. Configurare la Connessione Database

1. Apri la dashboard Manus e vai alla sezione **Database** nel pannello di gestione
2. In basso a sinistra, clicca sull'icona ⚙️ per vedere le informazioni di connessione
3. Copia i dati di connessione (host, user, password, database name)
4. Crea il file `.env.import` nella cartella del progetto:

```bash
cd /path/to/dashboard-ferie-team
cp .env.import.example .env.import
nano .env.import  # o usa il tuo editor preferito
```

5. Compila il file `.env.import` con i dati copiati:

```env
DB_HOST=your-tidb-host.aws.tidbcloud.com
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=dashboard_ferie
```

---

## 🚀 Esecuzione Import

### Modalità DRY RUN (Test Senza Modifiche)

Prima di importare i dati reali, è consigliato fare un test in modalità "dry run" per verificare che tutto funzioni:

```bash
python3 import_excel_to_db.py /path/to/PianoFerie2025.xlsx --dry-run
```

Questo comando:
- ✅ Analizza il file Excel
- ✅ Mostra quanti dipendenti e richieste verranno importate
- ✅ Simula l'importazione
- ❌ **NON modifica** il database

### Importazione Reale

Una volta verificato che il dry run funzioni correttamente, procedi con l'importazione reale:

```bash
python3 import_excel_to_db.py /path/to/PianoFerie2025.xlsx
```

---

## 📊 Cosa Fa lo Script

Lo script esegue le seguenti operazioni:

### 1. Lettura Excel
- Apre il file `PianoFerie2025.xlsx`
- Legge il foglio "Piano Ferie"
- Identifica i dipendenti (colonna 2, righe 10+)
- Identifica le date (riga 9, colonne 3+)
- Cerca le celle con "X" che indicano ferie/permessi

### 2. Creazione Tipi di Assenza
Crea (se non esistono) i seguenti tipi:
- **FERIE/ROL 8 H** - Giornata intera (8 ore)
- **PERMESSO 2 ORE** - Permesso breve (2 ore)
- **PERMESSO 4 ORE** - Mezza giornata (4 ore)

### 3. Creazione Utenti
Per ogni dipendente trovato nell'Excel:
- Verifica se esiste già un utente con quel nome
- Se non esiste, crea un nuovo utente con:
  - Nome: dal file Excel
  - Email: `nome.cognome@example.com` (temporaneo)
  - OpenID: `excel_import_nome_cognome`
  - Ruolo: `user`

### 4. Importazione Richieste
- Raggruppa date consecutive per lo stesso dipendente e tipo
- Crea richieste di ferie con stato **"approved"** (già approvate)
- Ogni richiesta include:
  - Dipendente
  - Tipo di assenza
  - Data inizio e fine
  - Numero di giorni
  - Ore per giorno

### 5. Calcolo Saldi
Per ogni dipendente:
- Calcola i giorni totali utilizzati nell'anno corrente
- Assegna un saldo standard di 22 giorni/anno
- Calcola i giorni disponibili rimanenti
- Aggiorna la tabella `leave_balances`

---

## 📈 Output Esempio

```
================================================================================
IMPORTAZIONE PIANO FERIE DA EXCEL
================================================================================

📂 Apertura file: /path/to/PianoFerie2025.xlsx
✓ Foglio caricato: 39 righe × 1749 colonne
✓ Trovati 15 dipendenti
  - Riga 10: Lionte
  - Riga 11: Ferracuti
  - Riga 12: Scarpa
  ...
✓ Trovate 1500 date (da 2021-04-01 a 2025-12-31)
✓ Trovate 450 giornate di ferie/permessi

📥 Inizio importazione...

1️⃣  Gestione tipi di assenza...
  ✓ FERIE/ROL 8 H (ID: 1)
  ✓ PERMESSO 2 ORE (ID: 2)
  ✓ PERMESSO 4 ORE (ID: 3)

2️⃣  Gestione utenti...
  ✓ Lionte (ID: 1)
  ✓ Ferracuti (ID: 2)
  ...

3️⃣  Raggruppamento richieste consecutive...
  ✓ 450 giorni → 120 richieste

4️⃣  Inserimento richieste nel database...
  ... 50 richieste inserite
  ... 100 richieste inserite
  ✓ 120 richieste inserite con successo

5️⃣  Calcolo saldi ferie...
  ✓ Lionte: 18/22 giorni utilizzati
  ✓ Ferracuti: 12/22 giorni utilizzati
  ...

✅ Importazione completata con successo!

================================================================================
```

---

## ⚠️ Note Importanti

### Duplicati
Lo script **NON** controlla i duplicati. Se esegui lo script più volte sullo stesso file, creerà richieste duplicate. Per evitarlo:
1. Esegui lo script una sola volta
2. Oppure svuota le tabelle prima di re-importare:
   ```sql
   DELETE FROM leave_requests WHERE status = 'approved';
   DELETE FROM leave_balances;
   ```

### Tipi di Assenza
Attualmente lo script assume che tutte le "X" nell'Excel siano **FERIE/ROL 8 H**. Se nel vostro Excel usate codici diversi per distinguere i tipi (es. colori, simboli), lo script va adattato.

### Saldi Personalizzati
Lo script assegna un saldo standard di **22 giorni/anno** a tutti i dipendenti. Se alcuni dipendenti hanno saldi diversi (es. part-time, anzianità), dovrai modificare manualmente i valori nella tabella `leave_balances` dopo l'importazione.

### Anno di Riferimento
Lo script calcola i saldi solo per l'**anno corrente** (2025). I dati storici (2021-2024) vengono importati come richieste approvate ma non influenzano i saldi attuali.

---

## 🔧 Personalizzazioni

### Modificare il Saldo Standard

Modifica la riga 266 dello script:

```python
# Da:
total_days = 22

# A (esempio per 26 giorni):
total_days = 26
```

### Aggiungere Logica per Tipi Diversi

Se nel vostro Excel usate codici per distinguere i tipi, modifica la funzione `parse_excel()` intorno alla riga 150:

```python
# Esempio: usa il colore della cella per determinare il tipo
cell = ws.cell(emp_row, col_idx)
if cell.fill.start_color.rgb == 'FFFF0000':  # Rosso
    leave_type = "PERMESSO 2 ORE"
    hours = 2
elif cell.fill.start_color.rgb == 'FF00FF00':  # Verde
    leave_type = "PERMESSO 4 ORE"
    hours = 4
else:
    leave_type = "FERIE/ROL 8 H"
    hours = 8
```

---

## 🆘 Risoluzione Problemi

### Errore: "Database not available"
- Verifica che il file `.env.import` sia configurato correttamente
- Controlla che le credenziali database siano corrette
- Verifica la connessione di rete al database

### Errore: "File non trovato"
- Controlla il percorso del file Excel
- Usa il percorso assoluto: `/home/user/Downloads/PianoFerie2025.xlsx`

### Errore: "No module named 'openpyxl'"
- Installa le dipendenze: `pip3 install openpyxl mysql-connector-python python-dotenv`

### Dati non visualizzati nella dashboard
- Fai logout e login di nuovo
- Verifica che l'utente loggato corrisponda a uno dei nomi nell'Excel
- Controlla che le date siano nell'anno corrente

---

## ✅ Verifica Importazione

Dopo l'importazione, verifica che i dati siano corretti:

1. **Dashboard**: Controlla che le statistiche mostrino i numeri corretti
2. **Calendario**: Verifica che le ferie siano visualizzate
3. **Saldi**: Controlla che i saldi ferie siano calcolati correttamente
4. **Database**: Esegui query SQL per verificare:

```sql
-- Conta richieste importate
SELECT COUNT(*) FROM leave_requests WHERE status = 'approved';

-- Verifica saldi
SELECT u.name, lb.totalDays, lb.usedDays, lb.availableDays 
FROM leave_balances lb
JOIN users u ON lb.userId = u.id;

-- Richieste per dipendente
SELECT u.name, COUNT(*) as num_requests, SUM(lr.days) as total_days
FROM leave_requests lr
JOIN users u ON lr.userId = u.id
WHERE lr.status = 'approved'
GROUP BY u.name;
```

---

## 📞 Supporto

Per problemi o domande sull'importazione, contatta il team di sviluppo.
