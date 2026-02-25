"""
UPI Transactions Analytics Engine
Loads the CSV once at startup and exposes typed query functions.
"""

import os
import pandas as pd
import numpy as np
from functools import lru_cache
from typing import Optional

# ── Dataset path ──────────────────────────────────────────────────────────────
_CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "ml", "upi_transactions_2024.csv")

# ── Global DataFrame (loaded once on import) ───────────────────────────────────
_df: Optional[pd.DataFrame] = None


def load_data() -> pd.DataFrame:
    """Load and pre-process the CSV (called once at startup)."""
    global _df
    if _df is not None:
        return _df

    df = pd.read_csv(_csv_path())
    # Normalise column names to lowercase with underscores
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    # Explicitly map common CSV variants to expected logic names
    mapping = {
        "amount_(inr)": "amount",
        "transaction_status": "status",
        "sender_age_group": "age_group",
        "sender_state": "state",
    }
    df = df.rename(columns={k: v for k, v in mapping.items() if k in df.columns})

    # Parse datetime columns if present
    for col in ["timestamp", "date", "transaction_date", "datetime"]:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce")
            if "hour_of_day" not in df.columns:
                df["hour_of_day"] = df[col].dt.hour
            if "day_of_week" not in df.columns:
                df["day_of_week"] = df[col].dt.day_name()
            if "is_weekend" not in df.columns:
                df["is_weekend"] = df[col].dt.dayofweek >= 5
            break

    # Ensure numeric types
    if "amount" in df.columns:
        df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    if "fraud_flag" in df.columns:
        df["fraud_flag"] = pd.to_numeric(df["fraud_flag"], errors="coerce").fillna(0)

    _df = df
    return _df


def _csv_path() -> str:
    return os.path.abspath(_CSV_PATH)


def get_df() -> pd.DataFrame:
    global _df
    if _df is None:
        load_data()
    return _df


def _apply_date_filter(df: pd.DataFrame, timeframe: str) -> pd.DataFrame:
    """Filter DataFrame by a relative timeframe (e.g., 'last month', 'yesterday')."""
    time_col = next((c for c in ["timestamp", "date", "transaction_date", "datetime"] if c in df.columns), None)
    if not time_col or not timeframe:
        return df

    # Use the latest date in the dataset as 'now' to handle historical datasets
    now = df[time_col].max()
    if pd.isna(now):
        now = pd.Timestamp.now()
    
    timeframe = timeframe.lower()

    try:
        if "yesterday" in timeframe:
            # Last 24h from the end of the dataset
            start = (now - pd.Timedelta(days=1))
            df = df[(df[time_col] >= start) & (df[time_col] <= now)]
        elif "last week" in timeframe:
            df = df[df[time_col] >= (now - pd.Timedelta(days=7))]
        elif "last month" in timeframe:
            df = df[df[time_col] >= (now - pd.Timedelta(days=30))]
        elif "last 24 hours" in timeframe or "today" in timeframe:
            df = df[df[time_col] >= (now - pd.Timedelta(hours=24))]
    except Exception:
        pass # Fallback to unfiltered if date parsing fails
    
    return df


def _apply_filters(df: pd.DataFrame, filters: dict) -> pd.DataFrame:
    """Apply key=value filters from the query plan to the DataFrame."""
    for col, val in (filters or {}).items():
        if col == "peak_hours":
            # Define peak hours as 7-10 AM and 7-11 PM
            if "hour_of_day" in df.columns:
                df = df[df["hour_of_day"].isin(list(range(7, 11)) + list(range(19, 24)))]
        elif col == "weekend":
            if "is_weekend" in df.columns:
                df = df[df["is_weekend"] == bool(val)]
        elif col == "timeframe":
            df = _apply_date_filter(df, str(val))
        elif col in df.columns:
            col_series = df[col]
            if col_series.dtype == object:
                df = df[col_series.str.lower() == str(val).lower()]
            else:
                df = df[col_series == val]
    return df


# ── Public query functions ─────────────────────────────────────────────────────

def get_summary_stats() -> dict:
    """Overall KPI summary for the dashboard."""
    df = get_df()
    total = len(df)
    avg_amount = df["amount"].mean() if "amount" in df.columns else 0
    fraud_count = int(df["fraud_flag"].sum()) if "fraud_flag" in df.columns else 0
    fraud_rate = round(fraud_count / total * 100, 2) if total > 0 else 0

    failed_count = 0
    if "status" in df.columns:
        failed_count = int((df["status"].str.upper() == "FAILED").sum())
    failure_rate = round(failed_count / total * 100, 2) if total > 0 else 0

    categories = df["merchant_category"].nunique() if "merchant_category" in df.columns else 0
    states = df["state"].nunique() if "state" in df.columns else 0

    # Get recent transactions
    recent_transactions = []
    time_col = next((c for c in ["timestamp", "date", "transaction_date", "datetime"] if c in df.columns), None)
    
    if time_col:
        recent_df = df.sort_values(by=time_col, ascending=False).head(10)
        # Handle NaN values for JSON serialization
        recent_df = recent_df.replace({np.nan: None})
        
        for _, row in recent_df.iterrows():
            recent_transactions.append({
                "id": str(row.get("transaction_id", "N/A")),
                "user": "User " + str(row.get("sender_id", "Unknown")),
                "amount": float(row.get("amount", 0)),
                "date": row[time_col].strftime("%Y-%m-%d %H:%M") if hasattr(row[time_col], "strftime") else str(row[time_col]),
                "risk": "High" if row.get("fraud_flag") == 1 else "Low",
                "status": str(row.get("status", "SUCCESS")).capitalize()
            })

    return {
        "total_transactions": total,
        "avg_amount": round(avg_amount, 2),
        "fraud_count": fraud_count,
        "fraud_rate_pct": fraud_rate,
        "failure_rate_pct": failure_rate,
        "unique_categories": categories,
        "unique_states": states,
        "recent_transactions": recent_transactions
    }


def query_aggregation(metric: str, column: str, filters: dict) -> dict:
    """
    Compute a single aggregation (avg/sum/count/rate) optionally filtered.
    metric: 'avg' | 'sum' | 'count' | 'rate'
    column: 'amount' | 'fraud_flag' | ...
    filters: dict of column→value pairs
    """
    df = get_df()
    filtered = _apply_filters(df.copy(), filters)
    total_filtered = len(filtered)

    if total_filtered == 0:
        return {
            "result": None, 
            "count": 0, 
            "error": "No data matches the given filters.",
            "filters_applied": filters
        }

    if metric == "count":
        result = total_filtered
    elif column not in filtered.columns:
        result = total_filtered # Fallback to count if column is missing
    elif metric == "avg" and pd.api.types.is_numeric_dtype(filtered[column]):
        result = round(filtered[column].mean(), 2)
    elif metric == "sum" and pd.api.types.is_numeric_dtype(filtered[column]):
        result = round(filtered[column].sum(), 2)
    elif metric == "rate" and pd.api.types.is_numeric_dtype(filtered[column]):
        result = round(filtered[column].mean() * 100, 2)
    else:
        # If mean is requested on a string column, return count as a fallback or None
        if metric in ("avg", "mean", "sum") and not pd.api.types.is_numeric_dtype(filtered[column]):
             result = total_filtered # Return count instead of error
        else:
            result = total_filtered

    # Benchmark against the full dataset for comparison
    benchmark = None
    if column in df.columns and pd.api.types.is_numeric_dtype(df[column]):
        benchmark = round(df[column].mean(), 2)
    pct_diff = None
    if benchmark and benchmark != 0 and result is not None:
        pct_diff = round((result - benchmark) / benchmark * 100, 1)

    return {
        "result": result,
        "benchmark": benchmark,
        "pct_diff_from_overall": pct_diff,
        "count": total_filtered,
        "filters_applied": filters,
    }


def query_comparison(group_by: str, metric: str, column: str, filters: dict) -> dict:
    """
    GroupBy comparison, e.g. iOS vs Android average amount.
    """
    df = get_df()
    filtered = _apply_filters(df.copy(), filters)

    if group_by not in filtered.columns:
        return {"error": f"Column '{group_by}' not found in dataset."}
    if column not in filtered.columns:
        return {"error": f"Column '{column}' not found in dataset."}

    if metric in ("avg", "mean") and pd.api.types.is_numeric_dtype(filtered[column]):
        grouped = filtered.groupby(group_by)[column].mean().round(2)
    elif metric == "sum" and pd.api.types.is_numeric_dtype(filtered[column]):
        grouped = filtered.groupby(group_by)[column].sum().round(2)
    elif metric in ("rate", "fraud_rate") and pd.api.types.is_numeric_dtype(filtered[column]):
        grouped = (filtered.groupby(group_by)[column].mean() * 100).round(2)
    else:
        # Fallback to count if column is non-numeric
        grouped = filtered.groupby(group_by).size()

    counts = filtered.groupby(group_by).size()

    result_rows = []
    for grp in grouped.index:
        result_rows.append({
            "group": str(grp),
            "value": grouped[grp],
            "count": int(counts.get(grp, 0)),
        })
    result_rows.sort(key=lambda x: x["value"], reverse=True)

    return {
        "group_by": group_by,
        "metric": metric,
        "column": column,
        "results": result_rows,
        "total_records": len(filtered),
        "chart_data": [
            {"name": r["group"], "value": r["value"]} for r in result_rows[:15]
        ],
        "chart_type": "bar"
    }


def query_temporal(filters: dict) -> dict:
    """
    Peak hour / day-of-week analysis.
    Returns top hours and top days for the filtered dataset.
    """
    df = get_df()
    filtered = _apply_filters(df.copy(), filters)

    result = {}

    if "hour_of_day" in filtered.columns:
        hourly = filtered.groupby("hour_of_day").agg(
            count=("amount", "count"),
            avg_amount=("amount", "mean")
        ).round(2)
        total_count = hourly["count"].sum()
        hourly["pct"] = (hourly["count"] / total_count * 100).round(1)
        top5 = hourly.nlargest(5, "count").reset_index()
        result["peak_hours"] = top5.to_dict(orient="records")
        # Find the single peak hour window
        peak_hour = int(hourly["count"].idxmax())
        result["peak_hour"] = peak_hour
        result["peak_label"] = f"{peak_hour:02d}:00–{peak_hour+1:02d}:00"

    if "day_of_week" in filtered.columns:
        day_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        daily = filtered.groupby("day_of_week").agg(
            count=("amount", "count"),
            avg_amount=("amount", "mean")
        ).round(2)
        daily = daily.reindex([d for d in day_order if d in daily.index])
        result["daily_distribution"] = daily.reset_index().to_dict(orient="records")

    result["total_filtered"] = len(filtered)
    result["filters_applied"] = filters
    
    peak_hour_data = result.get("peak_hours", [])
    result["chart_data"] = [
        {"name": f"{int(r['hour_of_day']):02d}:00", "value": r["count"]} for r in peak_hour_data
    ]
    result["chart_type"] = "line"
    
    return result


def query_segmentation(segment_col: str, metric: str, column: str) -> dict:
    """
    Break down a metric by a segment column (e.g., age_group, state).
    """
    df = get_df()

    if segment_col not in df.columns:
        # Try common column name variants
        candidates = [c for c in df.columns if segment_col.replace("_", "") in c.replace("_", "")]
        if candidates:
            segment_col = candidates[0]
        else:
            return {"error": f"Column '{segment_col}' not found. Available: {', '.join(df.columns.tolist()[:20])}"}

    if column not in df.columns:
        return {"error": f"Column '{column}' not found."}

    if metric in ("rate", "fraud_rate"):
        grouped = (df.groupby(segment_col)[column].mean() * 100).round(2)
    elif metric == "avg":
        grouped = df.groupby(segment_col)[column].mean().round(2)
    elif metric == "sum":
        grouped = df.groupby(segment_col)[column].sum().round(2)
    else:
        grouped = df.groupby(segment_col)[column].mean().round(2)

    counts = df.groupby(segment_col).size()
    rows = [{"segment": str(k), "value": float(v), "count": int(counts.get(k, 0))} for k, v in grouped.items()]
    rows.sort(key=lambda x: x["value"], reverse=True)

    return {
        "segment_col": segment_col,
        "metric": metric,
        "column": column,
        "results": rows[:20],  # cap at 20
        "total_segments": len(rows),
        "chart_data": [
            {"name": r["segment"], "value": r["value"]} for r in rows[:15]
        ],
        "chart_type": "pie" if metric in ("rate", "fraud_rate") else "bar"
    }


def query_risk(segment_col: Optional[str] = None) -> dict:
    """
    Fraud rate and failure rate, optionally broken down by a segment.
    """
    df = get_df()
    result = {}

    if segment_col:
        fraud_result = query_segmentation(segment_col, "rate", "fraud_flag")
        result["fraud_by_segment"] = fraud_result

        if "status" in df.columns:
            df_fail = df.copy()
            df_fail["is_failed"] = (df_fail["status"].str.upper() == "FAILED").astype(int)
            # Roll our own tiny segmentation for is_failed to avoid recursion or complex wrapper extraction
            fail_grouped = (df_fail.groupby(segment_col)["is_failed"].mean() * 100).round(2)
            fail_counts = df_fail.groupby(segment_col).size()
            fail_rows = [{"segment": str(k), "value": float(v), "count": int(fail_counts.get(k, 0))} for k, v in fail_grouped.items()]
            fail_rows.sort(key=lambda x: x["value"], reverse=True)
            result["failure_by_segment"] = {"results": fail_rows[:20]}
    else:
        total = len(df)
        fraud_count = int(df["fraud_flag"].sum()) if "fraud_flag" in df.columns else 0
        result["overall_fraud_rate"] = round(fraud_count / total * 100, 2)
        result["fraud_count"] = fraud_count

        if "status" in df.columns:
            failed = (df["status"].str.upper() == "FAILED").sum()
            result["overall_failure_rate"] = round(int(failed) / total * 100, 2)
            result["failed_count"] = int(failed)

    result["total_records"] = len(df)
    return result


def query_histogram(column: str, bins: int = 10) -> dict:
    """Computes frequency distribution for a numeric column."""
    df = get_df()
    if column not in df.columns:
        return {"error": f"Column '{column}' not found"}
    
    counts, bin_edges = np.histogram(df[column].dropna(), bins=bins)
    result_data = []
    for i in range(len(counts)):
        label = f"{bin_edges[i]:.0f}-{bin_edges[i+1]:.0f}"
        result_data.append({"name": label, "value": int(counts[i])})
        
    return {
        "column": column,
        "chart_data": result_data,
        "chart_type": "histogram"
    }

def query_correlation(col1: str, col2: str) -> dict:
    """Returns X-Y pairs for relationship analysis."""
    df = get_df()
    if col1 not in df.columns or col2 not in df.columns:
        return {"error": "One or more columns not found"}
        
    # Sample if dataset is too large, but for 1000 rows it's fine
    sample = df[[col1, col2]].dropna().head(100)
    result_data = [{"x": float(row[col1]), "y": float(row[col2])} for _, row in sample.iterrows()]
    
    return {
        "col1": col1,
        "col2": col2,
        "chart_data": result_data,
        "chart_type": "scatter"
    }

def query_multi_segmentation(dim1: str, dim2: str, metric: str, column: str) -> dict:
    """Matrix breakdown for stacked/grouped charts."""
    df = get_df()
    if dim1 not in df.columns or dim2 not in df.columns:
        return {"error": "Dimensions not found"}
        
    if metric == "count":
        pivot = df.groupby([dim1, dim2]).size().unstack(fill_value=0)
    else:
        pivot = df.groupby([dim1, dim2])[column].mean().unstack(fill_value=0)
        
    result_data = []
    # Recharts expects: [{name: 'GroupA', Series1: 10, Series2: 20}]
    for idx, row in pivot.head(10).iterrows():
        item = {"name": str(idx)}
        for col in pivot.columns:
            item[str(col)] = float(row[col])
        result_data.append(item)
        
    return {
        "dim1": dim1,
        "dim2": dim2,
        "keys": [str(c) for c in pivot.columns],
        "chart_data": result_data,
        "chart_type": "stacked_bar"
    }

def get_column_names() -> list[str]:
    """Return available column names for the LLM prompt context."""
    return get_df().columns.tolist()


def get_unique_values(column: str, limit: int = 20) -> list:
    """Return unique values for a given column (for context)."""
    df = get_df()
    if column not in df.columns:
        return []
    vals = df[column].dropna().unique()[:limit]
    return [str(v) for v in vals]


def generate_dashboard_data(metric: str = "avg", column: str = "amount", filters: dict = None) -> dict:
    """
    Generates a full dashboard structure including KPIs, trends, and breakdowns.
    """
    df = get_df()
    df_filtered = _apply_date_filter(df, filters.get("timeframe")) if filters else df
    df_filtered = _apply_filters(df_filtered, filters)
    
    total_records = len(df_filtered)
    if total_records == 0:
        return {"error": "No data matches filters."}

    # 1. KPIs
    kpis = {
        "volume": total_records,
        "total_amount": float(df_filtered["amount"].sum()) if "amount" in df_filtered.columns else 0,
        "avg_amount": float(df_filtered["amount"].mean()) if "amount" in df_filtered.columns else 0,
        "fraud_rate": float(df_filtered["fraud_flag"].mean() * 100) if "fraud_flag" in df_filtered.columns else 0,
        "success_rate": float((df_filtered["status"] == "SUCCESS").mean() * 100) if "status" in df_filtered.columns else 0
    }

    # 2. Main Trend (Daily if few days, Monthly otherwise)
    trend_data = []
    time_col = next((c for c in ["timestamp", "date", "transaction_date"] if c in df.columns), None)
    if time_col:
        # Group by date
        daily = df_filtered.set_index(time_col).resample('D')["amount"].agg(['sum', 'count']).reset_index()
        daily[time_col] = daily[time_col].dt.strftime('%Y-%m-%d')
        trend_data = daily.rename(columns={time_col: "date"}).to_dict('records')

    # 3. Categorical Breakdowns
    def get_breakdown(col, m="count", c="amount"):
        if col not in df_filtered.columns: return []
        if m == "sum":
            res = df_filtered.groupby(col)[c].sum().sort_values(ascending=False).head(5)
        else:
            res = df_filtered.groupby(col).size().sort_values(ascending=False).head(5)
        return [{"label": str(k), "value": float(v)} for k, v in res.items()]

    breakdowns = {
        "merchant": get_breakdown("merchant_category", metric, column),
        "state": get_breakdown("state", metric, column),
        "device": get_breakdown("device_type", "count"),
    }

    return {
        "title": f"Dashboard: {filters.get('timeframe', 'Overall').title()}",
        "summary": {
            "timeframe": filters.get("timeframe", "all-time"),
            "filters_applied": filters
        },
        "kpis": kpis,
        "trend": trend_data,
        "breakdowns": breakdowns,
        "insights": [] # To be populated by explainability/LLM
    }
