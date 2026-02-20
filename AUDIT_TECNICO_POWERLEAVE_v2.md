# AUDIT TECNICO - PowerLeave v2.0
## Fotografia dello Stato Attuale del Codice

**Data**: 18 Febbraio 2026  
**Basato su**: Lettura completa di `backend/server.py`, `frontend/src/App.js`, `index.css`, `tests/`, `.github/workflows/ci.yml`, schema MongoDB live, `requirements.txt`, `package.json`

---

## INDICE

1. [Panoramica Architettura Attuale](#1-panoramica-architettura-attuale)
2. [Struttura del Codice](#2-struttura-del-codice)
3. [Database & Modello Dati](#3-database--modello-dati)
4. [Sicurezza](#4-sicurezza)
5. [Performance & Scalabilità](#5-performance--scalabilità)
6. [Testing & Qualità](#6-testing--qualità)
7. [Debito Tecnico Attuale](#7-debito-tecnico-attuale)
8. [Roadmap Suggerita (3 Step)](#8-roadmap-suggerita-3-step)
9. [Appendice A — Fix Applicati (18 Feb)](#appendice--fix-applicati-18-feb-2026-post-audit)
10. [Appendice B — Refactoring Strutturale (19 Feb)](#appendice-b--refactoring-strutturale-19-feb-2026)
11. [Appendice C — Fix UI/UX (20 Feb)](#appendice-c--fix-uiux-20-feb-2026)
12. [Appendice D — Fix Validazione Date (20 Feb)](#appendice-d--fix-critico-validazione-date-20-feb-2026)
13. [Riepilogo Stato Progetto](#riepilogo-stato-progetto)

---

## 1. PANORAMICA ARCHITETTURA ATTUALE

### 1.1 Schema a Blocchi

```
┌──────────────────────────────────────────────────────────────┐
│                      BROWSER (Client)                        │
│  React 18 SPA — un singolo file: App.js (3 533 righe)        │
│  CSS custom: index.css (540 righe, variabili CSS per tema)   │
│  Toast: sonner 1.4.0                                         │
│  Routing: window.location.hash (no react-router)             │
│  Porta: 3000 (dev-server react-scripts)                      │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTPS fetch → /api/*
                       │ Auth: Bearer JWT + HttpOnly cookie
┌──────────────────────▼───────────────────────────────────────┐
│                    BACKEND (FastAPI)                          │
│  Un singolo file: server.py (1 489 righe)                    │
│  Async via Motor 3.6 (MongoDB driver)                        │
│  Auth: python-jose (JWT HS256, 7 giorni)                     │
│  Rate limit: slowapi 0.1.9 su login/register (10/min/IP)    │
│  Porta: 8001 (uvicorn, singolo worker)                       │
└──────────────────────┬───────────────────────────────────────┘
                       │ mongodb://localhost:27017
┌──────────────────────▼───────────────────────────────────────┐
│                   MongoDB (powerleave)                        │
│  8 collections attive, 5 indici custom                       │
│  ~63 documenti totali (dati demo)                            │
│  Multi-tenancy: campo org_id su ogni documento               │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Linguaggi, Framework e Versioni

| Layer        | Tecnologia             | Versione   | File di riferimento      |
|--------------|------------------------|------------|--------------------------|
| Frontend     | React                  | 18.2.0     | `frontend/package.json`  |
| Build tool   | react-scripts          | 5.0.1      | `frontend/package.json`  |
| Styling      | CSS puro + variabili   | —          | `frontend/src/index.css` |
| Toast        | Sonner                 | 1.4.0      | `frontend/package.json`  |
| Backend      | FastAPI                | 0.115.6    | `backend/requirements.txt` |
| ASGI Server  | Uvicorn                | 0.34.0     | `backend/requirements.txt` |
| DB Driver    | Motor (async)          | 3.6.0      | `backend/requirements.txt` |
| Auth/JWT     | python-jose + HS256    | 3.3.0      | `backend/requirements.txt` |
| Password     | passlib + bcrypt       | 1.7.4      | `backend/requirements.txt` |
| Rate Limit   | slowapi                | 0.1.9      | `backend/requirements.txt` |
| HTTP Client  | httpx (per OAuth)      | 0.28.1     | `backend/requirements.txt` |
| Validation   | Pydantic               | 2.10.6     | `backend/requirements.txt` |
| Test         | pytest                 | 9.0.2      | `backend/requirements.txt` |
| CI           | GitHub Actions         | —          | `.github/workflows/ci.yml` |

**Nota su Tailwind**: `tailwindcss 3.4.0` è presente in `package.json` ma non esiste un file `tailwind.config.js`. Lo styling è interamente gestito tramite CSS manuale in `index.css`. Le classi usate nell'HTML (es. `flex`, `p-4`, `rounded`) sono ridefinite manualmente nel CSS, non generate da Tailwind.

---

## 2. STRUTTURA DEL CODICE

### 2.1 Directory Tree (Struttura Attuale Post-Refactoring)

```
/app/
├── .github/
│   └── workflows/
│       └── ci.yml                       # CI: pytest backend + yarn build frontend
├── backend/
│   ├── .env                             # MONGO_URL, DB_NAME, SECRET_KEY
│   ├── requirements.txt                 # Dipendenze Python
│   ├── server.py                        # Entry point (~50 righe)
│   ├── config.py                        # Configurazione env vars
│   ├── models.py                        # Modelli Pydantic
│   ├── auth.py                          # Helpers autenticazione
│   ├── database.py                      # Connessione DB + lifespan
│   ├── seed.py                          # Seed data demo
│   ├── routes/                          # Router FastAPI per dominio
│   │   ├── auth.py
│   │   ├── leave.py
│   │   ├── team.py
│   │   ├── organization.py
│   │   ├── announcements.py
│   │   ├── closures.py
│   │   └── stats.py
│   └── tests/
│       └── test_powerleave_api.py       # 30 test, stabile
├── frontend/
│   ├── .env                             # REACT_APP_BACKEND_URL
│   ├── package.json
│   ├── yarn.lock
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js                     # Entry point
│       ├── index.css                    # Variabili tema + utility CSS
│       ├── App.js                       # Router + providers (~60 righe)
│       ├── lib/
│       │   └── api.js                   # Client API axios
│       ├── context/
│       │   ├── AuthContext.js
│       │   └── NotificationContext.js
│       ├── components/
│       │   ├── Icons.js                 # Logo + icone SVG
│       │   ├── ThemeToggle.js           # Switch dark/light
│       │   └── ui/                      # Shadcn components
│       └── pages/                       # Pagine React (13 file)
│           ├── LandingPage.js
│           ├── LoginPage.js
│           ├── RegisterPage.js
│           ├── AuthCallback.js
│           ├── Dashboard.js
│           ├── DashboardContent.js
│           ├── CalendarPage.js
│           ├── StatsPage.js
│           ├── RequestsPage.js
│           ├── TeamPage.js
│           ├── SettingsPage.js
│           ├── AnnouncementsPage.js
│           └── ClosuresPage.js
├── memory/
│   └── PRD.md
├── test_reports/
│   └── iteration_*.json
├── AUDIT_TECNICO_POWERLEAVE.md          # Audit v1
└── AUDIT_TECNICO_POWERLEAVE_v2.md       # Questo documento
```

### 2.2 Struttura Modulare Backend

Il backend è ora organizzato per responsabilità:

| File | Righe | Responsabilità |
|------|-------|----------------|
| `server.py` | ~50 | App init, include routers, health check |
| `config.py` | ~30 | Env vars, costanti, rate limiter |
| `models.py` | ~100 | Modelli Pydantic (User, LeaveRequest, etc.) |
| `auth.py` | ~80 | Token JWT, password hash, get_current_user |
| `database.py` | ~60 | Motor client, lifespan, indici |
| `seed.py` | ~150 | Seed leave types, festività, demo users |
| `routes/*.py` | ~800 tot | Endpoint REST divisi per dominio |

### 2.3 Struttura Modulare Frontend

Il frontend è organizzato con separazione netta:

| Directory | Contenuto |
|-----------|-----------|
| `lib/` | Utility (api.js) |
| `context/` | React Context providers |
| `components/` | Componenti riutilizzabili |
| `pages/` | Componenti pagina (route-level) |

**Code Splitting**: 5 pagine caricate con `React.lazy()`:
- StatsPage, CalendarPage, SettingsPage, AnnouncementsPage, ClosuresPage

---

## 3. DATABASE & MODELLO DATI

### 3.1 Elenco Collections

| Collection            | Documenti | Indici Custom                    | Descrizione                     |
|-----------------------|-----------|----------------------------------|---------------------------------|
| `users`               | 5         | `email_1` (unique), `user_id_1` (unique) | Utenti del sistema              |
| `organizations`       | 1         | `org_id_1` (unique)              | Tenant (organizzazioni)         |
| `leave_types`         | 4         | nessuno                          | Tipi di assenza                 |
| `leave_requests`      | 16        | `org_id_1_user_id_1`, `org_id_1_start_date_1` | Richieste ferie                 |
| `leave_balances`      | 20        | nessuno                          | Saldi ferie per utente/tipo/anno|
| `company_closures`    | 14        | nessuno                          | Festività + chiusure aziendali  |
| `announcements`       | 2         | nessuno                          | Bacheca annunci                 |
| `closure_exceptions`  | 6         | nessuno                          | Richieste deroga chiusure       |
| `user_sessions`       | 0*        | nessuno                          | Sessioni OAuth (*vuota con JWT) |
| `org_settings`        | 0*        | nessuno                          | Regole org (*creata on-demand)  |

**Totale: 8 collections attive, 5 indici custom, ~63 documenti.**

### 3.2 Schema Dettagliato (dai documenti live)

#### `users`
```
user_id       : str       "user_admin"               PK (unique index)
email         : str       "admin@demo.it"            UNIQUE index
name          : str       "Marco Rossi"
password_hash : str       "$2b$12$..."               bcrypt
role          : str       "admin" | "user"
org_id        : str       "org_demo"                 FK logica → organizations
picture       : NoneType  null                       URL immagine (per OAuth)
created_at    : datetime  2026-02-17T09:52:32
invited_by    : str       "user_admin"               Solo per utenti invitati
```

#### `organizations`
```
org_id        : str       "org_demo"                 PK (unique index)
name          : str       "PowerLeave Demo"
created_at    : datetime  2026-02-17T09:52:32
owner_id      : str       "user_admin"               FK logica → users
```

#### `leave_types`
```
id            : str       "ferie"                    PK logico (no unique index)
name          : str       "Ferie"
color         : str       "#22C55E"
days_per_year : int       26
org_id        : NoneType  null                       null = globale, str = custom per org
```

Tipi predefiniti (seed): `ferie` (26gg), `permesso` (32gg), `malattia` (180gg), `maternita` (150gg).

#### `leave_requests`
```
id              : str       UUID                     PK logico
user_id         : str       "user_mario"             FK logica → users
user_name       : str       "Mario Bianchi"          ⚠ DENORMALIZZATO
org_id          : str       "org_demo"               FK logica → organizations
leave_type_id   : str       "ferie"                  FK logica → leave_types
leave_type_name : str       "Ferie"                  ⚠ DENORMALIZZATO
start_date      : str       "2026-03-15"             ⚠ Stringa, non Date
end_date        : str       "2026-03-20"             ⚠ Stringa, non Date
days            : int       6                        Calcolato: end - start + 1
hours           : int       8                        2 | 4 | 8
notes           : str       "Vacanze di primavera"
status          : str       "approved"               "pending" | "approved" | "rejected"
reviewed_by     : str       "user_admin"             Opzionale
reviewed_at     : datetime  2026-02-17T...           Opzionale
created_at      : datetime  2026-02-12T...
closure_id      : str       UUID                     Solo per auto-leave da chiusura
is_closure_leave: bool      true                     Solo per auto-leave da chiusura
```

#### `leave_balances`
```
user_id       : str       "user_admin"
org_id        : str       "org_demo"
leave_type_id : str       "ferie"
year          : int       2026
total_days    : int       26
used_days     : float     2.0                        Float per mezze giornate
```

#### `company_closures`
```
# Festività nazionali (seed):
id            : str       UUID
org_id        : NoneType  null                       null = nazionale
date          : str       "2026-01-01"               ⚠ Campo "date" singolo
reason        : str       "Capodanno"
type          : str       "holiday"

# Chiusure custom (create da admin):
id            : str       UUID
org_id        : str       "org_demo"
start_date    : str       "2029-11-15"               ⚠ Campo "start_date" (diverso!)
end_date      : str       "2029-11-16"
reason        : str       "Chiusura natalizia"
type          : str       "shutdown"
auto_leave    : bool      true
allow_exceptions: bool    true
created_at    : datetime  ...
created_by    : str       "user_admin"
```

#### `announcements`
```
id            : str       UUID
org_id        : str       "org_demo"
title         : str       "Annuncio Test"
content       : str       "Contenuto..."
priority      : str       "normal"                   "low" | "normal" | "high"
author_id     : str       "user_admin"
author_name   : str       "Marco Rossi"              ⚠ DENORMALIZZATO
created_at    : datetime  ...
expires_at    : NoneType  null                        Opzionale
```

#### `closure_exceptions`
```
id            : str       UUID
closure_id    : str       UUID                       FK logica → company_closures
user_id       : str       "user_mario"
user_name     : str       "Mario Bianchi"            ⚠ DENORMALIZZATO
org_id        : str       "org_demo"
reason        : str       "Ho un progetto urgente"
status        : str       "pending"                  "pending" | "approved" | "rejected"
created_at    : datetime  ...
reviewed_by   : str       (dopo review)
reviewed_at   : datetime  (dopo review)
```

### 3.3 Note su Multi-tenancy, Denormalizzazioni e Problemi Futuri

**Multi-tenancy**:
- Tutti i documenti hanno `org_id` per l'isolamento dati.
- La query filtra **sempre** per `org_id` dell'utente autenticato.
- **Problema**: Le collection `announcements`, `closure_exceptions`, `leave_balances`, `leave_types` non hanno indice su `org_id`. Con la crescita dei dati, le query diventeranno full-scan.

**Denormalizzazioni**:
- `user_name` è duplicato in `leave_requests`, `announcements`, `closure_exceptions`. Se un utente cambia nome, i documenti esistenti mantengono il vecchio nome.
- `leave_type_name` è duplicato in `leave_requests`. Stessa problematica.

**Incoerenza schema `company_closures`**:
- Le festività (seed) usano il campo `date` (singola data).
- Le chiusure custom usano `start_date` + `end_date` (range).
- Nello stesso collection convivono documenti con schema diverso. Il backend (riga 1309) gestisce entrambi i casi con un fallback (`closure_data.get("start_date") or closure_data.get("date")`), ma l'endpoint GET `/api/closures` (riga 1291) filtra solo per `date` tramite regex, potenzialmente **non trovando** chiusure custom che usano `start_date`.
- **Impatto**: Le chiusure custom non compaiono nella query filtrata per anno.

**Date come stringhe**:
- `start_date`, `end_date`, `date` sono stringhe `YYYY-MM-DD`. Funziona per confronti lessicografici ($lte, $gte), ma:
  - Non si può fare $gte/$lte nativo su oggetti Date.
  - Nessuna validazione a livello DB sul formato.

---

## 4. SICUREZZA

### 4.1 Meccanismi di Autenticazione Implementati

| Meccanismo       | Dove                                  | Dettaglio                                                   |
|------------------|---------------------------------------|-------------------------------------------------------------|
| JWT (HS256)      | `server.py` L181–185                  | Token con 7 giorni di scadenza, claim `sub` = `user_id`     |
| Cookie HttpOnly  | `server.py` L465–472, L496–503       | `session_token`, Secure=True, SameSite=None, 7gg max_age    |
| Bearer Header    | `server.py` L203                      | `Authorization: Bearer <jwt>`                                |
| bcrypt           | `server.py` L50                       | `passlib.CryptContext(schemes=["bcrypt"])`                   |
| Session lookup   | `server.py` L216–228                  | Fallback: se JWT decode fallisce, cerca in `user_sessions`   |
| Rate limiting    | `server.py` L414, L485               | `slowapi 0.1.9`, 10 req/min per IP su login e register      |
| Google OAuth     | `server.py` L516–620                  | Emergent Auth redirect flow (predisposto, non attivato)      |

**Flusso di autenticazione** (`get_current_user`, riga 193–234):
1. Legge `session_token` dal cookie.
2. Se assente, legge `Authorization: Bearer` dall'header.
3. Se nessun token → HTTP 401.
4. Prova `jwt.decode(token, SECRET_KEY)` → estrae `user_id`.
5. Se JWTError → cerca in `user_sessions` (per OAuth) → verifica scadenza.
6. Lookup utente in `users` collection → ritorna documento utente.

### 4.2 Classificazione Vulnerabilità

| ID  | Severità | Priorità | Descrizione | Stato | Dettaglio tecnico |
|-----|----------|----------|-------------|-------|-------------------|
| S01 | **MEDIA** | P1 | CORS: `allow_methods=["*"]`, `allow_headers=["*"]` | **Risolto — Fix 6** | `server.py` L95–96. Ristretto a GET/POST/PUT/DELETE/OPTIONS e Content-Type/Authorization. |
| S02 | **MEDIA** | P1 | Token JWT in localStorage | Aperto | `App.js` L166. Il token è leggibile da JavaScript. Un attacco XSS può esfiltrare il token. Il cookie HttpOnly è un backup, ma il token è comunque esposto. |
| S03 | **MEDIA** | P1 | Nessuna validazione forza password | **Risolto — Fix 4** | Validazione server-side: min 8 char + almeno 1 numero su register e invite. HTTP 422 con messaggio chiaro. |
| S04 | **MEDIA** | P1 | Password temporanea non consegnabile all'utente | Aperto | `server.py` L1065–1066. La temp password è loggata server-side ma non c'è modo per l'admin di comunicarla all'utente invitato (no email, no UI). L'utente invitato non può accedere. |
| S05 | **BASSA** | P2 | SameSite=None senza necessità | Aperto | `server.py` L470. `SameSite=None` è necessario solo per cookie cross-origin. Se frontend e backend sono sullo stesso dominio, `Lax` sarebbe più sicuro. |
| S06 | **BASSA** | P2 | Nessun CSRF token | Aperto | Mitigato parzialmente dal cookie SameSite, ma con SameSite=None il rischio rimane. |
| S07 | **BASSA** | P2 | Nessun Content Security Policy header | Aperto | Nessun CSP configurato. Un XSS potrebbe caricare script esterni. |
| S08 | **BASSA** | P2 | Nessun token refresh/rotation | Aperto | Il JWT dura 7 giorni senza possibilità di revoca. Se compromesso, resta valido fino alla scadenza. |
| S09 | **INFO** | P3 | CORS origini hardcoded | Aperto | `server.py` L91–92. Due origini specifiche. In produzione, dovrebbero venire da env var. |

**Fix recenti (già applicati in questa sessione)**:
- ~~SECRET_KEY hardcoded~~: **Risolto**. `server.py` L30–39: `sys.exit()` se manca in .env.
- ~~Password temp esposta in API~~: **Risolto**. `server.py` L1065–1072: rimossa dalla response, solo log server.
- ~~Nessun rate limiting~~: **Risolto**. `server.py` L414, L485: slowapi 10/min su login e register.

---

## 5. PERFORMANCE & SCALABILITÀ

### 5.1 Punti di Forza

| Aspetto                | Dettaglio                                                    |
|------------------------|--------------------------------------------------------------|
| Backend async          | FastAPI + Motor (async MongoDB driver). Le query DB non bloccano l'event loop. |
| Indici su query calde  | `leave_requests` ha indici compound su `(org_id, user_id)` e `(org_id, start_date)`, le due query più frequenti. |
| Anti N+1 su balances   | `server.py` L1141–1155: lookup batch di utenti e tipi, non query per-balance. |
| Lightweight frontend   | 7 dipendenze dirette. Bundle relativamente piccolo.          |

### 5.2 Colli di Bottiglia

| Area     | Problema | Dove | Impatto |
|----------|----------|------|---------|
| **BE**   | Singolo worker uvicorn | `server.py` L1488 | Tutte le richieste serializzate su un solo processo. Max ~50 utenti concorrenti prima di saturazione. |
| **BE**   | Nessuna paginazione | Tutti i GET lista | **Risolto — Fix 3**: parametri `page`/`page_size` su leave-requests, leave-balances, announcements. |
| **BE**   | Nessun caching | Nessun layer cache | Stats, leave types, e organization cambiano raramente ma vengono ricalcolati ad ogni richiesta. |
| **BE**   | 4× `datetime.now()` senza timezone | `server.py` | **Risolto — Fix 5**: Tutte sostituite con `datetime.now(timezone.utc)`. |
| **FE**   | Bundle monolite | `App.js` 148 KB source (stima ~300 KB bundle) | Nessun code splitting. Tutte le 19 pagine caricate al primo render, anche se l'utente ne visita 2. |
| **FE**   | Grafici in div/CSS | `StatsPage` L1805–2190 | Barre e torte disegnate con `div` e `style={{height: ...}}`. Non interattivi, non accessibili, non responsive. |
| **DB**   | Indici mancanti | `leave_types`, `leave_balances`, `announcements`, `closure_exceptions` | **Risolto — Fix 2**: Indici su `org_id` aggiunti per tutte e 4 le collection. |
| **DB**   | Schema incoerente closures | `company_closures` | **Risolto — Fix 1**: Schema unificato a `start_date`/`end_date`. Dati migrati. |
| **DB**   | Date come stringhe | `leave_requests.start_date`, `.end_date` | Funzionale per confronti lessicografici, ma non ottimale per range query native MongoDB. |

### 5.3 Raccomandazioni Sintetiche (cosa migliorare prima)

1. **Aggiungere indici su `org_id`** per `leave_types`, `leave_balances`, `announcements`, `closure_exceptions`. Costo zero, beneficio immediato.
2. **Paginazione** almeno sugli endpoint più pesanti: `leave_requests`, `leave_balances`, `announcements`.
3. **Unificare schema `company_closures`**: migrare le festività a usare `start_date`/`end_date` come le chiusure custom.
4. **Code splitting frontend** con `React.lazy()` per le pagine dietro dashboard.

---

## 6. TESTING & QUALITÀ

### 6.1 Test Automatici Esistenti

**File**: `backend/tests/test_powerleave_api.py` — 355 righe, 23 test, 8 classi.

| Classe              | Test | Cosa copre                                      |
|---------------------|------|-------------------------------------------------|
| TestHealthCheck     | 1    | Health endpoint 200 + body                      |
| TestAuthentication  | 5    | Login admin, login user, login invalid, me senza token, session persistence (3× GET /me) |
| TestLeaveTypes      | 1    | GET leave-types con verifica Ferie/Permesso     |
| TestLeaveRequests   | 3    | GET lista, POST create (con cleanup), POST+review (create→approve→verify) |
| TestAnnouncements   | 3    | GET lista, CRUD completo (create→read→update→delete→verify), user non può creare |
| TestClosures        | 3    | GET con festività, CRUD+exception (create→exception→cleanup), user non può creare |
| TestTeam            | 2    | GET lista (≥4 membri), POST invite (verifica no `temp_password` nella response + cleanup) |
| TestStatsAndData    | 5    | Stats (5 chiavi), calendar monthly, leave balances, organization, settings rules |

**Strategia anti-flakiness**:
- Ogni run genera un `RUN_ID = uuid4().hex[:8]` unico (riga 15).
- Le leave request usano date **far-future** (2029) calcolate da `RUN_ID` per evitare overlap.
- Le note dei test iniziano con `TEST_RUN_` per identificazione.
- Fixture `cleanup_test_data` (session-scoped, autouse) pulisce le leave request di test prima e dopo la suite.
- Ogni test che crea dati li elimina nel proprio corpo.

**Risultato**: 23/23 passed, verificato su **3 run consecutivi** senza failure.

### 6.2 Cosa NON è Coperto dai Test

| Area                              | Dettaglio                                               |
|-----------------------------------|---------------------------------------------------------|
| OAuth flow                        | `/api/auth/session` non testato (richiede Emergent Auth)|
| Registrazione                     | `POST /api/auth/register` non testato                   |
| Leave types CRUD                  | Solo GET testato, non POST/PUT/DELETE                    |
| Settings rules update             | Solo GET testato, non PUT                                |
| Organization update               | Solo GET testato, non PUT                                |
| Team update/remove                | Solo invite e list testati, non PUT/DELETE               |
| Chiusure con auto_leave=true      | Auto-creazione leave request per ogni dipendente         |
| Exception review (approve/reject) | Review delle deroghe chiusura                            |
| Edge cases date                   | Overlap esatto, range cross-year, date passate           |
| Validazione input malformato      | Date invalide, email malformate, campi mancanti          |
| Autorizzazione granulare          | User che tenta PUT/DELETE su risorse altrui              |
| Rate limiting                     | Verifica che oltre 10 req/min venga bloccato             |
| Frontend                          | Nessun test frontend (no Jest, no Cypress, no Playwright)|

### 6.3 CI/CD

**File**: `.github/workflows/ci.yml` — 70 righe, 2 job.

| Job       | Steps                                                         |
|-----------|---------------------------------------------------------------|
| `backend` | Python 3.11 + MongoDB 6.0 (service) + pip install + uvicorn start + pytest |
| `frontend`| Node 18 + yarn install --frozen-lockfile + yarn build         |

**Nota**: Il CI non è ancora stato eseguito su GitHub (la repo non è pushata). Il workflow è stato validato localmente (YAML syntax ok, pytest 23/23, yarn build ok).

### 6.4 Qualità del Codice

| Aspetto             | Backend (`server.py`)                        | Frontend (`App.js`)                          |
|---------------------|----------------------------------------------|----------------------------------------------|
| Duplicazioni        | Logica seed balance duplicata in register, invite, OAuth (3 copie) | Form richiesta duplicato (Dashboard modale + DashboardContent inline) |
| Complessità         | 1 file, ~35 endpoint, nessuna separazione    | 1 file, 19 componenti, nessuna separazione   |
| Logging             | `logger` definito (L47) ma usato solo 1 volta (L1066) | `console.log` sparsi                        |
| Error handling BE   | `HTTPException` su ogni endpoint, coerente   | 36 try/catch, ma nessun Error Boundary       |
| Type safety         | 12 endpoint accettano `dict` generico        | JavaScript puro, nessun TypeScript           |
| Commenti/Docstring  | Sezioni con `# ======`, docstring su ~50% endpoint | Sezioni con `// ======`, nessun commento   |

---

## 7. DEBITO TECNICO ATTUALE

| ID  | Area      | Problema                                             | Impatto                                      | Sforzo |
|-----|-----------|------------------------------------------------------|----------------------------------------------|--------|
| D01 | Backend   | `server.py` monolite (1 489 righe)                   | Manutenibilità, onboarding, testing unitario | Alto   |
| D02 | Frontend  | `App.js` monolite (3 533 righe)                      | Bundle size, manutenibilità, code splitting  | Alto   |
| D03 | Frontend  | CSS manuale (540 righe) duplica Tailwind             | Tailwind installato ma non usato; doppio stile | Medio  |
| D04 | Backend   | 12 endpoint con `dict` invece di Pydantic models     | Nessuna validazione input, docs OpenAPI incomplete | Medio |
| D05 | DB        | Schema incoerente `company_closures` (`date` vs `start_date`) | **Risolto — Fix 1** | — |
| D06 | DB        | Indici mancanti su 4 collection                      | **Risolto — Fix 2** | — |
| D07 | Backend   | 4× `datetime.now()` senza timezone                   | **Risolto — Fix 5** | — |
| D08 | Backend   | Logica seed balance duplicata 3 volte                | Rischio drift tra register, invite, OAuth    | Basso  |
| D09 | Frontend  | Nessun react-router-dom                              | URL non navigabili, no deep-link, no history | Medio  |
| D10 | Frontend  | 14 icone SVG inline                                  | ~115 righe di codice evitabili con lucide-react | Basso |
| D11 | Security  | Password temporanea non comunicabile                 | Utenti invitati non possono accedere         | Medio  |
| D12 | Frontend  | Grafici CSS-only in StatsPage                        | Non interattivi, non accessibili, non animati | Basso |
| D13 | Backend   | Denormalizzazione senza sync (user_name, leave_type_name) | Dati stale se nome cambia | Basso  |
| D14 | Testing   | Nessun test frontend                                 | Regressioni UI non rilevate automaticamente  | Medio  |

---

## 8. ROADMAP SUGGERITA (3 STEP)

### Step 1 — Refactoring Strutturale Minimo

**Obiettivo**: Rendere il codice manutenibile e pronto per contributi multipli.

**Backend** (`server.py` → moduli):
```
backend/
├── server.py          → ridotto a: app init + include_router
├── config.py          → env vars, costanti
├── models.py          → tutti i modelli Pydantic (con response models)
├── auth.py            → helpers + decorators (get_current_user, get_admin_user)
├── seed.py            → seed_default_data, seed_demo_users
└── routes/
    ├── auth.py        → register, login, session, me, logout
    ├── leave.py       → leave-requests, leave-types, leave-balances
    ├── team.py        → team CRUD + invite
    ├── organization.py→ org, settings, rules
    ├── announcements.py → announcements CRUD
    └── closures.py    → closures + exceptions
```

**Frontend** (`App.js` → componenti):
```
frontend/src/
├── App.js             → ridotto a: providers + router
├── api.js             → client API
├── context/
│   ├── AuthContext.js
│   └── NotificationContext.js
├── pages/
│   ├── LandingPage.js
│   ├── LoginPage.js
│   ├── RegisterPage.js
│   ├── Dashboard.js
│   ├── DashboardContent.js
│   ├── CalendarPage.js
│   ├── StatsPage.js
│   ├── RequestsPage.js
│   ├── TeamPage.js
│   ├── SettingsPage.js
│   ├── AnnouncementsPage.js
│   └── ClosuresPage.js
├── components/
│   ├── ThemeToggle.js
│   ├── MiniCalendar.js
│   ├── Icons.js
│   └── ui/           (Shadcn, già presente)
└── index.css          (invariato)
```

**Stima**: 2–3 sessioni di lavoro. Nessuna nuova feature, solo spostamento codice.

### Step 2 — Hardening Sicurezza e Performance

| Azione                                        | Priorità | Sforzo |
|-----------------------------------------------|----------|--------|
| Tipizzare i 12 endpoint `dict` → Pydantic     | P1       | Medio  |
| Aggiungere indici MongoDB mancanti            | P1       | Basso  |
| Unificare schema `company_closures`           | P1       | Medio  |
| Validazione password server-side              | P1       | Basso  |
| Paginazione sulle API lista                   | P1       | Medio  |
| Restringere CORS methods/headers              | P1       | Basso  |
| Correggere 4× `datetime.now()` senza tz      | P2       | Basso  |
| Implementare change password per utenti invitati | P2    | Medio  |
| Code splitting con React.lazy                 | P2       | Basso  |
| Aggiungere Error Boundary React               | P2       | Basso  |
| Aggiungere test frontend (Playwright/Cypress) | P2       | Medio  |
| Token rotation / refresh                      | P2       | Medio  |
| CSP headers                                   | P3       | Basso  |

### Step 3 — DevOps e Integrazioni Future

| Azione                                        | Priorità | Sforzo |
|-----------------------------------------------|----------|--------|
| Dockerfile backend + frontend                 | P1       | Basso  |
| docker-compose.yml (mongo + backend + frontend)| P1      | Basso  |
| README.md professionale                       | P1       | Basso  |
| .gitignore robusto                            | P1       | Basso  |
| Multi-worker uvicorn (gunicorn + uvicorn)     | P2       | Basso  |
| Integrazione Google Calendar                  | P2       | Alto   |
| Integrazione email (SendGrid)                 | P2       | Medio  |
| Export report PDF/Excel                       | P2       | Medio  |
| Grafici interattivi (recharts)                | P3       | Basso  |
| PWA (manifest + service worker)               | P3       | Medio  |
| Multi-livello approvazioni                    | P3       | Alto   |

---

## APPENDICE — FIX APPLICATI (18 Feb 2026, post-audit)

Tutti i fix sono stati verificati con 23/23 test passed (2 run consecutivi stabili).

| Fix | Descrizione | File:Righe | Stato |
|-----|-------------|------------|-------|
| **Fix 1** | **Schema `company_closures` unificato**: seed migrato da `date` a `start_date`/`end_date`. GET `/api/closures` filtra su `start_date`. GET `/api/calendar/closures` filtra su `start_date`/`end_date`. POST `/api/closures` non accetta più il campo `date`. Dati DB live migrati (12 festività). | `server.py` L254–267, L1293–1297, L1000–1003, L1311 | Risolto |
| **Fix 2** | **Indici MongoDB aggiunti**: `leave_types(org_id)`, `leave_balances(org_id, year)`, `announcements(org_id)`, `closure_exceptions(org_id)` | `server.py` L69–72 | Risolto |
| **Fix 3** | **Paginazione**: parametri `page` (default 1) e `page_size` (default 50/50/20) su GET `/api/leave-requests`, `/api/leave-balances`, `/api/announcements`. Retrocompatibile (senza parametri = comportamento originale). | `server.py` GET endpoints | Risolto |
| **Fix 4** | **Validazione password server-side**: min 8 caratteri + almeno 1 numero su POST `/api/auth/register` e POST `/api/team/invite`. HTTP 422 con messaggio chiaro. | `server.py` L50–53, L420, L1054 | Risolto |
| **Fix 5** | **datetime timezone**: 4 occorrenze di `datetime.now()` sostituite con `datetime.now(timezone.utc)` per coerenza | `server.py` L905, L918, L936, L1137 | Risolto |
| **Fix 6** | **CORS ristretto**: `allow_methods` da `["*"]` a `["GET","POST","PUT","DELETE","OPTIONS"]`, `allow_headers` da `["*"]` a `["Content-Type","Authorization"]` | `server.py` L95–96 | Risolto |

### Debito Tecnico Aggiornato (post-fix)

| ID  | Stato |
|-----|-------|
| D05 (schema closures) | **Risolto** (Fix 1) |
| D06 (indici mancanti) | **Risolto** (Fix 2) |
| D07 (datetime senza tz) | **Risolto** (Fix 5) |
| S01 (CORS permissivo) | **Risolto** (Fix 6) |
| S03 (password debole) | **Risolto** (Fix 4) |
| D01–D04, D08–D14 | Invariati (richiesto refactoring strutturale) |

---

## APPENDICE B — REFACTORING STRUTTURALE (19 Feb 2026)

Il refactoring strutturale descritto nello Step 1 della Roadmap è stato completato. I file monolitici sono stati decomposti in moduli separati.

### Backend: da `server.py` monolite a struttura modulare

**Nuova struttura:**
```
backend/
├── server.py          # Ridotto a: app init + include_router (entry point)
├── config.py          # Env vars, costanti, configurazione
├── models.py          # Tutti i modelli Pydantic
├── auth.py            # Helpers autenticazione (create_token, verify_password, get_current_user)
├── database.py        # Connessione DB, lifespan, helpers
├── seed.py            # seed_default_data, seed_demo_users
└── routes/
    ├── auth.py        # register, login, session, me, logout
    ├── leave.py       # leave-requests, leave-types, leave-balances
    ├── team.py        # team CRUD + invite
    ├── organization.py# org, settings, rules
    ├── announcements.py # announcements CRUD
    ├── closures.py    # closures + exceptions
    └── stats.py       # stats, calendar
```

**File principale `server.py` (prima vs dopo):**
| Metrica | Prima | Dopo |
|---------|-------|------|
| Righe | 1.489 | ~50 |
| Responsabilità | Tutto | Solo init + routing |
| Endpoint definiti | 35 | 0 (delegati ai router) |

### Frontend: da `App.js` monolite a componenti separati

**Nuova struttura:**
```
frontend/src/
├── App.js             # Ridotto a: providers + hash router (~60 righe)
├── lib/
│   └── api.js         # Client API con axios
├── context/
│   ├── AuthContext.js # Provider autenticazione
│   └── NotificationContext.js # Servizio notifiche + toast
├── components/
│   ├── Icons.js       # Logo + icone SVG
│   └── ThemeToggle.js # Switch dark/light mode
├── pages/
│   ├── LandingPage.js
│   ├── LoginPage.js
│   ├── RegisterPage.js
│   ├── AuthCallback.js
│   ├── Dashboard.js
│   ├── DashboardContent.js
│   ├── CalendarPage.js
│   ├── StatsPage.js
│   ├── RequestsPage.js
│   ├── TeamPage.js
│   ├── SettingsPage.js
│   ├── AnnouncementsPage.js
│   └── ClosuresPage.js
└── index.css          (invariato)
```

**File principale `App.js` (prima vs dopo):**
| Metrica | Prima | Dopo |
|---------|-------|------|
| Righe | 3.533 | ~60 |
| Componenti inline | 19 | 0 |
| Code splitting | No | Sì (`React.lazy` su 5 pagine) |

### Code Splitting implementato

Le seguenti pagine sono caricate con `React.lazy()` per ridurre il bundle iniziale:
- `StatsPage`
- `CalendarPage`
- `SettingsPage`
- `AnnouncementsPage`
- `ClosuresPage`

### Debito Tecnico Aggiornato (post-refactoring)

| ID | Stato | Note |
|----|-------|------|
| D01 (Backend monolite) | **Risolto** | Struttura modulare con routers |
| D02 (Frontend monolite) | **Risolto** | Componenti separati + code splitting |
| D04 (dict invece di Pydantic) | **Aperto** | Richiede aggiunta `response_model` |
| D08 (logica balance duplicata) | **Aperto** | Richiede helper centralizzato |
| D03, D09–D14 | Invariati | |

### Test Validazione

- **Backend pytest**: 30/30 test passed (suite ampliata)
- **Testing agent E2E**: 30/30 test passed (100% success)
- **Screenshot verification**: Landing, Login, Dashboard funzionanti

---

## APPENDICE C — FIX UI/UX (20 Feb 2026)

### Problemi identificati dall'utente

1. **Modalità scura mancante** — Il refactoring aveva rimosso il default dark mode
2. **Logo originale rimosso** — Sostituito erroneamente con icona SVG "P"
3. **Testo "PMI Italiane"** — Non desiderato dall'utente

### Fix applicati

| Fix | Descrizione | File modificati | Stato |
|-----|-------------|-----------------|-------|
| **UI-1** | **ThemeToggle aggiunto a tutte le pagine**: Landing, Login, Register ora hanno il toggle tema nell'header | `LandingPage.js`, `LoginPage.js`, `RegisterPage.js` | Risolto |
| **UI-2** | **Dark mode come default**: Quando non c'è preferenza in localStorage, il sito usa automaticamente il tema scuro | `ThemeToggle.js` L5–8 | Risolto |
| **UI-3** | **Logo originale ripristinato**: Ripristinata l'immagine del razzo al posto dell'icona SVG "P" | `Icons.js` L3–12 | Risolto |
| **UI-4** | **Rimosso "PMI Italiane"**: Sostituito con "Gestione Ferie Semplice e Veloce" | `LandingPage.js` L45, L153 | Risolto |
| **UI-5** | **Link home su Login/Register**: Aggiunto logo cliccabile per tornare alla landing page | `LoginPage.js`, `RegisterPage.js` | Risolto |

### Dettaglio modifiche

**`components/Icons.js`** — Logo ripristinato:
```javascript
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_hr-powerup/artifacts/roxglb36_ChatGPT%20Image%2017%20feb%202026%2C%2010_27_22.png';

export const RocketLogo = ({ size = 32 }) => (
  <img src={LOGO_URL} alt="PowerLeave Logo" style={{ width: size, height: size, objectFit: 'contain', borderRadius: '8px' }} />
);
```

**`components/ThemeToggle.js`** — Dark mode default:
```javascript
const [dark, setDark] = useState(() => {
  const saved = localStorage.getItem('theme');
  if (saved) return saved === 'dark';
  return true; // Default to dark mode
});
```

### Verifica visiva

| Pagina | Dark Mode | Logo | ThemeToggle | Screenshot |
|--------|-----------|------|-------------|------------|
| Landing | ✅ | ✅ | ✅ | Verificato |
| Login | ✅ | ✅ | ✅ | Verificato |
| Register | ✅ | ✅ | ✅ | Verificato |
| Dashboard | ✅ | ✅ | ✅ | Verificato |

### Test Backend

- **pytest**: 30/30 passed (nessuna regressione)

---

## APPENDICE D — FIX CRITICO VALIDAZIONE DATE (20 Feb 2026)

### Problema identificato

**BUG CRITICO**: Il form di richiesta ferie permetteva l'inserimento di date assurde:
- Date nel passato (es. 1994, 1995)
- Date nel futuro lontanissimo (es. 4292, 2999)

Questo era un problema di validazione mancante sia lato frontend che backend.

### Fix applicati

| Fix | Descrizione | File modificati | Stato |
|-----|-------------|-----------------|-------|
| **DATE-1** | **Validazione backend**: Start date non può essere nel passato | `routes/leave.py` L88–108 | Risolto |
| **DATE-2** | **Validazione backend**: End date >= Start date | `routes/leave.py` L88–108 | Risolto |
| **DATE-3** | **Validazione backend**: Max 2 anni nel futuro | `routes/leave.py` L88–108 | Risolto |
| **DATE-4** | **Validazione frontend**: Attributi `min`/`max` su input date | `Dashboard.js` L283–303 | Risolto |
| **DATE-5** | **Validazione frontend**: Check JavaScript con messaggio italiano | `Dashboard.js` L264–295 | Risolto |

### Dettaglio implementazione Backend

```python
# routes/leave.py - Validazione date
today = datetime.now(timezone.utc).replace(...)

# Start date non può essere nel passato
if start < today:
    raise HTTPException(422, "La data di inizio non può essere nel passato")

# End date >= start date
if end < start:
    raise HTTPException(422, "La data di fine deve essere uguale o successiva...")

# Max 2 anni nel futuro
max_future_date = today.replace(year=today.year + 2)
if start > max_future_date or end > max_future_date:
    raise HTTPException(422, "Le date non possono essere oltre 2 anni nel futuro")
```

### Dettaglio implementazione Frontend

```javascript
// Dashboard.js - Validazione date
const today = new Date().toISOString().split('T')[0];
const maxDate = new Date();
maxDate.setFullYear(maxDate.getFullYear() + 2);

// Input con min/max HTML5
<input type="date" min={today} max={maxDateStr} ... />

// Validazione JavaScript custom con messaggi italiani
if (start < todayDate) {
  setError('La data di inizio non può essere nel passato');
  return;
}
```

### Test aggiunti

Nuova classe `TestDateValidation` con 3 test:
- `test_past_date_rejected` — Verifica HTTP 422 per date nel passato
- `test_end_before_start_rejected` — Verifica HTTP 422 se end < start
- `test_far_future_date_rejected` — Verifica HTTP 422 per date oltre 2 anni

### Test Suite aggiornata

- **pytest**: 33/33 passed (30 originali + 3 nuovi)

---

## RIEPILOGO STATO PROGETTO

### Completato ✅

1. **Sicurezza & Stabilità** (P0)
   - SECRET_KEY obbligatorio
   - Rate limiting su auth
   - Password validation server-side
   - CORS ristretto
   - Test suite stabile (33 test)
   - CI/CD GitHub Actions

2. **Fix Critici Database** (P0)
   - Schema closures unificato
   - Indici MongoDB aggiunti
   - Paginazione API
   - Datetime timezone-aware

3. **Refactoring Strutturale** (P0)
   - Backend modulare (routes/, models, auth, config)
   - Frontend modulare (pages/, components/, context/)
   - Code splitting con React.lazy

4. **Fix UI/UX** (P0)
   - Dark mode default
   - Logo originale ripristinato
   - ThemeToggle su tutte le pagine
   - Branding corretto ("PowerLeave" senza "PMI")

5. **Validazione Date** (P0) — CRITICO
   - No date nel passato
   - End date >= Start date
   - Max 2 anni nel futuro
   - Validazione doppia (frontend + backend)

### Da completare 🔄

| Task | Priorità | Stato |
|------|----------|-------|
| Aggiungere `response_model` agli endpoint | P0 | Non iniziato |
| Helper centralizzato init saldo ferie | P0 | Non iniziato |
| Dockerizzazione | P1 | Non iniziato |
| README professionale | P2 | Non iniziato |
| Integrazioni Calendar/Email | P2 | In attesa (utente) |

---

*Documento generato il 18 Febbraio 2026*  
*Aggiornato con Fix 1–6 applicati il 18 Febbraio 2026*  
*Aggiornato con Refactoring Strutturale il 19 Febbraio 2026*
*Aggiornato con Fix UI/UX il 20 Febbraio 2026*
*Aggiornato con Fix Validazione Date il 20 Febbraio 2026*
*Basato su lettura completa del codice sorgente, schema MongoDB live, test report e configurazioni.*
