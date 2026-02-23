"""
Chat API endpoint — the main conversational analytics interface.
POST /api/v1/chat
"""

import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.analytics import engine as analytics_engine
from app.analytics import context_manager
from app.analytics import intent_classifier
from app.analytics import explainability

router = APIRouter(prefix="/api/v1", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    session_id: str
    intent: Optional[str] = None
    data: Optional[dict] = None
    needs_clarification: bool = False
    clarification_question: Optional[str] = None


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
    conversation_history = context_manager.get_conversation_history(session_id)
    last_ctx = context_manager.get_last_context(session_id)

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

        else:
            # Fallback: general summary
            raw_result = analytics_engine.get_summary_stats()
            answer = _format_summary(raw_result)

    except Exception as e:
        answer = explainability.format_error_response(str(e))
        raw_result = {"error": str(e)}

    # 5. Persist context
    context_manager.update_context(session_id, plan, request.message, answer)

    return ChatResponse(
        answer=answer,
        session_id=session_id,
        intent=intent,
        data=raw_result,
        needs_clarification=False,
    )


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
