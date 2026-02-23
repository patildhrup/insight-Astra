from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.auth import get_current_user

app = FastAPI(title="AI Fraud Shield Backend")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "AI Fraud Shield API is running"}

@app.get("/api/v1/user/profile")
async def read_profile(current_user: dict = Depends(get_current_user)):
    return {
        "user_id": current_user["id"],
        "email": current_user["email"],
        "status": "active",
        "role": "admin"
    }

@app.get("/api/v1/fraud/stats")
async def get_fraud_stats(current_user: dict = Depends(get_current_user)):
    # Mock data for demonstration
    return {
        "accuracy": 99.8,
        "threats_blocked": 1284,
        "avg_risk_score": 12.5
    }
