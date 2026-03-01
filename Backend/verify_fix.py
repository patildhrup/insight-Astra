import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_health():
    print("Testing /health...")
    res = requests.get(f"{BASE_URL}/health")
    print(res.json())

def test_summary():
    print("Testing /api/v1/analytics/summary (Benchmarking speed)...")
    start = time.time()
    res = requests.get(f"{BASE_URL}/api/v1/analytics/summary")
    duration = time.time() - start
    print(f"Status: {res.status_code}, Time: {duration:.4f}s")
    if duration < 1.0:
        print("PASS: Performance is acceptable.")
    else:
        print("FAIL: Still too slow.")

def test_report_intent():
    print("Testing Chat Intent for 'Generate AI Report'...")
    payload = {
        "message": "generate a AI report which tells the loss reasons in last month and include what fraud activity were carried out for last month",
        "session_id": "test_session"
    }
    res = requests.post(f"{BASE_URL}/api/v1/chat", json=payload)
    data = res.json()
    print(f"Intent: {data.get('intent')}")
    print(f"Data contains insights: {'insights' in data.get('data', {})}")
    if data.get('intent') == 'dashboard':
        print("PASS: Intent correctly classified.")
    else:
        print("FAIL: Intent misclassified.")

if __name__ == "__main__":
    try:
        test_health()
        test_summary()
        test_report_intent()
    except Exception as e:
        print(f"Error: {e}")
