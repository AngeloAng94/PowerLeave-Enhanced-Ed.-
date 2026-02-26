# PowerLeave

**Gestione ferie e permessi per team moderni**

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0-47A248?logo=mongodb)

---

## Descrizione

PowerLeave è un sistema completo per la gestione delle ferie, permessi e assenze aziendali. Offre una dashboard intuitiva, approvazioni rapide, analytics avanzate e supporto multi-tenant per organizzazioni di qualsiasi dimensione.

---

## Stack Tecnologico

| Layer | Tecnologia | Versione |
|-------|------------|----------|
| Backend | FastAPI (Python) | 3.11 |
| Database | MongoDB | 6.0 |
| Frontend | React | 18.x |
| Autenticazione | JWT | - |
| Styling | Tailwind CSS | 3.x |
| CI/CD | GitHub Actions | - |

---

## Funzionalità Principali

- **Richieste Ferie**: Creazione e gestione richieste con validazione date
- **Approvazioni**: Workflow di approvazione/rifiuto per manager
- **Saldi Ferie**: Tracking automatico dei giorni disponibili/usati
- **Calendario**: Visualizzazione mensile delle assenze del team
- **Chiusure Aziendali**: Gestione festività e chiusure con sistema deroghe
- **Bacheca Annunci**: Comunicazioni interne per il team
- **Analytics**: Dashboard con statistiche e trend
- **Multi-tenant**: Supporto per più organizzazioni
- **Dark/Light Mode**: Tema personalizzabile

---

## Struttura del Progetto

```
powerleave/
├── backend/
│   ├── server.py          # Entry point FastAPI
│   ├── config.py          # Configurazione
│   ├── models.py          # Modelli Pydantic
│   ├── auth.py            # Autenticazione JWT
│   ├── database.py        # Connessione MongoDB
│   ├── seed.py            # Dati demo
│   ├── routes/            # API endpoints
│   │   ├── auth.py
│   │   ├── leave.py
│   │   ├── team.py
│   │   └── ...
│   ├── tests/             # Test suite
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── pages/         # Componenti pagina
│   │   ├── components/    # Componenti riutilizzabili
│   │   └── context/       # React Context
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Come Avviare in Locale

### Con Docker (Consigliato)

**Prerequisiti**: Docker e Docker Compose installati

```bash
# Clona il repository
git clone https://github.com/your-repo/powerleave.git
cd powerleave

# Copia e configura le variabili d'ambiente
cp .env.example .env
# Modifica .env con le tue configurazioni (soprattutto SECRET_KEY)

# Avvia tutti i servizi
docker-compose up --build

# L'applicazione sarà disponibile su:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8001
# API Docs: http://localhost:8001/docs
```

### Senza Docker

**Prerequisiti**: Python 3.11+, Node.js 18+, MongoDB 6.0+

#### Backend

```bash
cd backend

# Crea ambiente virtuale
python -m venv venv
source venv/bin/activate  # Linux/Mac
# oppure: venv\Scripts\activate  # Windows

# Installa dipendenze
pip install -r requirements.txt

# Configura variabili d'ambiente
export MONGO_URL="mongodb://localhost:27017"
export DB_NAME="powerleave"
export SECRET_KEY="your-secret-key-min-32-chars"

# Avvia il server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

#### Frontend

```bash
cd frontend

# Installa dipendenze
yarn install

# Configura variabili d'ambiente
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env

# Avvia in development
yarn start
```

---

## Credenziali Demo

Al primo avvio vengono creati automaticamente degli utenti demo:

| Email | Password | Ruolo |
|-------|----------|-------|
| admin@demo.it | demo123 | Admin |
| mario@demo.it | demo123 | User |
| anna@demo.it | demo123 | User |
| luigi@demo.it | demo123 | User |

---

## Testing

```bash
cd backend

# Esegui tutti i test
pytest tests/test_powerleave_api.py -v

# Esegui test con coverage
pytest tests/ --cov=. --cov-report=html
```

---

## Documentazione API

La documentazione OpenAPI è disponibile su:
- **Swagger UI**: `http://localhost:8001/docs`
- **ReDoc**: `http://localhost:8001/redoc`

---

## Documentazione Tecnica

Per dettagli sull'architettura, debito tecnico e roadmap di sviluppo, consulta:
- [`AUDIT_TECNICO_POWERLEAVE_v2.md`](./AUDIT_TECNICO_POWERLEAVE_v2.md)

---

## License

MIT License - vedi [LICENSE](./LICENSE) per dettagli.

---

**Powered by [Anthera](https://antherasystems.com) — Empowering Intelligent Systems**
