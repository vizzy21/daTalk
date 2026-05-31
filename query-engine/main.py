"""
Query Engine - Main entry point
Wires LangChain, Validator, and Executor together
"""

# FastAPI is the web framework - like Spring Boot but Python
# HTTPException is how we return error responses with status codes
from fastapi import FastAPI, HTTPException

# CORSMiddleware allows React frontend to call this API
# Without this, browser blocks all requests (same-origin policy)
from fastapi.middleware.cors import CORSMiddleware

# BaseModel is like a TypeScript interface - defines shape of JSON data
from pydantic import BaseModel

# Loads variables from .env file into os.environ
from dotenv import load_dotenv

import logging
import os

# Must run BEFORE importing langchain_chain
# because langchain_chain needs GOOGLE_API_KEY the moment it's imported
load_dotenv()

# Our three modules - the pipeline
from langchain_chain import generate_sql   # natural language → SQL
from validators import validate_sql        # SQL → safe or not
from db_executor import execute_query      # SQL → actual results

# Create the FastAPI app - like Spring's @SpringBootApplication
app = FastAPI(title="datalk Query Engine")

# Set up logging - INFO level means we see info, warning, error logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Allow all origins (*) in dev - lock this down in production
# allow_credentials - allow cookies/auth headers
# allow_methods - allow GET, POST, PUT etc
# allow_headers - allow Content-Type, Authorization etc
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Defines shape of incoming POST request body
# FastAPI auto-maps {"user_question": "..."} to this class
class QueryRequest(BaseModel):
    user_question: str

# Defines shape of response we send back
# error: str = None means error is optional, defaults to None
class QueryResponse(BaseModel):
    sql: str        # the generated SQL
    results: list   # rows returned from DB
    error: str | None = None  # ← str OR None

# GET / → basic health check
# @app.get is a decorator - like @GetMapping("/") in Spring
@app.get("/")
def health():
    return {"status": "Query Engine running"}

# GET /health → detailed health check
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "query-engine"
    }

# POST /query → main endpoint, the entire pipeline lives here
# async def → this function can handle multiple requests without blocking
# request: QueryRequest → FastAPI auto-parses incoming JSON into this object
@app.post("/query")
async def query(request: QueryRequest):
    try:
        logger.info(f"Processing query: {request.user_question}")

        # STEP 1 - LangChain + Gemini converts question to SQL
        sql = generate_sql(request.user_question)
        logger.info(f"Generated SQL: {sql}")

        # STEP 2 - Validate the SQL before touching the DB
        # If invalid, return 400 Bad Request immediately
        if not validate_sql(sql):
            raise HTTPException(
                status_code=400,
                detail="Generated SQL failed validation"
            )

        # STEP 3 - Execute the safe SQL against the database dbexecutor file
        results = execute_query(sql)
        logger.info(f"Query results: {results}")  

        # Return structured response
        return QueryResponse(
            sql=sql,
            results=results,
            error=None
        )

    # Re-raise HTTPException as-is so FastAPI handles it correctly
    # If we don't do this, it falls into the general Exception block below
    # and gets wrapped as a 500 error instead of the original 400
    except HTTPException:
        raise

    # Catch everything else - unexpected errors
    # Return 500 Internal Server Error with the error message
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Only runs when you execute: python main.py
# Does NOT run when another file imports this module
if __name__ == "__main__":
    import uvicorn
    # host="0.0.0.0" → accessible from any network interface
    # port=8001 → query engine runs here, gateway runs on 8000
    uvicorn.run(app, host="0.0.0.0", port=8001)