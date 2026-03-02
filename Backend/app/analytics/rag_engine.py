import os
import pandas as pd
from langchain_community.document_loaders import CSVLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
import httpx

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, "ml", "upi_transactions_2024.csv")
INDEX_PATH = os.path.join(BASE_DIR, "ml", "faiss_index")

# Embeddings model
EMBEDDINGS_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

class RAGEngine:
    def __init__(self):
        self._embeddings = None
        self._vector_store = None
        self._initialized = False

    @property
    def embeddings(self):
        if self._embeddings is None:
            print("[INIT] Loading HuggingFaceEmbeddings (Lazy)...")
            self._embeddings = HuggingFaceEmbeddings(model_name=EMBEDDINGS_MODEL)
        return self._embeddings

    def _initialize_vector_store(self):
        if self._initialized:
            return
        
        # We try to load the local index safely
        if os.path.exists(INDEX_PATH):
            print("[DATABASE] Loading existing RAG index...")
            try:
                # Use property to trigger lazy load of embeddings
                self._vector_store = FAISS.load_local(INDEX_PATH, self.embeddings, allow_dangerous_deserialization=True)
                print("[SUCCESS] RAG index loaded.")
            except Exception as e:
                print(f"[WARNING] Could not load index: {e}.")
        else:
            print("[INFO] Vector index missing. Using Instant Pandas-Retrieval Engine instead.")
        
        self._initialized = True

    @property
    def vector_store(self):
        if not self._initialized:
            self._initialize_vector_store()
        return self._vector_store

    def _fast_pandas_search(self, query: str, k: int = 15) -> str:
        """Instant keyword search on the dataframe without vector embeddings."""
        if not os.path.exists(CSV_PATH):
            return "Dataset missing."
        
        try:
            # Note: pd.read_csv here might be redundant if analytics_engine has it, 
            # but we keep it isolated for now.
            df = pd.read_csv(CSV_PATH, nrows=50000) # Fast load first 50k
            # Simple keyword matching across all string columns
            query_terms = query.lower().split()
            
            # Create a combined text column for searching
            def search_row(row):
                row_str = " ".join(row.astype(str)).lower()
                return all(term in row_str for term in query_terms)

            mask = df.apply(search_row, axis=1)
            results = df[mask].head(k)
            
            if results.empty:
                return "No specific matches found. Here are some sample transactions for context:\n" + df.head(5).to_string()
            
            return results.to_string()
        except Exception as e:
            return f"Error in instant search: {e}"

    def get_retriever(self):
        if not self.vector_store:
            return None
        return self.vector_store.as_retriever(search_kwargs={"k": 5})

    async def query(self, user_query: str) -> tuple[str, list]:
        """
        Retrieves context using Vector Search (if available) or Instant Pandas Search.
        """
        if self.vector_store:
            try:
                retriever = self.get_retriever()
                if retriever:
                    # invoke is sync in many langchain versions, but we await if needed or use run_in_executor
                    docs = retriever.invoke(user_query)
                    context = "\n\n".join([doc.page_content for doc in docs])
                    return context, docs
            except Exception as e:
                print(f"[ERROR] RAG Vector Search failed: {e}. Falling back to Pandas.")
        
        print("[SEARCH] Using Pandas Instant-Retrieval...")
        context = self._fast_pandas_search(user_query)
        # Create a dummy list for compatibility
        return context, []

# Global singleton (no longer loads heavy models on import)
rag_engine = RAGEngine()
