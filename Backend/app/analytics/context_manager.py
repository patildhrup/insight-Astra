"""
In-memory session context manager.
Each session_id gets its own context dict with conversation history and last filters.
"""

import uuid
from typing import Any
from datetime import datetime

# In-memory store: session_id -> context dict
_sessions: dict[str, dict] = {}

MAX_HISTORY = 20  # Max messages to keep per session


def get_or_create_session(session_id: str | None) -> tuple[str, dict]:
    """Return (session_id, context). Creates a new session if needed."""
    if not session_id or session_id not in _sessions:
        session_id = session_id or str(uuid.uuid4())
        _sessions[session_id] = {
            "conversation_history": [],  # [{role, content}]
            "last_filters": {},          # e.g. {"merchant_category": "Food"}
            "last_topic": None,          # e.g. "Grocery"
            "last_category": None,
            "last_group_by": None,
            "last_metric": None,
            "last_column": None,
            "created_at": datetime.utcnow().isoformat(),
            "last_updated": datetime.utcnow().isoformat(),
        }
    return session_id, _sessions[session_id]


def update_context(session_id: str, query_plan: dict, user_message: str, assistant_response: str):
    """Persist the latest query plan and conversation turn into session context."""
    if session_id not in _sessions:
        get_or_create_session(session_id)

    ctx = _sessions[session_id]

    # Update last known filters / dimensions for follow-up resolution
    if query_plan.get("filters"):
        ctx["last_filters"].update(query_plan["filters"])
    if query_plan.get("merchant_category") or (query_plan.get("filters") or {}).get("merchant_category"):
        ctx["last_category"] = (query_plan.get("filters") or {}).get("merchant_category") or ctx["last_category"]
    if query_plan.get("group_by"):
        ctx["last_group_by"] = query_plan["group_by"]
    if query_plan.get("column"):
        ctx["last_column"] = query_plan["column"]
    if query_plan.get("metric"):
        ctx["last_metric"] = query_plan["metric"]

    # Append to conversation history
    history = ctx["conversation_history"]
    history.append({"role": "user", "content": user_message})
    history.append({"role": "assistant", "content": assistant_response})

    # Keep within limit
    if len(history) > MAX_HISTORY * 2:
        ctx["conversation_history"] = history[-(MAX_HISTORY * 2):]

    ctx["last_updated"] = datetime.utcnow().isoformat()


def get_conversation_history(session_id: str) -> list[dict]:
    """Return the conversation history for building the LLM prompt."""
    ctx = _sessions.get(session_id, {})
    return ctx.get("conversation_history", [])


def get_last_context(session_id: str) -> dict:
    """Return the last known filters and dimensions."""
    return _sessions.get(session_id, {})


def clear_session(session_id: str):
    """Remove a session from memory."""
    _sessions.pop(session_id, None)
