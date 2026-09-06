from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.db import init_db
from app.core.settings import settings
from app.core.logger import logger
from app.apis.auth import auth_router
from app.apis.products import product_router
from app.apis.warehouse import warehouse_router
from app.apis.warehouse_stock import warehouse_stock_router
from app.apis.discount_rules import discount_router
from app.apis.subscriptions import sub_router
from app.apis.quotation import quotation_router
import time


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application starting..., Initialising DB")
    start = time.time()
    logger.info(f"Start time: {start}")
    # Initialize:
    await init_db()
    logger.info(f"DB Initialised at: {time.time()}")
    logger.info(f"Server Started in: {time.time() -  start:.4f}s")
    yield
    
    # Close:
    # - complete all requests
    # - Database connections
    logger.info("Application shutting down...")



app = FastAPI(
    title="Post Writing Agent API",
    version="1.0.0",
    lifespan=lifespan
)

origins = [
    "http://192.168.9.182:5173",
    "http://192.168.9.182:5173/",
    settings.FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    logger.info(f"{request.method} {request.url.path} - Status: {response.status_code} - Completed in {process_time:.2f}ms")
    return response


app.include_router(auth_router)
app.include_router(product_router)
app.include_router(warehouse_router)
app.include_router(warehouse_stock_router)
app.include_router(discount_router)
app.include_router(sub_router)
app.include_router(quotation_router)




@app.get("/health")
async def health():
    return {"status": "ok"}