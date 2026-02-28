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

# -- System Prompt ------------------------------------------------------------------

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
- dashboard: create a full report/dashboard with multiple charts, KPIs, and insights
- rag: general/complex questions about patterns, ML modeling, strategy, or advisory
- ambiguous: unclear question, needs clarification

## Recommended Charts:
bar, line, pie, donut, area, stacked_bar, grouped_bar, histogram, scatter

## Output Format (JSON only):
{
  "intent": "aggregation|comparison|temporal|segmentation|risk|distribution|correlation|multi_segmentation|dashboard|rag|ambiguous",
  "metric": "avg|sum|count|rate",
  "column": "amount|fraud_flag",
  "filters": {},
  "group_by": null,
  "segment_col": null,
  "secondary_segment": null,
  "recommended_chart": "bar|line|pie|donut|area|stacked_bar|grouped_bar|histogram|scatter",
  "recommended_charts": ["bar", "line"],
  "needs_clarification": false,
  "clarification_question": null
}

## Multi-Chart Generation:
- If the user explicitly asks for **multiple diagrams** (e.g., "show bar and pie", "generate histogram and lineplot"), you MUST populate the `recommended_charts` list with all requested types.
- If the user asks for a **dashboard** or uses words like "detailed analysis", "full report", or "all metrics", you should suggest 3-4 appropriate charts in `recommended_charts`.

## Few-shot Examples:

Q: "Show category spending as a donut chart"
A: {"intent":"segmentation","metric":"sum","column":"amount","filters":{},"group_by":null,"segment_col":"merchant_category","recommended_chart":"donut","needs_clarification":false}

Q: "Propose an ML modeling strategy for 95/5 fraud split"
A: {"intent":"rag","metric":"avg","column":"fraud_flag","filters":{},"group_by":null,"segment_col":null,"recommended_chart":null,"needs_clarification":false}

Q: "Trend of transactions this week as an area chart"
A: {"intent":"temporal","metric":"count","column":"amount","filters":{"timeframe":"last week"},"group_by":null,"segment_col":null,"recommended_chart":"area","needs_clarification":false}

Q: "Fraud by state and device type as a stacked bar"
A: {"intent":"multi_segmentation","metric":"rate","column":"fraud_flag","filters":{},"group_by":null,"segment_col":"state","secondary_segment":"device_type","recommended_chart":"stacked_bar","needs_clarification":false}

Q: "Compare Android vs iOS spending side by side"
A: {"intent":"comparison","metric":"avg","column":"amount","filters":{},"group_by":"device_type","segment_col":null,"recommended_chart":"grouped_bar","needs_clarification":false}

Q: "Transaction amount distribution"
A: {"intent":"distribution","metric":"count","column":"amount","filters":{},"group_by":null,"segment_col":null,"recommended_chart":"histogram","needs_clarification":false}

Q: "Is there a correlation between amount and time of day?"
A: {"intent":"correlation","metric":"avg","column":"amount","filters":{},"group_by":null,"segment_col":"hour_of_day","recommended_chart":"scatter","needs_clarification":false}

RULES:
- **Autonomous Visualization**: If the prompt contains "show", "difference", "generate", "diagram", "comparison", or "visualize", YOU MUST select a `recommended_chart`. Do NOT ask the user which chart they want.
- **Strategic Advisory**: If the user asks for "strategy", "advice", "ml", "modeling", "sampling", or "how should we handle", map to `rag` intent.
- **Expert Mapping (Component-Count)**:
    - If the user is comparing **multiple components/categories** (e.g., "all states", "all categories", "breakdown by all"), use `pie` or `donut`.
    - If the user is comparing **exactly 2 components** (e.g., "Android vs iOS", "Fraud vs Legit", "Today vs Yesterday"), use `bar` or `histogram` (if numeric).
- Keyword Heuristics:
    - "trend", "over time", "history" -> area or line.
    - "difference", "comparison", "vs" -> grouped_bar (for 2 items) or stacked_bar (for categories).
    - "distribution", "spread" -> histogram.
- Output ONLY valid JSON.
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
