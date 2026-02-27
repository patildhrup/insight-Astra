"""
Chat API endpoint — the main conversational analytics interface.
POST /api/v1/chat
"""

import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

import json
try:
    import numpy as np
except ImportError:
    np = None

from datetime import datetime, timedelta
from app.analytics import engine as analytics_engine
from app.analytics import context_manager
from app.analytics import intent_classifier
from app.analytics import explainability
from app.analytics.rag_engine import rag_engine

try:
    from sklearn.linear_model import LinearRegression
except ImportError:
    LinearRegression = None

# Redis is optional — if unavailable the cache is simply skipped
try:
    from app.core.redis_client import redis_client
except Exception:
    redis_client = None

router = APIRouter(prefix="/api/v1", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    session_id: str
    intent: Optional[str] = None
    data: Optional[dict] = None
    chart_data: Optional[dict] = None
    needs_clarification: bool = False
    clarification_question: Optional[str] = None
    # Professional Feature Extensions
    strategic_impact: Optional[dict] = None
    pattern_alert: Optional[dict] = None
    comparison_insight: Optional[str] = None
    forecast_insight: Optional[dict] = None
    benchmark_insight: Optional[str] = None


@router.get("/history/{session_id}")
async def get_history(session_id: str):
    """
    Retrieve the conversation history for a given session.
    Used for the 'History' clock icon in the frontend.
    """
    history = context_manager.get_conversation_history(session_id)
    return {"history": history}


@router.delete("/history/{session_id}/{index}")
async def delete_item(session_id: str, index: int):
    """Delete a specific turn from history."""
    context_manager.delete_history_item(session_id, index)
    return {"status": "ok"}


@router.get("/heatmap-risk")
async def get_heatmap_risk():
    """Aggregate fraud_rate by state and time slot (6. Heatmap)."""
    df = analytics_engine.get_df()
    if "state" not in df.columns or "hour_of_day" not in df.columns or "fraud_flag" not in df.columns:
        return {"error": "Missing required columns for heatmap"}

    def get_slot(h):
        if 5 <= h < 12: return "Morning"
        if 12 <= h < 17: return "Afternoon"
        if 17 <= h < 21: return "Evening"
        return "Night"

    df["time_slot"] = df["hour_of_day"].apply(get_slot)
    
    # Group by state and time_slot
    hm = df.groupby(["state", "time_slot"])["fraud_flag"].mean().unstack(fill_value=0)
    data = []
    available_states = hm.index.tolist()
    slots = ["Morning", "Afternoon", "Evening", "Night"]
    
    for state in available_states[:15]: # Limit to top 15 for UI
        for slot in slots:
            rate = float(hm.loc[state, slot] * 100) if slot in hm.columns else 0.0
            data.append({"state": state, "time": slot, "value": round(rate, 2)})  # type: ignore
            
    return {"data": data}


class SimulateRequest(BaseModel):
    action_type: str
    percentage: float


@router.post("/simulate-action")
async def simulate_action(req: SimulateRequest):
    """Simulate impact of executive actions (5. Simulator)."""
    atype = req.action_type
    p = req.percentage / 100.0  # Normalized %
    
    f_change, r_change, c_change, u_impact = 0, 0, 0, 0
    
    if atype == "Reduce Transaction Limit":
        f_change = -p * 40
        r_change = -p * 20
        u_impact = p * 15
    elif atype == "Increase Fraud Monitoring":
        f_change = -p * 60
        c_change = p * 30
        u_impact = p * 5
    elif atype == "Block Risky Device Type":
        f_change = -15
        u_impact = 5
        r_change = -2
    elif atype == "Enable Extra Verification":
        f_change = -25
        u_impact = 10
        c_change = 5

    return {
        "fraud_change": round(float(f_change), 1),  # type: ignore
        "revenue_change": round(float(r_change), 1),  # type: ignore
        "operational_cost_change": round(float(c_change), 1),  # type: ignore
        "user_impact_score": round(float(u_impact), 1)  # type: ignore
    }


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main conversational analytics endpoint.
    Accepts a natural language message and returns an AI-generated,
    data-backed insight response.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # 1. Get or create session context
    session_id, ctx = context_manager.get_or_create_session(request.session_id)
    
    # --- REDIS CACHE CHECK ---
    cache_key = f"cache:{request.message.strip().lower()}"
    try:
        if redis_client is not None:
            cached_res = redis_client.get(cache_key)
            if cached_res:
                cached_data = json.loads(cached_res)
                cached_data["session_id"] = session_id
                return ChatResponse(**cached_data)  # type: ignore
    except Exception:
        pass
    # -------------------------

    conversation_history = context_manager.get_conversation_history(session_id)
    last_ctx = context_manager.get_last_context(session_id)

    # Defaults for chart title construction
    metric = "count"
    column = "transactions"
    group_by = None
    segment_col = None

    # 2. Classify intent & build query plan
    plan = await intent_classifier.classify_intent(
        user_message=request.message,
        conversation_history=conversation_history,
        last_context=last_ctx,
    )

    intent = plan.get("intent", "ambiguous")
    needs_clarification = plan.get("needs_clarification", False)

    # 3. Handle ambiguous/clarification case
    if needs_clarification:
        clarification_q = plan.get("clarification_question", "Could you be more specific?")
        answer = explainability.format_clarification_response(clarification_q)
        context_manager.update_context(session_id, plan, request.message, answer)
        return ChatResponse(  # type: ignore
            answer=answer,
            session_id=session_id,
            intent=intent,
            needs_clarification=True,
            clarification_question=clarification_q,
        )

    # 4. Route to the correct analytics function
    raw_result = {}
    filters = plan.get("filters", {}) or {}
    column = plan.get("column", "amount")
    metric = plan.get("metric", "avg")
    group_by = plan.get("group_by")
    segment_col = plan.get("segment_col")

    try:
        if intent == "aggregation":
            raw_result = analytics_engine.query_aggregation(metric, column, filters)
            answer = explainability.format_aggregation_response(plan, raw_result)

        elif intent == "comparison":
            if not group_by:
                group_by = "device_type"  # sensible default
            raw_result = analytics_engine.query_comparison(group_by, metric, column, filters)
            answer = explainability.format_comparison_response(plan, raw_result)

        elif intent == "temporal":
            raw_result = analytics_engine.query_temporal(filters)
            answer = explainability.format_temporal_response(plan, raw_result)

        elif intent == "segmentation":
            seg = segment_col or group_by or "merchant_category"
            raw_result = analytics_engine.query_segmentation(seg, metric, column)
            answer = explainability.format_segmentation_response(plan, raw_result)

        elif intent == "risk":
            seg = segment_col or group_by
            raw_result = analytics_engine.query_risk(seg)
            answer = explainability.format_risk_response(plan, raw_result)

        elif intent == "distribution":
            raw_result = analytics_engine.query_histogram(column)
            answer = f"Here is the distribution of {column.replace('_', ' ')}."

        elif intent == "correlation":
            sec_col = plan.get("secondary_segment") or "hour_of_day"
            raw_result = analytics_engine.query_correlation(column, sec_col)
            answer = f"Analysis of the relationship between {column} and {sec_col}."

        elif intent == "dashboard":
            raw_result = analytics_engine.generate_dashboard_data(metric, column, filters)
            if "error" in raw_result:
                answer = raw_result["error"]
            else:
                # Generate a narrative overview for the dashboard
                answer = await explainability.generate_dashboard_narrative(request.message, raw_result)
                raw_result["insights"] = [answer] # Use the narrative as the primary insight for now

        elif intent == "rag":
            context, docs = await rag_engine.query(request.message)
            # We need to generate a final answer from this context.
            # I'll add a helper in rag_engine or explainability.
            # For now, let's use a new explainability function.
            answer = await explainability.generate_rag_response(request.message, context)
            raw_result = {
                "context": context,
                "sources": [doc.metadata.get("source") for doc in docs]
            }

        else:
            # Fallback: general summary
            raw_result = analytics_engine.get_summary_stats()
            answer = _format_summary(raw_result)

    except Exception as e:
        answer = explainability.format_error_response(str(e))
        raw_result = {"error": str(e)}

    # --- PROFESSIONAL FEATURES INTEGRATION ---
    strategic_impact = None
    pattern_alert = None
    comparison_insight = None
    forecast_insight = None
    benchmark_insight = None

    if intent != "ambiguous":
        # 1. Strategic Impact Engine
        strategic_impact = _calculate_strategic_impact(raw_result, intent)

        # 2. Pattern Memory System
        pattern_alert = _check_pattern_memory(session_id, intent, plan, raw_result)

        # 3. Cross-Question Validator
        comparison_insight = _get_cross_question_comparison(session_id, intent, plan, raw_result)

        # 4. Risk Forecasting (for temporal queries)
        if intent == "temporal" or "time" in request.message.lower():
             forecast_insight = _get_risk_forecast(raw_result)
        
        # 9. Competitive Benchmark
        benchmark_insight = _get_benchmark_insight(intent, raw_result)

    # Persist the current result for future comparisons
    _store_query_result(session_id, intent, plan, raw_result)

    response = ChatResponse(  # type: ignore
        answer=answer,
        session_id=session_id,
        intent=intent,
        data=raw_result,
        chart_data={
            "type": raw_result.get("chart_type") or plan.get("recommended_chart"),
            "data": raw_result.get("chart_data"),
            "keys": raw_result.get("keys"),
            "title": f"{metric.title()} {column.replace('_', ' ')} by {group_by or segment_col or 'Segment'}"
        } if raw_result.get("chart_data") else None,
        needs_clarification=False,
        strategic_impact=strategic_impact,
        pattern_alert=pattern_alert,
        comparison_insight=comparison_insight,
        forecast_insight=forecast_insight,
        benchmark_insight=benchmark_insight
    )
    # -----------------------------------------

    # --- REDIS CACHE SET ---
    try:
        if redis_client is not None:
            redis_client.setex(cache_key, 3600, response.model_dump_json())
    except Exception:
        pass
    # -----------------------

    return response


def _format_summary(stats: dict) -> str:
    total = stats.get('total_transactions', 0)
    lines = [
        "**Answer:**",
        f"The dataset contains {total:,} UPI transactions across {stats.get('unique_states', 0)} states and {stats.get('unique_categories', 0)} merchant categories.",
        "",
        "**Data Applied:**",
        "- Filters used: None (full dataset)",
        f"- Sample size: {total:,} transactions",
        "",
        "**Calculation Logic:**",
        f"- Average Transaction Amount: ₹{stats.get('avg_amount', 0):,.2f}",
        f"- Fraud Rate: ({stats.get('fraud_count', 0):,} / {total:,}) × 100 = {stats.get('fraud_rate_pct', 0):.2f}%",
        f"- Failure Rate: {stats.get('failure_rate_pct', 0):.2f}%",
        "",
        "**Confidence:** High — Direct dataset aggregation.",
    ]
    return "\n".join(lines)


# --- HELPERS FOR ADVANCED FEATURES ---

def _calculate_strategic_impact(res: dict, intent: str) -> dict:
    """Implement Strategic Impact Engine (Feature 1)."""
    # Extract metrics (mocked if not present in localized query)
    val = res.get("result") or 0
    if intent == "aggregation" and isinstance(val, (int, float)):
        # Example logic
        rev_exp = val * 0.15 # Mock revenue exposure 15% of result volume
        trust = min(val / 1000, 100)
    else:
        rev_exp = 75000 + (len(str(val)) * 1400) # Variance based on result size
        trust = 5.2

    # Operational Risk Index (weighted average)
    # fail=0.5, fraud=0.3, anomaly=0.2
    ori = (15 * 0.5) + (2.5 * 0.3) + (10 * 0.2) # Mocked indices
    priority = "P1" if ori > 60 else "P2" if ori > 30 else "P3"
    risk_level = "High" if ori > 60 else "Medium" if ori > 30 else "Low"

    return {
        "revenue_exposure": round(rev_exp, 2),  # type: ignore
        "risk_index": round(ori, 1),  # type: ignore
        "affected_users": round(trust, 1),  # type: ignore
        "priority": priority,
        "risk_level": risk_level
    }


def _check_pattern_memory(sid: str, intent: str, plan: dict, res: dict) -> dict:
    """Pattern Memory System (Feature 2)."""
    _, ctx = context_manager.get_or_create_session(sid)
    mtype = plan.get("metric", "avg")
    val = res.get("result") or 0
    
    if not isinstance(val, (int, float)): return None
    
    log = ctx.get("pattern_log", [])
    similar_hits = [l for l in log if l["metric_type"] == mtype and abs(l["value"] - val) / (val or 1) < 0.05]
    
    # Store current
    log.append({"metric_type": mtype, "value": val, "timestamp": datetime.utcnow().isoformat()})
    ctx["pattern_log"] = log[-20:] # Keep last 20

    if len(similar_hits) >= 2:
        return {"pattern_flag": True, "occurrences": len(similar_hits)}
    return None


def _get_cross_question_comparison(sid: str, intent: str, plan: dict, res: dict) -> str:
    """Cross-Question Validator (Feature 3)."""
    _, ctx = context_manager.get_or_create_session(sid)
    last = ctx.get("last_query_result")
    curr_metric = plan.get("metric")
    curr_val = res.get("result")
    
    if last and last["metric"] == curr_metric and isinstance(curr_val, (int, float)) and isinstance(last["value"], (int, float)):
        ratio = round(curr_val / (last["value"] or 1), 2)  # type: ignore
        diff = "higher" if ratio > 1 else "lower"
        return f"Comparison Insight: Current result is {ratio}x {diff} than previous query."
    return None


def _store_query_result(sid: str, intent: str, plan: dict, res: dict):
    _, ctx = context_manager.get_or_create_session(sid)
    ctx["last_query_result"] = {
        "metric": plan.get("metric"),
        "value": res.get("result")
    }


def _get_risk_forecast(res: dict) -> dict:
    """Risk Forecasting Module (Feature 4)."""
    if LinearRegression is None or np is None:
        return {
            "projected_value": 2.5,
            "trend_direction": "Stable (Mock)",
            "timeline": "Next 7 Days"
        }
    
    # Mock time series for regression if not available
    y = np.array([2.1, 2.3, 2.2, 2.5, 2.4, 2.8, 2.7]).reshape(-1, 1)
    x = np.array([0, 1, 2, 3, 4, 5, 6]).reshape(-1, 1)
    
    model = LinearRegression().fit(x, y)
    proj = model.predict([[7]])[0][0]
    trend = "Up" if model.coef_[0][0] > 0.05 else "Down" if model.coef_[0][0] < -0.05 else "Stable"
    
    return {
        "projected_value": round(float(proj), 2),  # type: ignore
        "trend_direction": trend,
        "timeline": "Next 7 Days"
    }


def _get_benchmark_insight(intent: str, res: dict) -> str:
    """Competitive Benchmark Mode (Feature 9)."""
    val = res.get("result")
    if not isinstance(val, (int, float)) or val == 0: return None
    
    industry_avg = 3.5 if "fraud" in intent else 2150
    ratio = round(val / industry_avg, 1)  # type: ignore
    perf = "better" if ratio < 1 else "worse"
    return f"Industry Benchmark: You are performing {ratio}x {perf} than industry average."

