from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.db import init_db
from app.apis.auth import auth_router
import time

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application starting..., Initialising DB")
    start = time.time()
    print(f"Start time: {start}")
    # Initialize:
    await init_db()
    print(f"DB Initialised at: {time.time()}")
    print(f"Server Started in: {time.time() -  start}")
    yield
    
    # Close:
    # - complete all requests
    # - Database connections
    print("Application shutting down...")



app = FastAPI(
    title="Post Writing Agent API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)

@app.get("/health")
async def health():
    return {"status": "ok"}