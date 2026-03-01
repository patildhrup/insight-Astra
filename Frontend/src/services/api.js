/**
 * API client for the InsightX UPI Analytics backend.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "";

/**
 * Wrapper around fetch() with an 8-second timeout.
 * Prevents the UI from hanging indefinitely when the backend is slow.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (err) {
        clearTimeout(id);
        if (err.name === "AbortError") {
            throw new Error("Backend request timed out. Is the server running?");
        }
        throw err;
    }
}

/**
 * Send a chat message to the conversational analytics engine.
 * @param {string} message - The user's question
 * @param {string|null} sessionId - Session ID for context continuity
 * @returns {Promise<{answer: string, session_id: string, intent: string, data: object, needs_clarification: boolean, clarification_question: string|null}>}
 */
export async function sendChatMessage(message, sessionId = null) {
    const response = await fetchWithTimeout(`${BASE_URL}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, session_id: sessionId }),
    }, 30000); // 30s for AI responses

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `API error: ${response.status}`);
    }

    return response.json();
}

/**
 * Fetch live UPI analytics summary for the dashboard KPI cards.
 * @returns {Promise<{success: boolean, data: object}>}
 */
export async function getAnalyticsSummary() {
    const response = await fetchWithTimeout(`${BASE_URL}/api/v1/analytics/summary`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}

/**
 * Fetch category breakdown from the UPI dataset.
 */
export async function getCategoryBreakdown() {
    const response = await fetchWithTimeout(`${BASE_URL}/api/v1/analytics/categories`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}
/**
 * Fetch conversation history for a session.
 */
export async function fetchChatHistory(sessionId) {
    if (!sessionId) return { history: [] };
    const response = await fetchWithTimeout(`${BASE_URL}/api/v1/history/${sessionId}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}

/**
 * Delete a specific turn from history.
 */
export async function deleteHistoryItem(sessionId, index) {
    const response = await fetch(`${BASE_URL}/api/v1/history/${sessionId}/${index}`, {
        method: "DELETE",
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}
/**
 * Fetch live risk heatmap data.
 */
export async function fetchHeatmapData() {
    const response = await fetchWithTimeout(`${BASE_URL}/api/v1/heatmap-risk`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}

/**
 * Simulate an executive action.
 */
export async function simulateAction(actionType, percentage) {
    const response = await fetchWithTimeout(`${BASE_URL}/api/v1/simulate-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_type: actionType, percentage }),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}
/**
 * Fetch executive benchmark comparison data.
 */
export async function fetchBenchmarkData() {
    const response = await fetchWithTimeout(`${BASE_URL}/api/v1/benchmark`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}

/**
 * Ask the AI Business Advisor for strategy.
 */
export async function askBusinessAdvisor(query) {
    const response = await fetchWithTimeout(`${BASE_URL}/api/v1/business-advisor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
    }, 30000); // 30s for AI responses
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}
