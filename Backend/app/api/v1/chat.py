"""
Chat API endpoint — the main conversational analytics interface.
POST /api/v1/chat
"""

import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

import json
from app.analytics import engine as analytics_engine
from app.analytics import context_manager
from app.analytics import intent_classifier
from app.analytics import explainability
from app.analytics.rag_engine import rag_engine

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
        cached_res = redis_client.get(cache_key)
        if cached_res:
            cached_data = json.loads(cached_res)
            # Ensure session_id matches the current one
            cached_data["session_id"] = session_id
            return ChatResponse(**cached_data)
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
        return ChatResponse(
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

    # 5. Persist context
    context_manager.update_context(session_id, plan, request.message, answer)

    response = ChatResponse(
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
    )

    # --- REDIS CACHE SET ---
    try:
        redis_client.setex(cache_key, 3600, response.model_dump_json())
    except Exception:
        pass
    # -----------------------

    return response


def _format_summary(stats: dict) -> str:
    lines = [
        "📊 **UPI Transaction Summary:**\n",
        f"• **Total Transactions:** {stats.get('total_transactions', 0):,}",
        f"• **Average Amount:** ₹{stats.get('avg_amount', 0):,.2f}",
        f"• **Fraud Rate:** {stats.get('fraud_rate_pct', 0):.2f}%",
        f"• **Failure Rate:** {stats.get('failure_rate_pct', 0):.2f}%",
        f"• **Merchant Categories:** {stats.get('unique_categories', 0)}",
        f"• **States Covered:** {stats.get('unique_states', 0)}",
    ]
    return "\n".join(lines)
