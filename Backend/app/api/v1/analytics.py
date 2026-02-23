"""
Analytics summary endpoint — returns live KPI cards from the real UPI CSV.
GET /api/v1/analytics/summary
"""

from fastapi import APIRouter
from app.analytics import engine as analytics_engine

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


@router.get("/summary")
async def get_analytics_summary():
    """
    Returns overall KPI statistics computed from the UPI transactions dataset.
    Used by the Dashboard for live stat cards.
    """
    stats = analytics_engine.get_summary_stats()
    return {
        "success": True,
        "data": stats,
    }


@router.get("/categories")
async def get_category_breakdown():
    """Returns average amount and fraud rate per merchant category."""
    result = analytics_engine.query_comparison("merchant_category", "avg", "amount", {})
    fraud_result = analytics_engine.query_segmentation("merchant_category", "rate", "fraud_flag")
    return {
        "success": True,
        "avg_amount_by_category": result.get("results", []),
        "fraud_rate_by_category": fraud_result.get("results", []),
    }


@router.get("/devices")
async def get_device_breakdown():
    """Returns comparison of transaction metrics across device types."""
    amount_result = analytics_engine.query_comparison("device_type", "avg", "amount", {})
    fraud_result = analytics_engine.query_comparison("device_type", "rate", "fraud_flag", {})
    return {
        "success": True,
        "avg_amount_by_device": amount_result.get("results", []),
        "fraud_rate_by_device": fraud_result.get("results", []),
    }


@router.get("/peak-hours")
async def get_peak_hours():
    """Returns peak hour distribution across all transactions."""
    result = analytics_engine.query_temporal({})
    return {
        "success": True,
        "data": result,
    }
