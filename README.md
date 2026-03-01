# 🚀 InsightX: AI-Powered Fraud Intelligence & UPI Analytics

**InsightX** is a high-performance, end-to-end intelligence platform engineered to process and analyze a massive synthetic dataset of **250,000+ transactions**. It serves as a unified command center, bridging the gap between raw data and executive decision-making through advanced AI reasoning and real-time computation.

---

## 🎯 Project Overview

The core objective of InsightX is to provide a seamless interactive layer for massive financial datasets. The system is built to:

*   **Deep Intent Interpretation**: Accurately decode complex business inquiries regarding transaction flows, consumer habits, and system health.
*   **Data-Driven Intelligence**: Deliver instantaneous statistical breakdowns, multi-dimensional aggregations, and sophisticated anomaly detection.
*   **Narrative Explainability**: Every insight is accompanied by a logical derivation, backed by empirical statistics and visual trends to ensure transparency.
*   **Contextual Continuity**: The system maintains a stateful understanding of the conversation, allowing for natural follow-up questions and resolving ambiguity with logic.

---

## 🔍 Analytical Focus Areas

InsightX is optimized to navigate critical data dimensions across the transaction lifecycle:

*   **Temporal & Descriptive Insights**: Deep dives into transaction benchmarks and peak activity cycles for diverse segments like Retail, Food, or Services.
*   **Cross-Dimensional Comparisons**: Evaluating performance variances across different hardware ecosystems (Mobile OS) or infrastructure conditions (Network types).
*   **Granular User Segmentation**: Mapping behavioral shifts and transaction densities across demographic brackets and geographical regions.
*   **Risk & System Health**: Real-time monitoring of transaction outcomes, failure reasons, and high-risk activity flags to ensure operational resilience.

---

## ✨ Key Features

### 📊 **Real-Time KPI Command Center**
- **Dynamic Dashboards**: High-performance visualizations using **Recharts** and **GSAP** for cinematic, fluid data storytelling.
- **Volume & Risk Tracking**: Instantly monitor total transaction volume, fraud flags, and success rates.
- **Premium UI**: Modern, glassmorphic design system optimized for readability and professional aesthetics.

### 🤖 **AI Business Analyst**
- **Natural Language Chat**: Ask questions directly to your data (e.g., *"What are our biggest loss drivers this month?"*).
- **Business Logic Mapping**: Automatically maps technical terms (Failed/Declined) to business outcomes (Revenue Loss).
- **Numeric Segmenting**: Supports complex filtering like *"Transactions over 50,000 in Maharashtra"*.

### 📄 **Executive AI Reports**
- **1-Click Generation**: Transform entire datasets into structured, board-ready documents.
- **Deep-Dive Analysis**: Covers Loss Drivers, Fraud Hotspots, and Strategic Growth opportunities.
- **Auto-Navigation**: Seamlessly redirects users to the report section upon generation.

### 🧠 **Advanced Processing Engine**
- **High-Scale Performance**: Handles 250k+ records using **Pandas** and **NumPy** with <0.01s latency for cached requests.
- **Predictive Caching**: Uses in-memory caching and startup pre-calculation to eliminate dashboard lag.
- **Risk Clustering**: Cross-references `device_type`, `network_type`, and `sender_state` to identify hidden fraud patterns.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React (Vite)
- **Styling**: TailwindCSS, Framer Motion
- **Animations**: GSAP (GreenSock Animation Platform)
- **Icons**: Lucide React
- **Visualization**: Recharts

### **Backend**
- **Framework**: FastAPI (Python)
- **Data Science**: Pandas, NumPy, Scikit-learn
- **AI/LLM**: OpenRouter API, LangChain
- **Environment**: Python 3.12+, `uv` (modern Python package manager)

---

## 📂 Project Structure

```text
insight-Astra/
├── Frontend/             # React (Vite) Application
│   ├── src/
│   │   ├── components/   # UI & Shared Components
│   │   ├── pages/        # Dashboard, Chat, & Report Sections
│   │   └── services/     # API Integration (Timeout handling & Prefetching)
│   └── package.json
└── Backend/              # FastAPI Application
    ├── app/
    │   ├── analytics/    # Data Engine, Intent Classification, & RAG Logic
    │   ├── api/          # RESTful Endpoints (Chat, Dashboard, Reports)
    │   └── ml/           # UPI Dataset (CSV)
    ├── main.py           # Server Entry & Startup Pre-calculation
    └── pyproject.toml    # Dependencies (Pandas, Scikit-learn, FastAPI)
```

---

## 🚦 Getting Started

### **Prerequisites**
- **Node.js**: v18+
- **Python**: v3.12+ (Recommended: `uv`)

### **1. Setup Backend**
```bash
cd Backend
# Install dependencies (using uv)
uv sync
# Start the server
uv run uvicorn main:app --reload
```
*The server will run at `http://localhost:8000` (FastAPI)*

### **2. Setup Frontend**
```bash
cd Frontend
# Install dependencies
npm install
# Start dev server
npm run dev
```
*The app will run at `http://localhost:5173` (Vite)*

## Redis

Redis is used by the backend for caching, session management, and pub/sub.
Install Redis in Docker:

```bash
docker run --name redis -p 6379:6379 -d redis
```

Verify with `redis-cli ping` returning `PONG`.

## Development Workflow

1. Start Redis on docker deskstop.
2. Follow instructions in `Backend/README.md` to set up and run the backend.
3. Follow instructions in `Frontend/README.md` to run the frontend.

---

## 🛡️ Data & Privacy
InsightX follows a strict **Data-Only Security Policy**. All AI interactions are filtered to ensure insights are derived exclusively from the provided dataset. If a query cannot be resolved using available dimensions, the system responds with a mandatory data-integrity notice.

---

## 📄 License
© 2026 Xtreme InsightX. All rights reserved.
---

🚀Happy coding!
