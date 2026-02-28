import os
import httpx
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

MODELS = [
    "google/gemini-2.0-flash-lite-001",
]

async def call_llm(messages: list[dict], temperature: float = 0.1, max_tokens: int = 512) -> str:
    """Generic helper to call OpenRouter with fallback models."""
    last_error = None
    async with httpx.AsyncClient(timeout=30.0) as client:
        for model in MODELS:
            try:
                response = await client.post(
                    OPENROUTER_BASE_URL,
                    headers={
                        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://insightx.astra",
                        "X-Title": "InsightX UPI Analytics",
                    },
                    json={
                        "model": model,
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                    },
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"].strip()
            except Exception as e:
                last_error = str(e)
                continue
    
    raise Exception(f"All LLM models failed. Last error: {last_error}")
