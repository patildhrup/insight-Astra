import asyncio
import httpx
import json

async def test_query(message):
    url = "http://localhost:8000/api/v1/chat"
    payload = {"message": message}
    print(f"\nTesting: {message}")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            data = response.json()
            answer = data.get("answer", "")
            if "Query cannot be resolved" in answer:
                print(f"FAIL: {answer[:100]}...")
            else:
                print(f"PASS: {answer[:150]}...")
    except Exception as e:
        print(f"ERROR: {e}")

async def main():
    queries = [
        "Identify the top 3 drivers of revenue loss (FAILED status).",
        "Analyze the High Value segment (transactions > 50000).",
        "Which merchant_category has the highest fraud_flag rate?"
    ]
    for q in queries:
        await test_query(q)

if __name__ == "__main__":
    asyncio.run(main())
