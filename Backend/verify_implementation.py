import asyncio
import os
import sys

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.analytics.rag_engine import rag_engine
from app.core.redis_client import redis_client
from app.analytics.explainability import generate_rag_response

async def test_rag():
    print("--- Testing RAG Engine ---")
    query = "What patterns are visible in high-value fraud transactions?"
    try:
        context, docs = await rag_engine.query(query)
        print(f"Retrieved {len(docs)} documents.")
        print(f"Context snippet: {context[:200]}...")
        
        print("\n--- Generating RAG Response ---")
        answer = await generate_rag_response(query, context)
        print(f"Answer: {answer}")
    except Exception as e:
        print(f"RAG Test Failed: {e}")

def test_redis():
    print("\n--- Testing Redis Connectivity ---")
    if redis_client is None:
        print("Redis Connectivity: SKIPPED (redis_client is None, falling back to in-memory)")
        return
    try:
        redis_client.set("test_key", "test_value")
        val = redis_client.get("test_key")
        print(f"Redis test_key: {val}")
        if val == "test_value":
            print("Redis connectivity: OK")
        else:
            print("Redis connectivity: DATA MISMATCH")
    except Exception as e:
        print(f"Redis Connectivity: FAILED (Falling back to in-memory) - Error: {e}")

if __name__ == "__main__":
    test_redis()
    asyncio.run(test_rag())
