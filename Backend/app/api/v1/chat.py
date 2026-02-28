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
    suggestions: Optional[list[str]] = None
    multi_charts: Optional[list[dict]] = None


class BusinessAdvisorRequest(BaseModel):
    query: str

class BusinessAdvisorResponse(BaseModel):
    analysis_summary: str
    strategies: list[dict]
    chart_projection: dict

@router.get("/benchmark")
async def get_benchmark():
    try:
        data = analytics_engine.get_benchmark_comparison()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/business-advisor")
async def business_advisor(request: BusinessAdvisorRequest):
    try:
        metrics = analytics_engine.get_business_metrics_summary()
        response_json = await explainability.generate_business_strategy(request.query, metrics)
        return response_json
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
    # 4. Route to the correct analytics function
    # Refactored to support multiple charts if requested
    requested_charts = plan.get("recommended_charts") or [plan.get("recommended_chart") or "bar"]
    multi_charts = []
    primary_result = None

    async def get_result_for_type(ctype):
        filters = plan.get("filters", {}) or {}
        column = plan.get("column", "amount")
        metric = plan.get("metric", "avg")
        group_by = plan.get("group_by")
        segment_col = plan.get("segment_col")
        
        raw_res = {}
        # Map chart type back to intent if we are doing multi-chart
        # This is a bit of a heuristic to allow "show bar and line"
        local_intent = intent
        if ctype == "histogram": local_intent = "distribution"
        elif ctype == "scatter": local_intent = "correlation"
        elif ctype == "area" or ctype == "line": local_intent = "temporal"
        elif ctype == "pie" or ctype == "donut": local_intent = "segmentation"
        elif ctype == "stacked_bar" or ctype == "grouped_bar": local_intent = "multi_segmentation"

        if local_intent == "aggregation":
            raw_res = analytics_engine.query_aggregation(metric, column, filters)
        elif local_intent == "comparison":
            raw_res = analytics_engine.query_comparison(group_by or "device_type", metric, column, filters)
        elif local_intent == "temporal":
            raw_res = analytics_engine.query_temporal(filters)
        elif local_intent == "segmentation":
            raw_res = analytics_engine.query_segmentation(segment_col or group_by or "merchant_category", metric, column)
        elif local_intent == "risk":
            raw_res = analytics_engine.query_risk(segment_col or group_by)
        elif local_intent == "distribution":
            raw_res = analytics_engine.query_histogram(column)
        elif local_intent == "correlation":
            raw_res = analytics_engine.query_correlation(column, plan.get("secondary_segment") or "hour_of_day")
        elif local_intent == "multi_segmentation":
            raw_res = analytics_engine.query_multi_segmentation(plan.get("segment_col") or "state", plan.get("secondary_segment") or "device_type", metric, column)
        elif local_intent == "dashboard":
            raw_res = analytics_engine.generate_dashboard_data(metric, column, filters)
        
        chart_obj = None
        if raw_res.get("chart_data"):
            chart_obj = {
                "type": ctype,
                "data": raw_res.get("chart_data"),
                "keys": raw_res.get("keys"),
                "title": raw_res.get("title") or f"{metric.title()} {column.replace('_', ' ')} breakdown"
            }
        return raw_res, chart_obj

    try:
        # Generate all requested charts
        for i, cvt in enumerate(requested_charts):
            res_data, chart_data = await get_result_for_type(cvt)
            if i == 0:
                primary_result = res_data
            if chart_data:
                multi_charts.append(chart_data)
        
        # Determine the textual answer using the primary result
        if intent == "aggregation":
            answer = explainability.format_aggregation_response(plan, primary_result)
        elif intent == "comparison":
            answer = explainability.format_comparison_response(plan, primary_result)
        elif intent == "temporal":
            answer = explainability.format_temporal_response(plan, primary_result)
        elif intent == "segmentation":
            answer = explainability.format_segmentation_response(plan, primary_result)
        elif intent == "risk":
            answer = explainability.format_risk_response(plan, primary_result)
        elif intent == "distribution":
            answer = explainability.format_distribution_response(plan, primary_result)
        elif intent == "correlation":
            answer = explainability.format_correlation_response(plan, primary_result)
        elif intent == "multi_segmentation":
            answer = explainability.format_multi_segmentation_response(plan, primary_result)
        elif intent == "dashboard":
            if "error" in primary_result:
                answer = primary_result["error"]
            else:
                answer = await explainability.generate_dashboard_narrative(request.message, primary_result)
        elif intent == "rag":
            context, docs = await rag_engine.query(request.message)
            answer = await explainability.generate_rag_response(request.message, context)
            primary_result = {"context": context, "sources": [doc.metadata.get("source") for doc in docs]}
        else:
            primary_result = analytics_engine.get_summary_stats()
            answer = _format_summary(primary_result)

    except Exception as e:
        answer = explainability.format_error_response(str(e))
        primary_result = {"error": str(e)}

    # --- PROFESSIONAL FEATURES INTEGRATION ---
    strategic_impact = None
    pattern_alert = None
    comparison_insight = None
    forecast_insight = None
    benchmark_insight = None

    if intent != "ambiguous":
        # 1. Strategic Impact Engine
        strategic_impact = _calculate_strategic_impact(primary_result, intent)
        # 2. Pattern Memory System
        pattern_alert = _check_pattern_memory(session_id, intent, plan, primary_result)
        # 3. Cross-Question Validator
        comparison_insight = _get_cross_question_comparison(session_id, intent, plan, primary_result)
        # 4. Risk Forecasting (for temporal queries)
        if intent == "temporal" or "time" in request.message.lower():
             forecast_insight = _get_risk_forecast(primary_result)
        # 9. Competitive Benchmark
        benchmark_insight = _get_benchmark_insight(intent, primary_result)

    # Persist the current result for future comparisons
    _store_query_result(session_id, intent, plan, primary_result)

    response = ChatResponse(  # type: ignore
        answer=answer,
        session_id=session_id,
        intent=intent,
        data=primary_result,
        chart_data=multi_charts[0] if multi_charts else None,
        multi_charts=multi_charts if len(multi_charts) > 1 else None,
        needs_clarification=False,
        strategic_impact=strategic_impact,
        pattern_alert=pattern_alert,
        comparison_insight=comparison_insight,
        forecast_insight=forecast_insight,
        benchmark_insight=benchmark_insight,
        suggestions=explainability.generate_recommendations(plan, primary_result)
    )
    # -----------------------------------------

    # -----------------------------------------
    # Update context with the latest turn (including rich response data)
    context_manager.update_context(session_id, plan, request.message, answer, response.dict())
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

