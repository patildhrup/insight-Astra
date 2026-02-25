/**
 * API client for the InsightX UPI Analytics backend.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Send a chat message to the conversational analytics engine.
 * @param {string} message - The user's question
 * @param {string|null} sessionId - Session ID for context continuity
 * @returns {Promise<{answer: string, session_id: string, intent: string, data: object, needs_clarification: boolean, clarification_question: string|null}>}
 */
export async function sendChatMessage(message, sessionId = null) {
    const response = await fetch(`${BASE_URL}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, session_id: sessionId }),
    });

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
    const response = await fetch(`${BASE_URL}/api/v1/analytics/summary`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}

/**
 * Fetch category breakdown from the UPI dataset.
 */
export async function getCategoryBreakdown() {
    const response = await fetch(`${BASE_URL}/api/v1/analytics/categories`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
}
/**
 * Fetch conversation history for a session.
 */
export async function fetchChatHistory(sessionId) {
    if (!sessionId) return { history: [] };
    const response = await fetch(`${BASE_URL}/api/v1/history/${sessionId}`);
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
