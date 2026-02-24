"""
Explainability Engine — converts raw analytics results into rich natural-language responses.
"""

from typing import Any
from app.core.llm import call_llm


def _fmt_inr(val: float | None) -> str:
    if val is None:
        return "N/A"
    return f"₹{val:,.2f}"


def _fmt_pct(val: float | None) -> str:
    if val is None:
        return "N/A"
    return f"{val:.1f}%"


def format_aggregation_response(plan: dict, result: dict) -> str:
    """Format aggregation query result."""
    metric = plan.get("metric", "avg")
    column = plan.get("column", "amount")
    filters = plan.get("filters", {})

    count = result.get("count", 0)
    value = result.get("result")
    benchmark = result.get("benchmark")
    pct_diff = result.get("pct_diff_from_overall")

    # Build filter description
    filter_desc = _describe_filters(filters)

    # Column label
    col_label = _col_label(column)
    metric_label = _metric_label(metric)

    if value is None:
        return f"❌ No data found for the given filters{' (' + filter_desc + ')' if filter_desc else ''}."

    # Core result
    if column == "amount":
        val_str = _fmt_inr(value)
        bench_str = _fmt_inr(benchmark)
    elif metric in ("rate", "fraud_rate"):
        val_str = _fmt_pct(value)
        bench_str = _fmt_pct(benchmark)
    else:
        val_str = f"{value:,}"
        bench_str = f"{benchmark:,}" if benchmark else "N/A"

    lines = []
    lines.append(f"📊 **{metric_label} {col_label}{' for ' + filter_desc if filter_desc else ''}:** {val_str}")
    lines.append(f"📈 Based on **{count:,}** transactions.")
    if benchmark is not None and pct_diff is not None:
        direction = "above" if pct_diff > 0 else "below"
        lines.append(f"📌 This is **{abs(pct_diff):.1f}% {direction}** the overall {metric_label.lower()} of {bench_str}.")
    # Business interpretation
    lines.append(_get_interpretation(plan, value, benchmark, pct_diff))
    return "\n\n".join(lines)


def format_comparison_response(plan: dict, result: dict) -> str:
    """Format a groupby comparison result."""
    group_by = result.get("group_by", "segment")
    column = result.get("column", "amount")
    metric = result.get("metric", "avg")
    rows = result.get("results", [])
    total = result.get("total_records", 0)
    error = result.get("error")

    if error:
        return f"⚠️ **Error in Comparison:** {error}"

    if not rows:
        return "❌ No comparison data available for the given query."

    col_label = _col_label(column)
    metric_label = _metric_label(metric)
    group_label = group_by.replace("_", " ").title()

    lines = [f"📊 **{metric_label} {col_label} by {group_label}** (across {total:,} transactions):\n"]
    for i, row in enumerate(rows):
        grp = row["group"]
        val = row["value"]
        cnt = row["count"]
        icon = "🥇" if i == 0 else "🥈" if i == 1 else "🥉" if i == 2 else "▪️"
        if column == "amount":
            val_str = _fmt_inr(val)
        elif metric in ("rate", "fraud_rate"):
            val_str = _fmt_pct(val)
        else:
            val_str = f"{val:,}"
        lines.append(f"{icon} **{grp}**: {val_str} ({cnt:,} transactions)")

    # Interpretation
    if len(rows) >= 2:
        top = rows[0]
        bottom = rows[-1]
        if top["value"] and bottom["value"] and bottom["value"] != 0:
            spread = round((top["value"] - bottom["value"]) / bottom["value"] * 100, 1)
            lines.append(f"\n📌 **Insight:** {top['group']} leads with a value {spread:.1f}% higher than {bottom['group']}.")

    # Risk note if fraud-related
    if "fraud" in column.lower() or metric in ("rate", "fraud_rate"):
        highest = rows[0]
        lines.append(f"\n⚠️ **Risk Note:** {highest['group']} shows the highest rate at {_fmt_pct(highest['value'])}. Recommend enhanced monitoring.")

    return "\n".join(lines)


def format_temporal_response(plan: dict, result: dict) -> str:
    """Format peak hours / temporal analysis."""
    filters = plan.get("filters", {})
    filter_desc = _describe_filters(filters)
    total = result.get("total_filtered", 0)

    lines = []

    if "peak_hours" in result:
        peak_hours_data = result["peak_hours"]
        peak_label = result.get("peak_label", "")
        lines.append(f"⏰ **Peak Hours{' for ' + filter_desc if filter_desc else ''}:** {peak_label}")
        lines.append(f"📈 Top 5 hours by transaction volume ({total:,} total transactions):\n")
        for row in peak_hours_data:
            hour = row.get("hour_of_day", "?")
            count = row.get("count", 0)
            pct = row.get("pct", 0)
            avg_amt = row.get("avg_amount", 0)
            lines.append(f"  • **{hour:02d}:00–{hour+1:02d}:00** → {count:,} transactions ({pct:.1f}%) | Avg: {_fmt_inr(avg_amt)}")
        if len(peak_hours_data) > 0:
            peak_hour = result.get("peak_hour")
            if peak_hour is not None and peak_hour >= 18:
                lines.append("\n📌 **Insight:** Evening peak suggests post-work or leisure spending behavior.")
            elif peak_hour is not None and peak_hour < 12:
                lines.append("\n📌 **Insight:** Morning peak indicates commute-time or early business transactions.")

    if "daily_distribution" in result:
        lines.append("\n📅 **Day-of-Week Breakdown:**")
        for row in result["daily_distribution"]:
            day = row.get("day_of_week", "?")
            count = row.get("count", 0)
            avg_amt = row.get("avg_amount", 0)
            lines.append(f"  • **{day}** → {count:,} transactions | Avg: {_fmt_inr(avg_amt)}")

    return "\n".join(lines) if lines else "No temporal data found."


def format_segmentation_response(plan: dict, result: dict) -> str:
    """Format segmentation result."""
    segment_col = result.get("segment_col", "segment")
    column = result.get("column", "amount")
    metric = result.get("metric", "avg")
    rows = result.get("results", [])
    total_segs = result.get("total_segments", 0)

    if not rows:
        return f"❌ No segmentation data for '{segment_col}'."

    col_label = _col_label(column)
    metric_label = _metric_label(metric)
    seg_label = segment_col.replace("_", " ").title()

    lines = [f"📊 **{metric_label} {col_label} by {seg_label}** ({total_segs} segments):\n"]
    for i, row in enumerate(rows[:10]):
        seg = row["segment"]
        val = row["value"]
        cnt = row["count"]
        rank = f"#{i+1}"
        if column == "amount":
            val_str = _fmt_inr(val)
        elif metric in ("rate", "fraud_rate"):
            val_str = _fmt_pct(val)
        else:
            val_str = f"{val:,}"
        lines.append(f"  {rank}. **{seg}** → {val_str} ({cnt:,} transactions)")

    top = rows[0]
    if len(rows) > 1:
        lines.append(f"\n📌 **Insight:** **{top['segment']}** ranks highest with {_fmt_pct(top['value']) if metric in ('rate','fraud_rate') else _fmt_inr(top['value'])}.")

    if "fraud" in column.lower() or metric in ("rate", "fraud_rate"):
        lines.append(f"\n⚠️ **Risk Note:** Higher fraud rates in certain segments may indicate targeted attack patterns or user vulnerability.")

    return "\n".join(lines)


def format_risk_response(plan: dict, result: dict) -> str:
    """Format fraud/risk metrics."""
    lines = []

    if "overall_fraud_rate" in result:
        lines.append(f"🛡️ **Overall Fraud Rate:** {_fmt_pct(result['overall_fraud_rate'])} ({result.get('fraud_count', 0):,} fraudulent transactions out of {result.get('total_records', 0):,})")
    if "overall_failure_rate" in result:
        lines.append(f"❌ **Overall Failure Rate:** {_fmt_pct(result['overall_failure_rate'])} ({result.get('failed_count', 0):,} failed transactions)")

    if "fraud_by_segment" in result:
        seg_result = result["fraud_by_segment"]
        rows = seg_result.get("results", [])
        seg_col = seg_result.get("segment_col", "segment")
        seg_label = seg_col.replace("_", " ").title()
        lines.append(f"\n📊 **Fraud Rate by {seg_label}:**")
        for row in rows[:8]:
            lines.append(f"  • **{row['segment']}** → {_fmt_pct(row['value'])} ({row['count']:,} transactions)")
        if rows:
            lines.append(f"\n⚠️ **Highest Risk:** {rows[0]['segment']} at {_fmt_pct(rows[0]['value'])}.")

    if "failure_by_segment" in result:
        fail_rows = result["failure_by_segment"].get("results", [])
        seg_col = plan.get("segment_col", "segment")
        seg_label = seg_col.replace("_", " ").title()
        lines.append(f"\n📊 **Failure Rate by {seg_label}:**")
        for row in fail_rows[:8]:
            lines.append(f"  • **{row['segment']}** → {_fmt_pct(row['value'])} ({row['count']:,} transactions)")

    return "\n".join(lines) if lines else "No risk data available."


async def generate_rag_response(question: str, context: str) -> str:
    """Uses LLM to generate a natural language answer based on retrieved CSV context."""
    system_prompt = """You are an AI Analyst for InsightX, a UPI fraud detection system.
Your goal is to answer the user's question based ONLY on the provided transaction data fragments (CSV rows).

## Context / Transaction Data:
{context}

## Instructions:
- Provide a clear, professional, and data-backed answer.
- If the data doesn't contain the answer, say you don't have enough specific information but offer a general insight based on what is available.
- Mention specific patterns, amounts, or merchant categories if they appear in the context.
- Keep the tone helpful and analytical.
"""
    messages = [
        {"role": "system", "content": system_prompt.format(context=context)},
        {"role": "user", "content": question}
    ]
    
    try:
        return await call_llm(messages, temperature=0.3, max_tokens=700)
    except Exception as e:
        return f"I found some relevant data, but I'm having trouble summarizing it right now. \n\n**Raw Context:**\n{context[:500]}..."


def format_clarification_response(clarification_question: str) -> str:
    return f"🤔 {clarification_question}"


def format_error_response(error: str) -> str:
    return f"⚠️ I encountered an issue: {error}\n\nPlease try rephrasing your question or be more specific about the dimension you'd like to analyze."


# ── Helpers ────────────────────────────────────────────────────────────────────

def _describe_filters(filters: dict) -> str:
    if not filters:
        return ""
    parts = []
    for k, v in filters.items():
        if k == "peak_hours":
            parts.append("peak hours")
        elif k == "weekend":
            parts.append("weekends" if v else "weekdays")
        else:
            parts.append(f"{k.replace('_', ' ')}: {v}")
    return ", ".join(parts)


def _col_label(column: str) -> str:
    mapping = {
        "amount": "Transaction Amount",
        "fraud_flag": "Fraud Rate",
        "is_failed": "Failure Rate",
    }
    return mapping.get(column, column.replace("_", " ").title())


def _metric_label(metric: str) -> str:
    mapping = {
        "avg": "Average",
        "sum": "Total",
        "count": "Count of",
        "rate": "Rate of",
        "fraud_rate": "Fraud Rate for",
        "mean": "Average",
    }
    return mapping.get(metric, metric.title())


def _get_interpretation(plan: dict, value: float, benchmark: float | None, pct_diff: float | None) -> str:
    column = plan.get("column", "amount")
    filters = plan.get("filters", {})
    category = (filters or {}).get("merchant_category", "")

    if column == "amount":
        if pct_diff and pct_diff > 15:
            return f"📌 **Insight:** This category shows significantly higher spending than average, suggesting premium or high-value purchases."
        elif pct_diff and pct_diff < -15:
            return f"📌 **Insight:** Below-average transaction amounts indicate budget or everyday spending behavior."
        else:
            return f"📌 **Insight:** Spending aligns closely with the platform average, indicating typical consumer behavior."
    elif "fraud" in column:
        if value > 3:
            return f"⚠️ **Risk Note:** Fraud rate above 3% is elevated. Enhanced transaction monitoring recommended for this segment."
        elif value > 1.5:
            return f"⚠️ **Risk Note:** Moderate fraud rate. Consider additional verification steps."
        else:
            return f"✅ **Risk Note:** Fraud rate is within acceptable range."
    return ""
