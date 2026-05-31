from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import logging
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse


load_dotenv()

app = FastAPI(title="datalk API Gateway")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Query Engine Service URL
QUERY_ENGINE_URL = "http://localhost:8001"

# Create limiter — tracks by IP address
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# Handle rate limit errors cleanly
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please wait before sending another query."}
    )

# Models
class QueryRequest(BaseModel):
    user_question: str

class QueryResponse(BaseModel):
    sql: str
    results: list
    error: str | None = None

# Routes
@app.get("/")
def health():
    return {"status": "API Gateway running"}

@app.post("/api/query")
@limiter.limit("10/minute")
async def query(request: Request, body: QueryRequest):
    """
    Route query request to Query Engine Service
    """
    try:
        logger.info(f"Query request: {body.user_question}")
        
        # Call Query Engine Service
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{QUERY_ENGINE_URL}/query",
                json={"user_question": body.user_question},
                timeout=60.0
            )
            
            if response.status_code != 200:
                logger.error(f"Query Engine error: {response.text}")               
                return QueryResponse(
                    sql="",
                    results=[],
                    error=f"Query Engine error: {response.text}"
                )
            
            data = response.json()
            return QueryResponse(**data)
    
    except httpx.TimeoutException:
        logger.error("Query Engine timeout")
        return QueryResponse(
            sql="",
            results=[],
            error="Query Engine timeout"
        )
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health_check():
    """Check gateway and Query Engine health"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{QUERY_ENGINE_URL}/health",
                timeout=5.0
            )
            
            if response.status_code == 200:
                engine_status = response.json()
                return {
                    "gateway": "healthy",
                    "query_engine": engine_status
                }
    except httpx.RequestError:
        pass
    
    return {
        "gateway": "healthy",
        "query_engine": "unavailable"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)