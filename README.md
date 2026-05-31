# datalk-backend

A modular FastAPI-based backend system with a gateway layer and LLM-powered query engine.

## Project Structure

```
datalk-backend/
├── gateway/                    # API Gateway - routes requests to Query Engine
│   ├── venv/                   # Virtual environment
│   ├── main.py                 # Gateway FastAPI application
│   └── requirements.txt        # Gateway dependencies
│
├── query-engine/               # Query Engine - generates and executes SQL
│   ├── venv/                   # Virtual environment
│   ├── main.py                 # Query Engine FastAPI application
│   ├── langchain_chain.py      # LLM SQL generation using LangChain
│   ├── validators.py           # SQL safety and validation
│   ├── db_executor.py          # Database execution layer
│   └── requirements.txt        # Query Engine dependencies
│
└── .env                        # Shared environment variables
```

## Setup Instructions

### 1. Create Virtual Environments

```bash
# Gateway venv
cd gateway
python -m venv venv
.\venv\Scripts\Activate.ps1  # On Windows
source venv/bin/activate      # On macOS/Linux
pip install -r requirements.txt

# Query Engine venv (in separate terminal)
cd query-engine
python -m venv venv
.\venv\Scripts\Activate.ps1   # On Windows
source venv/bin/activate      # On macOS/Linux
pip install -r requirements.txt
```

### 2. Configure Environment

Edit `.env` and add your configuration:

```bash
DATABASE_URL=your-database-url
OPENAI_API_KEY=your-openai-key
```

### 3. Run Services

**Terminal 1 - Gateway (Port 8000):**

```bash
cd gateway
.\venv\Scripts\Activate.ps1
python main.py
```

**Terminal 2 - Query Engine (Port 8001):**

```bash
cd query-engine
.\venv\Scripts\Activate.ps1
python main.py
```

## API Endpoints

### Gateway (Port 8000)

- `GET /` - Health check
- `POST /api/query` - Submit user question
- `GET /api/health` - Check gateway and query engine status

### Query Engine (Port 8001)

- `GET /` - Health check
- `POST /query` - Process query internally
- `GET /health` - Health status

## How It Works

1. **User Request** → Gateway receives natural language question
2. **Forward** → Gateway forwards to Query Engine
3. **Generate SQL** → Query Engine uses LangChain + LLM to convert question to SQL
4. **Validate** → SQL is validated for safety
5. **Execute** → Query runs against database
6. **Return** → Results returned through gateway to user

## File Descriptions

| File                   | Purpose                                                  |
| ---------------------- | -------------------------------------------------------- |
| `gateway/main.py`      | Routes requests to query engine, handles CORS            |
| `query-engine/main.py` | FastAPI app that orchestrates SQL generation & execution |
| `langchain_chain.py`   | Uses LLM to convert natural language → SQL               |
| `validators.py`        | Ensures SQL is safe (no DROP, DELETE, injections)        |
| `db_executor.py`       | Executes validated SQL against database                  |
| `.env`                 | Configuration (API keys, database URL, etc.)             |

## Requirements

- Python 3.9+
- FastAPI
- LangChain
- OpenAI API Key
- SQLAlchemy (database support)
