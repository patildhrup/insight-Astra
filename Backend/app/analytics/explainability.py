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
    """Format aggregation query result in mandatory structured format."""
    metric = plan.get("metric", "avg")
    column = plan.get("column", "amount")
    filters = plan.get("filters", {})

    count = result.get("count", 0)
    value = result.get("result")
    benchmark = result.get("benchmark")
    pct_diff = result.get("pct_diff_from_overall")

    filter_desc = _describe_filters(filters)
    col_label = _col_label(column)
    metric_label = _metric_label(metric)

    if value is None:
        return "Query cannot be resolved using available dataset dimensions."

    # Format value string
    if column == "amount":
        val_str = _fmt_inr(value)
        bench_str = _fmt_inr(benchmark)
        formula = f"{metric_label}(amount) across filtered records"
    elif metric in ("rate", "fraud_rate"):
        val_str = _fmt_pct(value)
        bench_str = _fmt_pct(benchmark)
        formula = f"(Qualifying records / {count:,} total) x 100"
    else:
        val_str = f"{value:,}"
        bench_str = f"{benchmark:,}" if benchmark else "N/A"
        formula = f"{metric_label}({col_label}) across filtered records"

    lines = []
    lines.append(f"**Answer:**")
    lines.append(f"{metric_label} {col_label}{' for ' + filter_desc if filter_desc else ''}: **{val_str}**")
    lines.append("")
    lines.append("**Data Applied:**")
    lines.append(f"- Filters used: {filter_desc if filter_desc else 'None'}")
    lines.append(f"- Sample size: {count:,} transactions")
    lines.append("")
    lines.append("**Calculation Logic:**")
    lines.append(f"- Formula: {formula}")
    if benchmark is not None and pct_diff is not None:
        direction = "above" if pct_diff > 0 else "below"
        lines.append(f"- Overall benchmark: {bench_str} — result is {abs(pct_diff):.2f}% {direction} overall average")
    lines.append("")
    insight = _get_interpretation(plan, value, benchmark, pct_diff)
    if insight:
        lines.append("**Insight:**")
        lines.append(insight)
        lines.append("")
    lines.append("**Confidence:** High — Direct dataset aggregation.")
    return "\n".join(lines)


def format_comparison_response(plan: dict, result: dict) -> str:
    """Format a groupby comparison result in mandatory structured format."""
    group_by = result.get("group_by", "segment")
    column = result.get("column", "amount")
    metric = result.get("metric", "avg")
    rows = result.get("results", [])
    total = result.get("total_records", 0)
    error = result.get("error")

    if error:
        return f"Query cannot be resolved using available dataset dimensions. ({error})"

    if not rows:
        return "Query cannot be resolved using available dataset dimensions."

    col_label = _col_label(column)
    metric_label = _metric_label(metric)
    group_label = group_by.replace("_", " ").title()

    lines = []
    lines.append("**Answer:**")
    lines.append(f"{metric_label} {col_label} by {group_label} across {total:,} transactions:\n")
    for i, row in enumerate(rows):
        grp = row["group"]
        val = row["value"]
        cnt = row["count"]
        rank = f"#{i+1}"
        if column == "amount":
            val_str = _fmt_inr(val)
        elif metric in ("rate", "fraud_rate"):
            val_str = _fmt_pct(val)
        else:
            val_str = f"{val:,}"
        pct_of_total = round(cnt / total * 100, 2) if total > 0 else 0
        lines.append(f"  {rank}. {grp}: {val_str} ({cnt:,} transactions, {pct_of_total:.2f}% of total)")

    lines.append("")
    lines.append("**Data Applied:**")
    lines.append(f"- Filters used: {_describe_filters(plan.get('filters', {})) or 'None'}")
    lines.append(f"- Group by: {group_label}")
    lines.append(f"- Sample size: {total:,} transactions")
    lines.append("")
    lines.append("**Calculation Logic:**")
    lines.append(f"- Formula: {metric_label}({col_label}) grouped by {group_label}, sorted descending")
    if len(rows) >= 2:
        top = rows[0]
        bottom = rows[-1]
        if top["value"] and bottom["value"] and bottom["value"] != 0:
            spread = round((top["value"] - bottom["value"]) / bottom["value"] * 100, 2)
            lines.append("")
            lines.append("**Insight:**")
            lines.append(f"{top['group']} leads with a spread of {spread:.2f}% above {bottom['group']}.")
            if "fraud" in column.lower() or metric in ("rate", "fraud_rate"):
                lines.append(f"Risk note: {top['group']} shows the highest rate at {_fmt_pct(top['value'])}. Enhanced monitoring recommended.")

    lines.append("")
    lines.append("**Confidence:** High — Direct dataset aggregation.")
    return "\n".join(lines)


def format_temporal_response(plan: dict, result: dict) -> str:
    """Format peak hours / temporal analysis in mandatory structured format."""
    filters = plan.get("filters", {})
    filter_desc = _describe_filters(filters)
    total = result.get("total_filtered", 0)

    if not result.get("peak_hours") and not result.get("daily_distribution"):
        return "Query cannot be resolved using available dataset dimensions."

    lines = []
    lines.append("**Answer:**")

    if "peak_hours" in result:
        peak_hours_data = result["peak_hours"]
        peak_label = result.get("peak_label", "")
        lines.append(f"Peak transaction hour{' for ' + filter_desc if filter_desc else ''}: {peak_label}")
        lines.append(f"Top 5 hours by volume ({total:,} transactions analyzed):\n")
        for row in peak_hours_data:
            hour = row.get("hour_of_day", "?")
            count = row.get("count", 0)
            pct = row.get("pct", 0)
            avg_amt = row.get("avg_amount", 0)
            lines.append(f"  {hour:02d}:00-{hour+1:02d}:00 — {count:,} transactions ({pct:.2f}%) | Avg Amount: {_fmt_inr(avg_amt)}")

    if "daily_distribution" in result:
        lines.append("\nDay-of-Week Breakdown:")
        for row in result["daily_distribution"]:
            day = row.get("day_of_week", "?")
            count = row.get("count", 0)
            avg_amt = row.get("avg_amount", 0)
            lines.append(f"  {day} — {count:,} transactions | Avg: {_fmt_inr(avg_amt)}")

    lines.append("")
    lines.append("**Data Applied:**")
    lines.append(f"- Filters used: {filter_desc if filter_desc else 'None'}")
    lines.append(f"- Sample size: {total:,} transactions")
    lines.append("")
    lines.append("**Calculation Logic:**")
    lines.append("- Transaction count grouped by hour_of_day, sorted descending")
    lines.append("- Percentage = (hour count / total count) x 100")

    peak_hour = result.get("peak_hour")
    if peak_hour is not None:
        lines.append("")
        lines.append("**Insight:**")
        if peak_hour >= 18:
            lines.append("Evening peak (18:00+) indicates post-work or leisure spending behavior dominates transaction volume.")
        elif peak_hour < 12:
            lines.append("Morning peak (before 12:00) indicates commute-time or early business transactions are predominant.")
        else:
            lines.append(f"Peak transaction hour falls at {peak_hour:02d}:00, indicating midday activity dominance.")

    lines.append("")
    lines.append("**Confidence:** High — Direct dataset aggregation.")
    return "\n".join(lines)


def format_segmentation_response(plan: dict, result: dict) -> str:
    """Format segmentation result in mandatory structured format."""
    segment_col = result.get("segment_col", "segment")
    column = result.get("column", "amount")
    metric = result.get("metric", "avg")
    rows = result.get("results", [])
    total_segs = result.get("total_segments", 0)

    if not rows:
        return "Query cannot be resolved using available dataset dimensions."

    col_label = _col_label(column)
    metric_label = _metric_label(metric)
    seg_label = segment_col.replace("_", " ").title()

    # Total count for percentage calculation
    total_count = sum(r["count"] for r in rows)

    lines = []
    lines.append("**Answer:**")
    lines.append(f"{metric_label} {col_label} by {seg_label} ({total_segs} segments, top 10 shown):\n")
    for i, row in enumerate(rows[:10]):
        seg = row["segment"]
        val = row["value"]
        cnt = row["count"]
        rank = f"#{i+1}"
        pct = round(cnt / total_count * 100, 2) if total_count > 0 else 0
        if column == "amount":
            val_str = _fmt_inr(val)
        elif metric in ("rate", "fraud_rate"):
            val_str = _fmt_pct(val)
        else:
            val_str = f"{val:,}"
        lines.append(f"  {rank}. {seg}: {val_str} ({cnt:,} transactions, {pct:.2f}%)")

    lines.append("")
    lines.append("**Data Applied:**")
    lines.append(f"- Segment column: {seg_label}")
    lines.append(f"- Metric: {metric_label} of {col_label}")
    lines.append(f"- Sample size: {total_count:,} transactions across {total_segs} segments")
    lines.append("")
    lines.append("**Calculation Logic:**")
    lines.append(f"- Formula: {metric_label}({col_label}) grouped by {seg_label}, sorted descending")
    lines.append("- Percentage = (segment count / total count) x 100")

    top = rows[0]
    if len(rows) > 1:
        top_val_str = _fmt_pct(top['value']) if metric in ('rate', 'fraud_rate') else _fmt_inr(top['value'])
        lines.append("")
        lines.append("**Insight:**")
        lines.append(f"{top['segment']} ranks highest at {top_val_str}.")
        if "fraud" in column.lower() or metric in ("rate", "fraud_rate"):
            lines.append("Elevated fraud rates in specific segments may indicate targeted attack patterns or increased user vulnerability in those cohorts.")

    lines.append("")
    lines.append("**Confidence:** High — Direct dataset aggregation.")
    return "\n".join(lines)


def format_risk_response(plan: dict, result: dict) -> str:
    """Format fraud/risk metrics in mandatory structured format."""
    total_records = result.get("total_records", 0)
    lines = []
    lines.append("**Answer:**")

    if "overall_fraud_rate" in result:
        fraud_count = result.get('fraud_count', 0)
        fraud_rate = result['overall_fraud_rate']
        lines.append(f"Overall Fraud Rate: {_fmt_pct(fraud_rate)}")
        lines.append(f"Overall Failure Rate: {_fmt_pct(result.get('overall_failure_rate', 0))}")
        lines.append("")
        lines.append("**Data Applied:**")
        lines.append("- Filters used: None (full dataset)")
        lines.append(f"- Sample size: {total_records:,} transactions")
        lines.append("")
        lines.append("**Calculation Logic:**")
        lines.append(f"- Fraud Rate = ({fraud_count:,} fraud_flag=1 / {total_records:,} total) x 100 = {fraud_rate:.2f}%")
        failed_count = result.get('failed_count', 0)
        if failed_count:
            lines.append(f"- Failure Rate = ({failed_count:,} status=FAILED / {total_records:,} total) x 100 = {result.get('overall_failure_rate', 0):.2f}%")

    if "fraud_by_segment" in result:
        seg_result = result["fraud_by_segment"]
        rows = seg_result.get("results", [])
        seg_col = seg_result.get("segment_col", "segment")
        seg_label = seg_col.replace("_", " ").title()
        lines.append(f"\nFraud Rate by {seg_label}:")
        for row in rows[:8]:
            pct_of_total = round(row['count'] / total_records * 100, 2) if total_records > 0 else 0
            lines.append(f"  {row['segment']}: {_fmt_pct(row['value'])} ({row['count']:,} transactions, {pct_of_total:.2f}% of total)")
        if rows:
            lines.append(f"\nHighest Risk Segment: {rows[0]['segment']} at {_fmt_pct(rows[0]['value'])}.")

    if "failure_by_segment" in result:
        fail_rows = result["failure_by_segment"].get("results", [])
        seg_col = plan.get("segment_col") or "segment"
        seg_label = seg_col.replace("_", " ").title()
        lines.append(f"\nFailure Rate by {seg_label}:")
        for row in fail_rows[:8]:
            lines.append(f"  {row['segment']}: {_fmt_pct(row['value'])} ({row['count']:,} transactions)")

    if len(lines) <= 1:
        return "Query cannot be resolved using available dataset dimensions."

    lines.append("")
    lines.append("**Confidence:** High — Direct dataset aggregation.")
    return "\n".join(lines)


async def generate_rag_response(question: str, context: str) -> str:
    """Uses LLM to generate a structured answer based ONLY on retrieved CSV context."""
    system_prompt = f"""You are a Transaction Analytics Engine for InsightX — a UPI fraud intelligence system.
You MUST answer ONLY using the transaction data fragments provided below.

CRITICAL RULES:
1. Do NOT use external knowledge or make assumptions beyond the provided data.
2. Do NOT fabricate numbers or patterns.
3. If the answer cannot be derived from the data, respond exactly with:
   "Query cannot be resolved using available dataset dimensions."
4. Always use the mandatory response structure below.
5. Use a professional, executive, analytical tone. No emojis. No filler.

MANDATORY RESPONSE STRUCTURE:
Answer:
[Direct, precise answer with exact figures from the data]

Data Applied:
- Filters used
- Sample size (number of records in context)

Calculation Logic:
- How the result was derived
- Formula if rate/percentage used

Insight (if applicable):
- Pattern or trend strictly from the provided data

Confidence:
- High / Medium / Low with justification

## Transaction Data Context:
{context}
"""
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": question}
    ]

    try:
        return await call_llm(messages, temperature=0.1, max_tokens=800)
    except Exception:
        return "Query cannot be resolved using available dataset dimensions."


async def generate_dashboard_narrative(question: str, data: dict) -> str:
    """Uses LLM to provide a narrative executive summary of a generated dashboard."""
    kpis = data.get("kpis", {})
    breakdowns = data.get("breakdowns", {})
    
    context = f"""
    - Timeframe: {data.get('summary', {}).get('timeframe')}
    - Volume: {kpis.get('volume')} transactions
    - Total Amount: INR {kpis.get('total_amount'):,.2f}
    - Fraud Rate: {kpis.get('fraud_rate'):.2f}%
    - Success Rate: {kpis.get('success_rate'):.2f}%
    - Top Merchant Category: {breakdowns.get('merchant', [{}])[0].get('label', 'N/A')}
    """

    system_prompt = """You are a Senior Financial Data Analyst. 
    Provide a concise (2-3 paragraph) executive summary of the following transaction dashboard data. 
    Highlight key trends, risk levels, and one actionable insight. 
    Use a professional and confidence-inspiring tone. Use markdown bolding for key figures."""
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"User Prompt: {question}\n\nData Summary: {context}"}
    ]
    
    try:
        return await call_llm(messages, temperature=0.5, max_tokens=500)
    except Exception:
        return f"This dashboard summarizes {kpis.get('volume')} transactions with a total value of INR {kpis.get('total_amount'):,.2f}. The fraud rate is currently at {kpis.get('fraud_rate'):.2f}%."


def format_clarification_response(clarification_question: str) -> str:
    return f"Clarification Required: {clarification_question}"


def format_error_response(error: str) -> str:
    return f"An error occurred while processing your request: {error}\n\nPlease rephrase your question or specify the dimension, time range, or metric more precisely."


# -- Helpers --------------------------------------------------------------------

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

    if column == "amount":
        if pct_diff and pct_diff > 15:
            return "This segment shows spending {:.2f}% above the platform average, indicating premium or high-value transaction behavior.".format(abs(pct_diff))
        elif pct_diff and pct_diff < -15:
            return "This segment shows spending {:.2f}% below the platform average, indicating budget or low-ticket transaction behavior.".format(abs(pct_diff))
        elif pct_diff is not None:
            return "Spending aligns within {:.2f}% of the platform average, consistent with typical transaction patterns.".format(abs(pct_diff))
    elif "fraud" in column:
        if value > 3:
            return "Fraud rate above 3.00% is elevated. Enhanced transaction monitoring is recommended for this segment."
        elif value > 1.5:
            return "Moderate fraud rate detected. Additional verification steps should be considered."
        else:
            return "Fraud rate is within an acceptable threshold for this segment."
    return ""
