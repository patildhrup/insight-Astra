"""
Intent Classifier — translates natural language questions into structured QueryPlan objects.
Uses OpenRouter API with a few-shot system prompt.
"""

import os
import json
import re
import httpx
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

from app.core.llm import call_llm

# ── System Prompt ──────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an AI Query Planner for a UPI Transactions Analytics system.
Your job is to parse the user's business question into a structured JSON QueryPlan.

## Dataset Columns Available:
- amount (float): transaction amount in INR
- merchant_category (str): Food, Entertainment, Grocery, Fuel, Travel, Shopping, Healthcare, Education, Utilities, etc.
- device_type (str): Android, iOS, Web
- network_type (str): 5G, 4G, 3G, WiFi
- state (str): Indian states
- age_group (str): 18-25, 26-35, 36-45, 46-60, 60+
- hour_of_day (int): 0-23
- day_of_week (str): Monday-Sunday
- is_weekend (bool)
- fraud_flag (int): 1 = fraud, 0 = legit
- status (str): SUCCESS, FAILED, PENDING

## Intent Types:
- aggregation: single metric (avg/sum/count/rate) with optional filters
- comparison: compare a metric across groups (group_by)
- temporal: peak hours, day-of-week analysis
- segmentation: breakdown by age_group, state, merchant_category, etc.
- risk: fraud rate, failure rate analysis
- distribution: frequency breakdown of a numeric column (histogram)
- correlation: relationship between two numeric columns (scatter)
- multi_segmentation: breakdown by two dimensions (e.g., state AND category) for stacked/grouped charts
- dashboard: create a full report/dashboard with multiple charts, KPIs, and insights for a timeframe or topic.
- rag: general or complex questions about transaction patterns, specific queries that don't fit analytics, or conversational questions about the data.
- ambiguous: unclear question, needs clarification

## Recommended Charts:
bar, line, pie, donut, area, stacked_bar, grouped_bar, histogram, scatter, gauge, heatmap

## Output Format (JSON only, no markdown):
{
  "intent": "aggregation|comparison|temporal|segmentation|risk|distribution|correlation|multi_segmentation|dashboard|rag|ambiguous",
  "metric": "avg|sum|count|rate",
  "column": "amount|fraud_flag",
  "filters": {"merchant_category": "Food"},
  "group_by": null,
  "segment_col": null,
  "secondary_segment": null,
  "recommended_chart": "bar|line|pie|...",
  "needs_clarification": false,
  "clarification_question": null,
  "context_used": false
}

## Few-shot Examples:

Q: "Amount distribution"
A: {"intent":"distribution","metric":"count","column":"amount","filters":{},"group_by":null,"segment_col":null,"recommended_chart":"histogram","needs_clarification":false,"clarification_question":null,"context_used":false}

Q: "Fraud by state and device type"
A: {"intent":"multi_segmentation","metric":"rate","column":"fraud_flag","filters":{},"group_by":null,"segment_col":"state","secondary_segment":"device_type","recommended_chart":"stacked_bar","needs_clarification":false,"clarification_question":null,"context_used":false}

Q: "Transaction amount vs hour of day"
A: {"intent":"correlation","metric":"avg","column":"amount","filters":{},"group_by":null,"segment_col":"hour_of_day","recommended_chart":"scatter","needs_clarification":false,"clarification_question":null,"context_used":false}

Q: "Compare Android vs iOS transaction amounts"
A: {"intent":"comparison","metric":"avg","column":"amount","filters":{},"group_by":"device_type","segment_col":null,"recommended_chart":"bar","needs_clarification":false,"clarification_question":null,"context_used":false}

Q: "How many merchant categories?"
A: {"intent":"aggregation","metric":"count","column":"merchant_category","filters":{},"group_by":null,"segment_col":null,"recommended_chart":"bar","needs_clarification":false,"clarification_question":null,"context_used":false}

Q: "Show last month expenses"
A: {"intent":"aggregation","metric":"sum","column":"amount","filters":{"timeframe":"last month"},"group_by":null,"segment_col":null,"recommended_chart":"line","needs_clarification":false,"clarification_question":null,"context_used":false}

Q: "Transactions yesterday"
A: {"intent":"aggregation","metric":"count","column":"amount","filters":{"timeframe":"yesterday"},"group_by":null,"segment_col":null,"recommended_chart":"bar","needs_clarification":false,"clarification_question":null,"context_used":false}

Q: "Create monthly financial dashboard"
A: {"intent":"dashboard","metric":"sum","column":"amount","filters":{"timeframe":"last month"},"group_by":null,"segment_col":null,"recommended_chart":null,"needs_clarification":false,"clarification_question":null,"context_used":false}

Q: "Generate report for Travel transactions this week"
A: {"intent":"dashboard","metric":"count","column":"amount","filters":{"merchant_category":"Travel","timeframe":"last week"},"group_by":null,"segment_col":null,"recommended_chart":null,"needs_clarification":false,"clarification_question":null,"context_used":false}

RULES:
- Output ONLY valid JSON. No markdown, no explanation.
- Use 'rag' for general questions OR questions that require qualitative insight from the data.
- If the question asks "how many" of a categorical column (like merchant_category), use 'metric':'count'.
- For relative time frames like "last month", "yesterday", "last week", include "timeframe": "value" in filters.
- If the question indicates comparing two categories over time, use 'multi_segmentation' with 'date' or 'hour' as one segment and 'recommended_chart':'line'.
- For histograms, always use 'distribution' intent.
- For relationships between two metrics or values, use 'correlation'.
"""


async def classify_intent(
    user_message: str,
    conversation_history: list[dict],
    last_context: dict,
) -> dict:
    """
    Send the user message + context to the LLM and return a parsed QueryPlan dict.
    Tries each model in MODELS in order; falls back on any error.
    """
    # Build context hint
    context_notes = []
    if last_context.get("last_category"):
        context_notes.append(f"Last discussed category: {last_context['last_category']}")
    if last_context.get("last_metric"):
        context_notes.append(f"Last metric: {last_context['last_metric']}")
    if last_context.get("last_column"):
        context_notes.append(f"Last column: {last_context['last_column']}")
    if last_context.get("last_group_by"):
        context_notes.append(f"Last group_by: {last_context['last_group_by']}")

    context_hint = ""
    if context_notes:
        context_hint = "\n[CONVERSATION CONTEXT: " + ", ".join(context_notes) + "]"

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    # Include last 4 turns of history for follow-up resolution
    for turn in (conversation_history or [])[-4:]:
        messages.append(turn)
    messages.append({"role": "user", "content": user_message + context_hint})

    try:
        content = await call_llm(messages)
        # Strip markdown code fences if present
        content = re.sub(r"^```(?:json)?\s*", "", content)
        content = re.sub(r"\s*```$", "", content)

        plan = json.loads(content)
        return plan

    except Exception as e:
        last_error = str(e)

    # All models failed — graceful fallback
    return {
        "intent": "ambiguous",
        "metric": "avg",
        "column": "amount",
        "filters": {},
        "group_by": None,
        "segment_col": None,
        "needs_clarification": True,
        "clarification_question": f"I had trouble understanding that. Could you rephrase? (Tip: ask about average amounts, fraud rates, peak hours, or comparisons by device or state.)",
        "context_used": False,
        "_error": last_error,
    }
