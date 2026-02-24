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
        # Initialize embeddings
        self.embeddings = HuggingFaceEmbeddings(model_name=EMBEDDINGS_MODEL)
        self.vector_store = None
        self._initialize_vector_store()

    def _initialize_vector_store(self):
        # We try to load the local index, but we NEVER build it on startup
        # because it blocks the server for 20+ minutes.
        if os.path.exists(INDEX_PATH):
            print("💾 Loading existing RAG index...")
            try:
                self.vector_store = FAISS.load_local(INDEX_PATH, self.embeddings, allow_dangerous_deserialization=True)
                print("✅ RAG index loaded.")
            except Exception as e:
                print(f"⚠️ Could not load index: {e}.")
        else:
            print("🚀 Vector index missing. Using Instant Pandas-Retrieval Engine instead.")

    def _fast_pandas_search(self, query: str, k: int = 15) -> str:
        """Instant keyword search on the dataframe without vector embeddings."""
        if not os.path.exists(CSV_PATH):
            return "Dataset missing."
        
        try:
            df = pd.read_csv(CSV_PATH, nrows=50000) # Fast load first 50k
            # Simple keyword matching across all string columns
            query_terms = query.lower().split()
            
            # Create a combined text column for searching
            mask = df.astype(str).apply(lambda x: x.str.contains('|'.join(query_terms), case=False, na=False)).any(axis=1)
            results = df[mask].head(k)
            
            if results.empty:
                return "No specific matches found. Here are some sample transactions for context:\n" + df.head(5).to_string()
            
            return results.to_string()
        except Exception as e:
            return f"Error in instant search: {e}"

    async def query(self, user_query: str) -> tuple[str, list]:
        """
        Retrieves context using Vector Search (if available) or Instant Pandas Search.
        """
        if self.vector_store:
            try:
                retriever = self.get_retriever()
                docs = retriever.invoke(user_query)
                context = "\n\n".join([doc.page_content for doc in docs])
                return context, docs
            except:
                pass # Fallback to pandas
        
        print("🔍 Using Pandas Instant-Retrieval...")
        context = self._fast_pandas_search(user_query)
        # Create a dummy list for compatibility
        return context, []

# Global singleton
rag_engine = RAGEngine()

# Global singleton
rag_engine = RAGEngine()
