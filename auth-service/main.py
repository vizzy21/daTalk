from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
import sqlite3
from fastapi.middleware.cors import CORSMiddleware

from models import UserCreate, Token
from auth import get_password_hash, verify_password, create_access_token

app = FastAPI(title="DaTalk Auth Service")
DB_FILE = "auth.db"

# --- NEW CORS CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # CHANGED: Allow any frontend port to talk to this backend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# -----------


# Dependency to get raw DB connection
def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # Lets us access columns by name (e.g., row['username'])
    try:
        yield conn
    finally:
        conn.close()

# Initialize our raw SQL table (Runs once on startup)
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.post("/register", response_model=Token)
def register(user: UserCreate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    
    # 1. Check if user already exists
    cursor.execute("SELECT username FROM users WHERE username = ?", (user.username,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Username already registered")

    # 2. Hash password and insert
    hashed_password = get_password_hash(user.password)
    try:
        cursor.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            (user.username, hashed_password)
        )
        db.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Database error during registration")

    # 3. Auto-login the user by returning a token immediately
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    
    # 1. Fetch user by username
    cursor.execute("SELECT username, password_hash FROM users WHERE username = ?", (form_data.username,))
    user_row = cursor.fetchone()

    # 2. Verify existence and password
    if not user_row or not verify_password(form_data.password, user_row['password_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Generate token
    access_token = create_access_token(data={"sub": user_row['username']})
    return {"access_token": access_token, "token_type": "bearer"}