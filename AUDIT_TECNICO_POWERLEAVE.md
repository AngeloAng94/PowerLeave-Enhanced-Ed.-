# AUDIT TECNICO - PowerLeave v1.0
## Pacchetto di Revisione Tecnica Completa

**Data**: 18 Febbraio 2026
**Versione**: 1.0.0
**Stato**: Produzione (Demo)
**Repository**: PowerLeave - Leave Management SaaS per PMI Italiane

---

## INDICE

1. [Architettura del Sistema](#1-architettura-del-sistema)
2. [Sicurezza](#2-sicurezza)
3. [Backend - Analisi Dettagliata](#3-backend---analisi-dettagliata)
4. [Frontend - Analisi Dettagliata](#4-frontend---analisi-dettagliata)
5. [Database - Schema e Modelli](#5-database---schema-e-modelli)
6. [API Reference Completa](#6-api-reference-completa)
7. [Testing e Qualità](#7-testing-e-qualità)
8. [CI/CD e Deployment](#8-cicd-e-deployment)
9. [Performance e Scalabilità](#9-performance-e-scalabilità)
10. [Istruzioni di Riproduzione Locale](#10-istruzioni-di-riproduzione-locale)
11. [Problemi Noti e Debito Tecnico](#11-problemi-noti-e-debito-tecnico)
12. [Roadmap e Raccomandazioni](#12-roadmap-e-raccomandazioni)

---

## 1. ARCHITETTURA DEL SISTEMA

### 1.1 Panoramica

```
┌─────────────────────────────────────────────────┐
│                   CLIENT (Browser)               │
│   React 18 SPA + Tailwind CSS + Sonner Toast     │
│   Porta: 3000                                    │
└────────────────────┬────────────────────────────┘
                     │ HTTPS (via Kubernetes Ingress)
                     │ Prefisso: /api/*
┌────────────────────▼────────────────────────────┐
│              BACKEND (FastAPI)                    │
│   Python 3.11 + Motor (async MongoDB) + JWT      │
│   Porta: 8001                                    │
│   File: server.py (monolite, 1463 righe)         │
└────────────────────┬────────────────────────────┘
                     │ mongodb://localhost:27017
┌────────────────────▼────────────────────────────┐
│              DATABASE (MongoDB)                   │
│   DB Name: powerleave                            │
│   8 Collections, 5 Indici custom                 │
│   ~56 documenti (demo data)                      │
└─────────────────────────────────────────────────┘
```

### 1.2 Stack Tecnologico

| Layer     | Tecnologia                    | Versione  |
|-----------|-------------------------------|-----------|
| Frontend  | React                         | 18.2.0    |
| UI/CSS    | CSS puro + variabili CSS      | -         |
| Toast     | Sonner                        | 1.4.0     |
| Backend   | FastAPI                       | 0.115.6   |
| Server    | Uvicorn                       | 0.34.0    |
| Database  | MongoDB (Motor async driver)  | 3.6.0     |
| Auth      | JWT (python-jose)             | 3.3.0     |
| Password  | Passlib + bcrypt              | 1.7.4     |
| HTTP      | httpx (per OAuth)             | 0.28.1    |
| Build     | react-scripts                 | 5.0.1     |

### 1.3 Struttura Directory

```
/app/
├── backend/
│   ├── .env                    # MONGO_URL, DB_NAME
│   ├── requirements.txt        # 9 dipendenze Python
│   ├── server.py               # MONOLITE - 1463 righe, TUTTO il backend
│   └── tests/
│       └── test_powerleave_api.py
├── frontend/
│   ├── .env                    # REACT_APP_BACKEND_URL
│   ├── package.json            # 7 dipendenze (React, Tailwind, Sonner, etc.)
│   ├── yarn.lock
│   ├── public/
│   └── src/
│       ├── index.js            # Entry point React
│       ├── index.css           # 541 righe - CSS globale + variabili tema
│       ├── App.js              # MONOLITE - 3533 righe, TUTTA l'app React
│       └── App.css             # (vuoto/non usato)
├── memory/
│   └── PRD.md                  # Product Requirements Document
└── test_reports/
    ├── iteration_1.json
    ├── iteration_2.json
    ├── iteration_3.json
    ├── iteration_4.json
    └── pytest/
        ├── pytest_results.xml
        └── pytest_results_v2.xml
```

### 1.4 Pattern Architetturali

- **Monolite**: Backend e Frontend sono entrambi file singoli monolitici
- **Multi-tenant**: Isolamento dati tramite `org_id` su ogni documento
- **SPA con Hash Router**: Routing client-side via `window.location.hash`
- **State Management**: React Context API (`AuthContext`)
- **API Design**: REST con prefisso `/api/`
- **Auth duale**: JWT (email/password) + Emergent Google OAuth (predisposto)

---

## 2. SICUREZZA

### 2.1 Autenticazione

| Meccanismo      | Implementazione | Stato |
|-----------------|-----------------|-------|
| JWT Token       | python-jose + HS256, 7 giorni di validità | Attivo |
| Cookie Session  | HttpOnly, Secure, SameSite=None, 7gg max_age | Attivo |
| Bearer Token    | Header Authorization | Attivo |
| Password Hash   | bcrypt via passlib | Attivo |
| Google OAuth    | Emergent Auth (redirect flow) | Predisposto |

#### Flusso di autenticazione:
1. Login: `POST /api/auth/login` -> JWT token + cookie `session_token`
2. Token salvato in `localStorage` nel frontend
3. Ogni richiesta invia sia il cookie che l'header `Authorization: Bearer`
4. `get_current_user()` prova prima il cookie, poi l'header
5. Se JWT fallisce, cerca nella collection `user_sessions` (per OAuth)

### 2.2 Autorizzazione

| Ruolo  | Permessi |
|--------|----------|
| admin  | CRUD completo su tutto + review richieste + gestione team + impostazioni |
| user   | Crea richieste, vede le proprie, vede annunci e chiusure |

**Decorator utilizzati:**
- `get_current_user`: Verifica autenticazione
- `get_admin_user`: Verifica ruolo admin

### 2.3 Vulnerabilità Identificate

| ID  | Severità | Descrizione | Dettaglio |
|-----|----------|-------------|-----------|
| S01 | ALTA     | SECRET_KEY hardcoded | `SECRET_KEY = "powerleave-secret-key-change-in-production"` in server.py L27. Default value usato se non presente in .env |
| S02 | MEDIA    | CORS permissivo | Origini specificate ma `allow_methods=["*"]` e `allow_headers=["*"]` |
| S03 | MEDIA    | Nessun rate limiting | Assente su login e registrazione. Vulnerabile a brute force |
| S04 | MEDIA    | Token in localStorage | XSS potrebbe esporre il token JWT |
| S05 | BASSA    | Nessuna validazione forza password | Minimo 6 caratteri (solo frontend), nessun controllo server |
| S06 | BASSA    | Password temporanee in chiaro | `POST /api/team/invite` restituisce la password temporanea nel JSON response |
| S07 | BASSA    | Nessun CSRF token | Mitigato parzialmente da SameSite=None cookie |
| S08 | INFO     | HTTPS non forzato lato app | Gestito dall'infrastruttura Kubernetes/Ingress |
| S09 | INFO     | Nessun Content Security Policy | Header non configurati |

### 2.4 Raccomandazioni Sicurezza Prioritarie

1. **P0**: Spostare `SECRET_KEY` in .env senza valore di default
2. **P0**: Aggiungere rate limiting su `/api/auth/login` e `/api/auth/register`
3. **P1**: Validazione password server-side (min 8 char, maiuscola, numero)
4. **P1**: Non restituire password temporanee nella response API (inviarle via email)
5. **P2**: Aggiungere CSP headers
6. **P2**: Implementare token refresh/rotation

---

## 3. BACKEND - ANALISI DETTAGLIATA

### 3.1 Struttura File: `server.py` (1463 righe)

```
Riga    | Sezione
--------|------------------------------------------
1-56    | Imports, Config, DB init, Lifespan
58-75   | FastAPI app + CORS
77-156  | Modelli Pydantic (12 classi)
158-218 | Helper Auth (token, password, get_user)
220-388 | Seed Data (leave types, holidays, demo users)
389-612 | Auth Endpoints (register, login, session, me, logout)
614-690 | Leave Types CRUD
692-737 | Settings/Rules
739-881 | Leave Requests (create, list, review)
883-932 | Statistics
934-978 | Calendar
980-1095| Team Management
1096-1145| Leave Balances
1146-1170| Organization
1172-1250| Announcements CRUD
1252-1453| Closures + Exceptions
1455-1463| Health Check + main
```

### 3.2 Dipendenze Backend

```
fastapi==0.115.6        # Web framework
uvicorn==0.34.0         # ASGI server
motor==3.6.0            # Async MongoDB driver
python-dotenv==1.0.1    # .env loader
pydantic==2.10.6        # Data validation
httpx==0.28.1           # HTTP client (per OAuth)
python-jose[cryptography]==3.3.0  # JWT
passlib[bcrypt]==1.7.4  # Password hashing
python-multipart==0.0.20  # Form data parsing
```

### 3.3 Modelli Pydantic

| Modello             | Campi principali |
|---------------------|------------------|
| UserBase            | email (EmailStr), name |
| UserCreate          | + password, organization_name? |
| UserLogin           | email, password |
| User                | + user_id, role, org_id, picture?, created_at |
| Organization        | org_id, name, created_at, owner_id |
| LeaveType           | id, name, color, days_per_year, org_id? |
| LeaveRequestCreate  | leave_type_id, start_date, end_date, hours, notes? |
| LeaveRequest        | + id, user_id, user_name, org_id, days, status, reviewed_by? |
| LeaveBalance        | user_id, org_id, leave_type_id, year, total_days, used_days |
| CompanyClosure      | id, org_id, date, reason, type |
| TeamMember          | user_id, name, email, role, picture? |

**Nota critica**: I modelli Pydantic sono definiti ma NON usati come response model nella maggior parte degli endpoint. La maggior parte degli endpoint usa `dict` come tipo di input.

### 3.4 Logica di Business

#### Leave Request Workflow:
```
User crea richiesta -> status: "pending"
                    -> Validazione date
                    -> Validazione overlap
                    -> Verifica tipo assenza
Admin approva -> status: "approved"
             -> Aggiorna leave_balance (used_days += days * hours/8)
Admin rifiuta -> status: "rejected"
```

#### Company Closure Workflow:
```
Admin crea chiusura -> auto_leave=true
                    -> Crea leave_request per OGNI dipendente
                    -> status: "approved" automaticamente
                    -> allow_exceptions=true
User chiede deroga -> closure_exception: "pending"
Admin approva deroga -> Elimina la leave_request auto-creata
```

#### Seed Data (all'avvio se DB vuoto):
- 4 tipi assenza predefiniti (Ferie, Permesso, Malattia, Maternità)
- 12 festività italiane 2026
- 1 organizzazione demo
- 4 utenti demo (1 admin + 3 user)
- Saldi ferie inizializzati per tutti
- 3 richieste ferie di esempio

### 3.5 Problemi di Codice Backend

| ID  | Severità | Problema | File:Riga |
|-----|----------|----------|-----------|
| B01 | ALTA     | Monolite da 1463 righe - Non manutenibile | server.py |
| B02 | MEDIA    | Input `dict` generico invece di Pydantic models tipizzati | server.py:L626,716,833,998,etc. |
| B03 | MEDIA    | N+1 potenziale nelle query (mitigato in leave-balances) | server.py |
| B04 | MEDIA    | `datetime.now()` usato senza timezone in 2 punti | server.py:L876,906 |
| B05 | BASSA    | Nessun logging strutturato | server.py |
| B06 | BASSA    | Nessuna paginazione sulle liste | server.py |
| B07 | BASSA    | Leave request usa `status` in seed ma `request_status` nel modello | server.py:L346,130 |
| B08 | INFO     | Modelli Pydantic definiti ma non usati come response_model | server.py |

---

## 4. FRONTEND - ANALISI DETTAGLIATA

### 4.1 Struttura File: `App.js` (3533 righe)

```
Riga     | Componente / Sezione
---------|------------------------------------------
1-7      | Imports (React, Sonner)
5-6      | Costanti (API_URL, LOGO_URL)
9-92     | NotificationService (oggetto singleton)
94-104   | Context (AuthContext, NotificationContext)
107-133  | API helper (fetch wrapper con token)
136-199  | AuthProvider (login, register, logout, OAuth)
201-318  | Icons (14 icone SVG inline)
321-364  | ThemeToggle (dark/light mode)
367-599  | LandingPage (hero, features, pricing, footer)
603-705  | LoginPage
707-828  | RegisterPage
830-879  | AuthCallback (OAuth callback)
882-1253 | Dashboard (sidebar, nav, mobile layout, request modal)
1256-1628| DashboardContent (stats, form, calendar, balances)
1629-1676| MiniCalendar
1679-1827| CalendarPage (full calendar view)
1828-2190| StatsPage (analytics dashboard con grafici)
2192-2299| RequestsPage (lista richieste con filtri)
2301-2463| TeamPage (gestione team + inviti)
2465-2952| SettingsPage (4 tab: org, leave types, rules, team)
2954-3151| AnnouncementsPage (CRUD annunci)
3153-3479| ClosuresPage (chiusure + eccezioni)
3481-3533| App + AppRouter (hash-based routing)
```

### 4.2 Dipendenze Frontend

```json
{
  "react": "18.2.0",
  "react-dom": "18.2.0",
  "react-scripts": "5.0.1",
  "sonner": "1.4.0",
  "tailwindcss": "3.4.0",
  "autoprefixer": "^10.4.24",
  "postcss": "^8.5.6"
}
```

**Nota**: `tailwindcss` è presente in `package.json` ma NON c'è un file `tailwind.config.js`. L'intero styling è fatto tramite CSS puro in `index.css` (541 righe) con variabili CSS per il tema. Le classi Tailwind-like sono ridefinite manualmente nel CSS.

### 4.3 Componenti React (19 totali, tutti in App.js)

| Componente        | Righe | Tipo          | Ruolo |
|-------------------|-------|---------------|-------|
| AuthProvider      | 63    | Provider      | Gestione autenticazione globale |
| RocketLogo        | 15    | Puro          | Logo SVG |
| Icons             | 117   | Oggetto       | 14 icone SVG inline |
| ThemeToggle       | 43    | Stateful      | Switch tema chiaro/scuro |
| LandingPage       | 232   | Stateful      | Home page pubblica |
| LoginPage         | 102   | Stateful      | Form login |
| RegisterPage      | 121   | Stateful      | Form registrazione |
| AuthCallback      | 49    | Effetto       | Gestione callback OAuth |
| Dashboard         | 371   | Stateful      | Layout principale (sidebar + routing) |
| DashboardContent  | 372   | Stateful      | Contenuto dashboard (stats, form, calendario) |
| MiniCalendar      | 47    | Stateful      | Calendario compatto |
| CalendarPage      | 148   | Stateful      | Vista calendario completa |
| StatsPage         | 362   | Stateful      | Analytics dashboard |
| RequestsPage      | 107   | Stateful      | Lista richieste ferie |
| TeamPage          | 162   | Stateful      | Gestione team |
| SettingsPage      | 487   | Stateful      | Impostazioni (4 tab) |
| AnnouncementsPage | 197   | Stateful      | Bacheca annunci |
| ClosuresPage      | 326   | Stateful      | Chiusure aziendali |
| App/AppRouter     | 52    | Router        | Hash-based routing |

### 4.4 Sistema di Routing

```javascript
// Hash-based routing (no react-router-dom)
switch(hash) {
  '':         LandingPage
  '#/login':  LoginPage
  '#/register': RegisterPage
  '#/auth/callback': AuthCallback
  '#/dashboard': Dashboard (se autenticato)
  default:    LandingPage
}
```

**Routing interno Dashboard**: Gestito tramite stato `currentPage` (nessun URL change):
- dashboard, calendar, requests, announcements, closures, team, stats, settings

### 4.5 Sistema di Temi

**CSS Variables in `index.css`:**
```
:root (light)    .dark (dark)
─────────────    ──────────────
--background: #F8FAFC    #030712
--foreground: #0F172A    #F1F5F9
--card:       #FFFFFF    #0F172A
--primary:    #2563EB    #3B82F6
--muted:      #F1F5F9    #1E293B
--border:     #E2E8F0    #334155
```

Persistenza: `localStorage.getItem('theme')` con fallback a `prefers-color-scheme`.

### 4.6 API Client

```javascript
const api = {
  async fetch(endpoint, options = {}) {
    // Aggiunge token da localStorage
    // Aggiunge credentials: 'include' per i cookie
    // Parsa errori e ritorna JSON
  },
  get: (endpoint) => api.fetch(endpoint),
  post: (endpoint, data) => api.fetch(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data) => api.fetch(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint) => api.fetch(endpoint, { method: 'DELETE' }),
};
```

### 4.7 Problemi di Codice Frontend

| ID  | Severità | Problema | Dettaglio |
|-----|----------|----------|-----------|
| F01 | ALTA     | Monolite da 3533 righe in un singolo file | App.js contiene tutti i 19 componenti |
| F02 | ALTA     | Nessun react-router-dom | Routing custom via hash, nessun URL per pagine interne |
| F03 | MEDIA    | Grafici StatsPage implementati in puro CSS/div | Nessuna libreria chart (recharts era menzionato nel PRD ma non installato) |
| F04 | MEDIA    | Nessuna gestione errori globale | Try/catch per componente, nessun Error Boundary |
| F05 | MEDIA    | Tailwind configurato ma non usato | `tailwindcss` in package.json, no tailwind.config.js, CSS manuale |
| F06 | BASSA    | 14 icone SVG inline | Potrebbero usare lucide-react o una libreria di icone |
| F07 | BASSA    | Nessun lazy loading componenti | Tutti i componenti caricati al primo render |
| F08 | BASSA    | Duplicazione logica form richieste | Form presente sia in Dashboard (modale) che in DashboardContent (inline) |
| F09 | INFO     | Nessun TypeScript | Tutto in JavaScript senza type checking |

---

## 5. DATABASE - SCHEMA E MODELLI

### 5.1 Panoramica Collections

| Collection          | Documenti | Descrizione |
|---------------------|-----------|-------------|
| users               | 5         | Utenti del sistema |
| organizations       | 1         | Organizzazioni (tenant) |
| leave_types         | 4         | Tipi di assenza |
| leave_requests      | 8         | Richieste ferie |
| leave_balances      | 20        | Saldi ferie per utente/tipo/anno |
| company_closures    | 14        | Chiusure aziendali + festività |
| announcements       | 2         | Annunci bacheca |
| closure_exceptions  | 2         | Richieste di deroga |
| user_sessions       | 0*        | Sessioni OAuth (*non usato con JWT) |
| org_settings        | 0*        | Regole organizzazione (*creato on-demand) |

### 5.2 Schema Dettagliato per Collection

#### `users`
```json
{
  "user_id": "user_admin",          // string, unique index
  "email": "admin@demo.it",         // string, unique index
  "name": "Marco Rossi",            // string
  "password_hash": "$2b$12$...",     // string (bcrypt)
  "role": "admin",                   // "admin" | "user"
  "org_id": "org_demo",             // string -> organizations.org_id
  "picture": null,                   // string? (URL per OAuth)
  "created_at": "2026-02-17T09:52:32.804Z"  // datetime
  // Opzionale per utenti invitati:
  // "invited_by": "user_admin"
}
```

#### `organizations`
```json
{
  "org_id": "org_demo",             // string, unique index
  "name": "PowerLeave Demo",        // string
  "created_at": "2026-02-17T09:52:32.804Z",
  "owner_id": "user_admin"          // string -> users.user_id
}
```

#### `leave_types`
```json
{
  "id": "ferie",                     // string (predefiniti: ferie, permesso, malattia, maternita)
  "name": "Ferie",                   // string
  "color": "#22C55E",                // string (hex color)
  "days_per_year": 26,               // int
  "org_id": null,                    // null = globale, string = custom per org
  // Opzionale per custom:
  // "is_custom": true
}
```

**Tipi predefiniti:**
| id        | name                  | color   | days_per_year |
|-----------|-----------------------|---------|---------------|
| ferie     | Ferie                 | #22C55E | 26            |
| permesso  | Permesso              | #3B82F6 | 32            |
| malattia  | Malattia              | #EF4444 | 180           |
| maternita | Maternità/Paternità   | #A855F7 | 150           |

#### `leave_requests`
```json
{
  "id": "uuid-string",              // string
  "user_id": "user_mario",          // string -> users.user_id
  "user_name": "Mario Bianchi",     // string (denormalizzato)
  "org_id": "org_demo",             // string -> organizations.org_id
  "leave_type_id": "ferie",         // string -> leave_types.id
  "leave_type_name": "Ferie",       // string (denormalizzato)
  "start_date": "2026-03-15",       // string YYYY-MM-DD
  "end_date": "2026-03-20",         // string YYYY-MM-DD
  "days": 6,                        // int (calcolato: end-start+1)
  "hours": 8,                       // int (2|4|8)
  "notes": "Vacanze di primavera",  // string?
  "status": "approved",             // "pending" | "approved" | "rejected"
  "reviewed_by": "user_admin",      // string?
  "reviewed_at": "2026-02-17T09:52:32.804Z",  // datetime?
  "created_at": "2026-02-12T09:52:32.804Z",
  // Opzionale per chiusure auto:
  // "closure_id": "uuid",
  // "is_closure_leave": true
}
```

#### `leave_balances`
```json
{
  "user_id": "user_admin",
  "org_id": "org_demo",
  "leave_type_id": "ferie",
  "year": 2026,
  "total_days": 26,                  // int
  "used_days": 2.0                   // float (2=half-day, etc.)
}
```

#### `company_closures`
```json
{
  "id": "uuid-string",
  "org_id": null,                    // null = nazionale, string = aziendale
  "date": "2026-01-01",             // string (per festività singole)
  // Per chiusure personalizzate:
  // "start_date": "2026-08-10",
  // "end_date": "2026-08-21",
  "reason": "Capodanno",
  "type": "holiday",                 // "holiday" | "shutdown"
  // Campi aggiuntivi per shutdown custom:
  // "auto_leave": true,
  // "allow_exceptions": true,
  // "created_at": datetime,
  // "created_by": "user_admin"
}
```

#### `announcements`
```json
{
  "id": "uuid-string",
  "org_id": "org_demo",
  "title": "Annuncio Test",
  "content": "Contenuto dell'annuncio",
  "priority": "normal",             // "low" | "normal" | "high"
  "author_id": "user_admin",
  "author_name": "Marco Rossi",     // denormalizzato
  "created_at": "2026-02-17T13:46:35.909Z",
  "expires_at": null                 // datetime?
}
```

#### `closure_exceptions`
```json
{
  "id": "uuid-string",
  "closure_id": "uuid-string",      // -> company_closures.id
  "user_id": "user_mario",
  "user_name": "Mario Bianchi",     // denormalizzato
  "org_id": "org_demo",
  "reason": "Ho un progetto urgente da consegnare",
  "status": "pending",              // "pending" | "approved" | "rejected"
  "created_at": "2026-02-17T13:46:45.254Z"
  // Dopo review:
  // "reviewed_by": "user_admin",
  // "reviewed_at": datetime
}
```

### 5.3 Indici MongoDB

| Collection     | Indice                      | Tipo    |
|----------------|-----------------------------|---------|
| users          | email_1                     | unique  |
| users          | user_id_1                   | unique  |
| organizations  | org_id_1                    | unique  |
| leave_requests | org_id_1 + user_id_1        | compound|
| leave_requests | org_id_1 + start_date_1     | compound|

### 5.4 Considerazioni Schema

- **Denormalizzazione**: `user_name` e `leave_type_name` sono duplicati nelle leave_requests per evitare join. Questo può causare inconsistenze se il nome utente cambia.
- **Date come stringhe**: `start_date`/`end_date` sono stringhe `YYYY-MM-DD`, non oggetti Date. Funzionale per confronti lessicografici ma non ottimale per range query.
- **Nessuna foreign key**: MongoDB non supporta FK, l'integrità referenziale è responsabilità dell'applicazione.
- **Multi-tenancy**: Ogni documento ha `org_id` per l'isolamento. Manca un indice composto su `org_id` per alcune collection (announcements, closure_exceptions).

---

## 6. API REFERENCE COMPLETA

### 6.1 Autenticazione

| Metodo | Endpoint | Auth | Descrizione |
|--------|----------|------|-------------|
| POST   | `/api/auth/register` | No | Registra nuovo utente + organizzazione |
| POST   | `/api/auth/login` | No | Login con email/password |
| POST   | `/api/auth/session` | No | Processa sessione OAuth (Emergent) |
| GET    | `/api/auth/me` | Si | Ottieni profilo utente corrente |
| POST   | `/api/auth/logout` | No | Cancella cookie sessione |

### 6.2 Leave Types (Tipi Assenza)

| Metodo | Endpoint | Auth | Ruolo | Descrizione |
|--------|----------|------|-------|-------------|
| GET    | `/api/leave-types` | Si | Tutti | Lista tipi assenza (globali + org) |
| POST   | `/api/leave-types` | Si | Admin | Crea tipo assenza custom |
| PUT    | `/api/leave-types/{type_id}` | Si | Admin | Aggiorna tipo assenza |
| DELETE | `/api/leave-types/{type_id}` | Si | Admin | Elimina tipo custom |

### 6.3 Leave Requests (Richieste Ferie)

| Metodo | Endpoint | Auth | Ruolo | Descrizione |
|--------|----------|------|-------|-------------|
| POST   | `/api/leave-requests` | Si | Tutti | Crea richiesta ferie |
| GET    | `/api/leave-requests` | Si | Tutti* | Lista richieste (*admin: tutte, user: proprie) |
| PUT    | `/api/leave-requests/{id}/review` | Si | Admin | Approva/rifiuta richiesta |

### 6.4 Settings & Rules

| Metodo | Endpoint | Auth | Ruolo | Descrizione |
|--------|----------|------|-------|-------------|
| GET    | `/api/settings/rules` | Si | Tutti | Ottieni regole organizzazione |
| PUT    | `/api/settings/rules` | Si | Admin | Aggiorna regole |

### 6.5 Statistics & Calendar

| Metodo | Endpoint | Auth | Descrizione |
|--------|----------|------|-------------|
| GET    | `/api/stats` | Si | Statistiche dashboard |
| GET    | `/api/calendar/monthly?year=&month=` | Si | Ferie del mese |
| GET    | `/api/calendar/closures?year=&month=` | Si | Chiusure del mese |

### 6.6 Team

| Metodo | Endpoint | Auth | Ruolo | Descrizione |
|--------|----------|------|-------|-------------|
| GET    | `/api/team` | Si | Tutti | Lista membri team |
| POST   | `/api/team/invite` | Si | Admin | Invita membro (crea con password temp) |
| PUT    | `/api/team/{user_id}` | Si | Admin | Aggiorna ruolo/nome membro |
| DELETE | `/api/team/{user_id}` | Si | Admin | Rimuovi membro |

### 6.7 Leave Balances & Organization

| Metodo | Endpoint | Auth | Descrizione |
|--------|----------|------|-------------|
| GET    | `/api/leave-balances` | Si | Saldi ferie (admin: tutti, user: propri) |
| GET    | `/api/organization` | Si | Dettagli organizzazione |
| PUT    | `/api/organization` | Si (Admin) | Aggiorna organizzazione |

### 6.8 Announcements (Bacheca)

| Metodo | Endpoint | Auth | Ruolo | Descrizione |
|--------|----------|------|-------|-------------|
| GET    | `/api/announcements` | Si | Tutti | Lista annunci |
| POST   | `/api/announcements` | Si | Admin | Crea annuncio |
| PUT    | `/api/announcements/{id}` | Si | Admin | Modifica annuncio |
| DELETE | `/api/announcements/{id}` | Si | Admin | Elimina annuncio |

### 6.9 Closures (Chiusure Aziendali)

| Metodo | Endpoint | Auth | Ruolo | Descrizione |
|--------|----------|------|-------|-------------|
| GET    | `/api/closures?year=` | Si | Tutti | Lista chiusure |
| POST   | `/api/closures` | Si | Admin | Crea chiusura |
| DELETE | `/api/closures/{id}` | Si | Admin | Elimina chiusura |
| POST   | `/api/closures/{id}/exception` | Si | Tutti | Richiedi deroga |
| GET    | `/api/closures/exceptions` | Si | Tutti* | Lista deroghe |
| PUT    | `/api/closures/exceptions/{id}/review` | Si | Admin | Approva/rifiuta deroga |

### 6.10 Utility

| Metodo | Endpoint | Auth | Descrizione |
|--------|----------|------|-------------|
| GET    | `/api/health` | No | Health check |

**Totale: 35 endpoint**

---

## 7. TESTING E QUALITA'

### 7.1 Test Esistenti

**Backend tests** (`/app/backend/tests/test_powerleave_api.py`):
- Test automatici via pytest
- Copertura: 22 test case
- Risultato ultimo: 21/22 passed (95.5%)
- 1 test flaky su `/api/leave-requests POST` (conflitto dati da run precedenti)

**Integration tests** (via testing_agent):
- 4 iterazioni di test e2e completate
- Frontend: 100% pass
- Backend: 95.5% pass

### 7.2 Copertura Test

| Area | Testato | Non Testato |
|------|---------|-------------|
| Auth (login/register) | Si | OAuth flow |
| Leave requests CRUD | Si | Validazione date edge case |
| Announcements CRUD | Si | - |
| Closures + exceptions | Si | Auto-leave creation |
| Team management | Si | - |
| Settings/Rules | Si | Validazione valori |
| Stats | Si | - |
| Calendar | Parziale | Range across months |
| Leave types | Si | - |
| Leave balances | Si | Year rollover |

### 7.3 Report Test Disponibili

```
/app/test_reports/iteration_1.json  # Prima suite (setup + core API)
/app/test_reports/iteration_2.json  # Settings, rules, team
/app/test_reports/iteration_3.json  # Full e2e con frontend
/app/test_reports/iteration_4.json  # Final validation (95.5% backend, 100% frontend)
/app/test_reports/pytest/pytest_results_v2.xml  # JUnit XML
```

---

## 8. CI/CD E DEPLOYMENT

### 8.1 Ambiente Attuale

- **Piattaforma**: Emergent Agent (Kubernetes)
- **URL Preview**: `https://hr-italia-preview.preview.emergentagent.com`
- **Process Manager**: Supervisor
  - Backend: porta 8001 (auto-restart)
  - Frontend: porta 3000 (auto-restart)
  - MongoDB: porta 27017

### 8.2 File di Configurazione

**Backend `.env`:**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=powerleave
```

**Frontend `.env`:**
```
REACT_APP_BACKEND_URL=https://hr-italia-preview.preview.emergentagent.com
```

### 8.3 Mancante per Produzione

| Elemento | Stato |
|----------|-------|
| Dockerfile (backend) | Assente |
| Dockerfile (frontend) | Assente |
| docker-compose.yml | Assente |
| .dockerignore | Assente |
| nginx.conf (frontend) | Assente |
| GitHub Actions CI/CD | Assente |
| README.md | Assente |
| .gitignore robusto | Assente |
| Variabili env produzione | Non configurate |
| SSL/TLS | Gestito da Kubernetes |
| Backup MongoDB | Non configurato |
| Monitoring/Alerting | Assente |

---

## 9. PERFORMANCE E SCALABILITA'

### 9.1 Stato Attuale

| Metrica | Valore |
|---------|--------|
| Backend startup | ~2s |
| API response time (health) | <50ms |
| Frontend bundle (stimato) | ~300KB (no code splitting) |
| MongoDB queries per page load | 4-6 (dashboard) |
| Concurrent users supportati | ~50 (single process) |

### 9.2 Bottleneck Identificati

1. **Frontend monolite**: Un singolo bundle carica tutto il codice (~148KB source). Nessun code splitting o lazy loading.
2. **Backend single process**: Uvicorn con un solo worker.
3. **Nessun caching**: Ogni richiesta colpisce MongoDB.
4. **Nessun CDN**: Assets serviti direttamente.
5. **Date come stringhe**: Le query su range di date non sfruttano appieno gli indici MongoDB.

### 9.3 Raccomandazioni Performance

1. **P1**: Aggiungere paginazione a tutti gli endpoint lista
2. **P1**: Code splitting frontend con React.lazy() per le pagine
3. **P2**: Aggiungere caching Redis per stats e dati letti frequentemente
4. **P2**: Configurare Uvicorn con multipli worker
5. **P3**: Convertire date in oggetti Date nativi MongoDB

---

## 10. ISTRUZIONI DI RIPRODUZIONE LOCALE

### 10.1 Prerequisiti

```
- Python 3.11+
- Node.js 18+
- MongoDB 6.0+ (locale o Docker)
- Git
```

### 10.2 Setup Backend

```bash
# 1. Clona il repository
git clone <repository-url>
cd powerleave

# 2. Setup Python virtual environment
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# oppure: venv\Scripts\activate  # Windows

# 3. Installa dipendenze
pip install -r requirements.txt

# 4. Configura variabili ambiente
cp .env.example .env
# Modifica .env con i tuoi valori:
# MONGO_URL=mongodb://localhost:27017
# DB_NAME=powerleave
# SECRET_KEY=<genera-una-chiave-sicura>

# 5. Avvia MongoDB (se non già attivo)
# Opzione Docker:
docker run -d --name powerleave-mongo -p 27017:27017 mongo:6.0

# 6. Avvia il backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Il server crea automaticamente:
# - Indici MongoDB
# - Dati demo (4 utenti, festività, ecc.)
```

### 10.3 Setup Frontend

```bash
# In un terminale separato
cd frontend

# 1. Installa dipendenze
yarn install

# 2. Configura variabili ambiente
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env

# 3. Avvia il frontend
yarn start
# Apri http://localhost:3000
```

### 10.4 Credenziali Demo

| Ruolo | Email | Password |
|-------|-------|----------|
| Admin | admin@demo.it | demo123 |
| User  | mario@demo.it | demo123 |
| User  | anna@demo.it  | demo123 |
| User  | luigi@demo.it | demo123 |

### 10.5 Verifica Funzionamento

```bash
# Health check
curl http://localhost:8001/api/health

# Login
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.it","password":"demo123"}'

# Stats (con token dal login)
curl http://localhost:8001/api/stats \
  -H "Authorization: Bearer <token>"
```

### 10.6 Setup con Docker (futuro)

```yaml
# docker-compose.yml (DA CREARE)
version: '3.8'
services:
  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  backend:
    build: ./backend
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=powerleave
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      - REACT_APP_BACKEND_URL=http://localhost:8001

volumes:
  mongo_data:
```

---

## 11. PROBLEMI NOTI E DEBITO TECNICO

### 11.1 Debito Tecnico Critico

| # | Area | Problema | Impatto | Sforzo |
|---|------|----------|---------|--------|
| 1 | Backend | `server.py` monolite (1463 righe) | Manutenibilità, testing, onboarding | Alto |
| 2 | Frontend | `App.js` monolite (3533 righe) | Stessi problemi + bundle size | Alto |
| 3 | Frontend | CSS manuale (541 righe) duplica Tailwind | Manutenibilità styling | Medio |
| 4 | Security | SECRET_KEY con valore default | Sicurezza in produzione | Basso |
| 5 | Backend | Input `dict` generico sugli endpoint | Type safety, documentazione API | Medio |

### 11.2 Bug Noti

| # | Severità | Bug | Workaround |
|---|----------|-----|------------|
| 1 | BASSA | Test flaky su leave-requests POST (conflitto dati) | Re-run test |
| 2 | INFO | Preview URL Emergent a volte in cold start | Usare curl locale |

### 11.3 Funzionalità Incomplete

| Funzionalità | Stato | Note |
|--------------|-------|------|
| Google Calendar integration | Playbook pronto | On hold per scelta utente |
| Outlook Calendar integration | Playbook pronto | On hold per scelta utente |
| Email notifications (SendGrid) | Playbook pronto | On hold per scelta utente |
| Grafici interattivi (recharts) | Menzionato nel PRD | Non installato, grafici in puro CSS |
| Password change | Non implementato | Utenti invitati hanno password temp senza modo di cambiarla |
| Paginazione | Non implementata | Tutte le liste caricano tutto |

---

## 12. ROADMAP E RACCOMANDAZIONI

### 12.1 Priorità Immediate (P0 - Prima del lancio)

1. **Refactoring Backend**: Spezzare `server.py` in moduli:
   - `routes/auth.py`, `routes/leave.py`, `routes/team.py`, ecc.
   - `models/` directory con Pydantic models
   - `services/` directory con logica business
2. **Refactoring Frontend**: Spezzare `App.js` in componenti separati:
   - `pages/` directory per ogni pagina
   - `components/` per componenti riutilizzabili
   - `context/` per providers
   - `lib/api.js` per client API
3. **Sicurezza**: Fix SECRET_KEY, aggiungere rate limiting, validazione password
4. **Change Password**: Implementare per utenti invitati

### 12.2 Priorità Alta (P1 - Post-lancio)

1. **Dockerizzazione**: Creare Dockerfile e docker-compose
2. **README.md professionale**: Documentazione pubblica
3. **Paginazione API**: Su tutti gli endpoint lista
4. **Error Boundaries**: Nel frontend
5. **react-router-dom**: Sostituire hash routing con routing URL-based

### 12.3 Priorità Media (P2 - Crescita)

1. **Integrazioni**: Google Calendar, Outlook, SendGrid (playbook già pronti)
2. **Grafici interattivi**: Installare e usare recharts
3. **Export report**: PDF/Excel per analytics
4. **PWA**: Manifest, service worker, offline support

### 12.4 Priorità Bassa (P3 - Futuro)

1. **Approvazione multi-livello**: Manager -> HR -> Admin
2. **Audit log**: Tracciamento azioni utente
3. **Multi-lingua**: i18n (attualmente solo italiano)
4. **API pubbliche**: Documentazione OpenAPI per integrazioni terze

---

## APPENDICE A - Configurazione Ambiente di Sviluppo

### Variabili d'Ambiente Necessarie

**Backend (`backend/.env`):**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=powerleave
SECRET_KEY=<chiave-sicura-almeno-32-char>
```

**Frontend (`frontend/.env`):**
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Comandi Utili

```bash
# Riavvia servizi (solo in ambiente Emergent)
sudo supervisorctl restart backend
sudo supervisorctl restart frontend

# Log backend
tail -f /var/log/supervisor/backend.err.log

# MongoDB shell
mongosh powerleave

# Test backend
cd backend && pytest tests/ -v

# Verifica API
curl -s http://localhost:8001/api/health | python3 -m json.tool
```

---

*Documento generato il 18 Febbraio 2026*
*PowerLeave v1.0.0 - Audit Tecnico Completo*
