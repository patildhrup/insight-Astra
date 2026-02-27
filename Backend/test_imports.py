try:
    import fastapi
    print("[SUCCESS] fastapi imported")
    import uvicorn
    print("[SUCCESS] uvicorn imported")
    import sentence_transformers
    print("[SUCCESS] sentence_transformers imported")
    import sklearn
    print("[SUCCESS] sklearn imported")
    from app.analytics.rag_engine import rag_engine
    print("[SUCCESS] RAGEngine initialized")
    print("All backend dependencies are present.")
except ImportError as e:
    print(f"[ERROR] Missing dependency: {e}")
except Exception as e:
    print(f"[ERROR] Initialization failed: {e}")
