import os
from contextlib import asynccontextmanager


from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# Import routers
from app.api.v1.chat import router as chat_router
from app.api.v1.analytics import router as analytics_router

# Import analytics engine for pre-loading
from app.analytics import engine as analytics_engine

    
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the UPI dataset once at startup so all requests share the same DataFrame."""
    print("\n" + "="*50)
    print("[INIT] InsightX UPI Analytics AI Starting up...")
    print("[INFO] Loading UPI transactions dataset from CSV...")
    try:
        df = analytics_engine.load_data()
        print(f"[SUCCESS] Dataset loaded: {len(df):,} transactions")
        
        # Pre-calculate summary stats to fill the cache during startup
        print("[INFO] Pre-calculating dashboard summary stats...")
        analytics_engine.get_summary_stats()
        print("[SUCCESS] Summary stats cached.")
        
        print(f"[INFO] Backend Engine: Synchronous Threadpool Mode Enabled")
        print("="*50 + "\n")
    except Exception as e:
        print(f"[ERROR] Critical failure during dataset loading: {e}")
        import traceback
        traceback.print_exc()
    yield
    print("[STOP] Shutting down InsightX Backend...")


app = FastAPI(
    title="InsightX — UPI Analytics AI",
    description="Conversational Analytics Engine for UPI Transactions",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
cors_origins = os.getenv("CORS_ORIGINS", "https://astra-y4o7.onrender.com").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(chat_router)
app.include_router(analytics_router)


# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "InsightX UPI Analytics API is running [ONLINE]"}


@app.get("/health")
async def health():
    df = analytics_engine.get_df()
    return {
        "status": "healthy",
        "dataset_loaded": df is not None,
        "total_records": len(df) if df is not None else 0,
    }


