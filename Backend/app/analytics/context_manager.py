"""
In-memory and Redis session context manager.
Each session_id gets its own context dict with conversation history and last filters.
"""

import uuid
import json
import os
from typing import Any
from datetime import datetime
from pathlib import Path
from app.core.redis_client import redis_client

# Storage path
STORAGE_DIR = Path(__file__).parent.parent.parent / "storage"
STORAGE_DIR.mkdir(exist_ok=True)
STORAGE_FILE = STORAGE_DIR / "sessions_storage.json"

# In-memory fallback: session_id -> context dict
_sessions: dict[str, Any] = {}

def _load_from_disk():
    global _sessions
    if STORAGE_FILE.exists():
        try:
            with open(STORAGE_FILE, "r") as f:
                _sessions = json.load(f)
        except Exception as e:
            print(f"Error loading sessions from disk: {e}")
            _sessions = {}

def _save_to_disk():
    try:
        with open(STORAGE_FILE, "w") as f:
            json.dump(_sessions, f)
    except Exception as e:
        print(f"Error saving sessions to disk: {e}")

# Initial load
_load_from_disk()

MAX_HISTORY = 20  # Max messages to keep per session
SESSION_TTL = 86400 # 24 hours


def _get_redis(session_id: str) -> dict | None:
    try:
        data = redis_client.get(f"session:{session_id}")
        if data:
            return json.loads(data)
    except Exception:
        pass
    return None


def _set_redis(session_id: str, context: dict):
    try:
        redis_client.setex(
            f"session:{session_id}",
            SESSION_TTL,
            json.dumps(context)
        )
    except Exception:
        pass


def get_or_create_session(session_id: str | None) -> tuple[str, dict]:
    """Return (session_id, context). Creates a new session if needed."""
    if session_id:
        # Try Redis first
        ctx = _get_redis(session_id)
        if ctx:
            return session_id, ctx
        
        # Fallback to In-memory
        if session_id in _sessions:
            return session_id, _sessions[session_id]

    # Create new session
    session_id = session_id or str(uuid.uuid4())
    new_ctx = {
        "conversation_history": [],  # [{role, content}]
        "last_filters": {},          # e.g. {"merchant_category": "Food"}
        "last_topic": None,          # e.g. "Grocery"
        "last_category": None,
        "last_group_by": None,
        "last_metric": None,
        "last_column": None,
        "pattern_log": [],            # [{metric_type, deviation_pct, timestamp}]
        "last_query_result": None,    # {metric, value, segment} for cross-question validator
        "created_at": datetime.utcnow().isoformat(),
        "last_updated": datetime.utcnow().isoformat(),
    }
    
    _sessions[session_id] = new_ctx
    _set_redis(session_id, new_ctx)
    _save_to_disk()
    
    return session_id, new_ctx


def update_context(session_id: str, query_plan: dict, user_message: str, assistant_response: str, response_data: dict = None):
    """Persist the latest query plan and conversation turn into session context."""
    session_id, ctx = get_or_create_session(session_id)

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
    
    # Store assistant response with metadata if available
    assistant_turn = {"role": "assistant", "content": assistant_response}
    if response_data:
        assistant_turn["metadata"] = response_data
    history.append(assistant_turn)

    # Keep within limit
    if len(history) > MAX_HISTORY * 2:
        ctx["conversation_history"] = history[-(MAX_HISTORY * 2):]

    ctx["last_updated"] = datetime.utcnow().isoformat()
    
    # Save back
    _sessions[session_id] = ctx
    _set_redis(session_id, ctx)
    _save_to_disk()


def get_conversation_history(session_id: str) -> list[dict]:
    """Return the conversation history for building the LLM prompt."""
    _, ctx = get_or_create_session(session_id)
    return ctx.get("conversation_history", [])


def delete_history_item(session_id: str, index: int):
    """Remove a specific user-assistant turn from history (turn = 2 entries)."""
    _, ctx = get_or_create_session(session_id)
    history = ctx.get("conversation_history", [])
    
    # Each turn is (user, assistant), so we remove two items
    # index is the index of the user message in the 'turns' view (0, 1, 2...)
    start_idx = index * 2
    if 0 <= start_idx < len(history) - 1:
        # Remove assistant then user
        history.pop(start_idx + 1)
        history.pop(start_idx)
        
    ctx["last_updated"] = datetime.utcnow().isoformat()
    _sessions[session_id] = ctx
    _set_redis(session_id, ctx)
    _save_to_disk()


def get_last_context(session_id: str) -> dict:
    """Return the last known filters and dimensions."""
    _, ctx = get_or_create_session(session_id)
    return ctx


def clear_session(session_id: str):
    """Remove a session from memory and Redis."""
    _sessions.pop(session_id, None)
    try:
        redis_client.delete(f"session:{session_id}")
    except Exception:
        pass
