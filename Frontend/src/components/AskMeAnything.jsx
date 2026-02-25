import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageCircle, X, Send, Sparkles, BarChart3,
    TrendingUp, Shield, ChevronRight, Loader2, RefreshCw, History, Clock,
    Mic, MicOff, Trash2
} from "lucide-react";
import { sendChatMessage, fetchChatHistory, deleteHistoryItem } from "@/services/api";
import ReactMarkdown from "react-markdown";

const SUGGESTED_QUERIES = [
    "What's the average amount for Food transactions?",
    "Compare iOS vs Android spending",
    "Which age group has the highest fraud rate?",
    "Peak hours for Entertainment?",
    "Fraud rate by state",
    "Failure rate on weekends?",
    "5G vs WiFi transaction comparison",
    "Top merchant categories by volume",
];

const INTENT_ICONS = {
    aggregation: BarChart3,
    comparison: TrendingUp,
    temporal: Sparkles,
    segmentation: BarChart3,
    risk: Shield,
    ambiguous: MessageCircle,
    default: BarChart3,
};

function TypewriterText({ text, onComplete, onProgress }) {
    const [displayed, setDisplayed] = useState("");
    const [done, setDone] = useState(false);
    const idx = useRef(0);

    useEffect(() => {
        idx.current = 0;
        setDisplayed("");
        setDone(false);

        if (!text) return;

        // Fast typewriter — chunk-based for long analytics responses
        const chunkSize = Math.max(1, Math.floor(text.length / 80));
        const interval = setInterval(() => {
            if (idx.current >= text.length) {
                clearInterval(interval);
                setDone(true);
                onComplete?.();
                return;
            }
            const end = Math.min(idx.current + chunkSize, text.length);
            setDisplayed(text.slice(0, end));
            idx.current = end;
            onProgress?.(); // Trigger scroll
        }, 12);

        return () => clearInterval(interval);
    }, [text, onProgress, onComplete]);

    return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
                components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
                    em: ({ children }) => <em>{children}</em>,
                    ul: ({ children }) => <ul className="list-none pl-0 space-y-1">{children}</ul>,
                    li: ({ children }) => <li className="flex gap-1">{children}</li>,
                }}
            >
                {displayed}
            </ReactMarkdown>
            {!done && <span className="inline-block w-1 h-4 bg-primary ml-0.5 animate-pulse rounded" />}
        </div>
    );
}

function MessageBubble({ msg, isLatest, onScroll }) {
    const [renderComplete, setRenderComplete] = useState(!isLatest || msg.role === "user");
    const IntentIcon = INTENT_ICONS[msg.intent] || INTENT_ICONS.default;

    if (msg.role === "user") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="flex justify-end"
            >
                <div className="max-w-[80%] bg-gradient-to-br from-primary to-violet-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm shadow-md shadow-primary/20">
                    {msg.content}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
        >
            {/* AI Avatar */}
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-primary flex items-center justify-center shadow-sm mt-0.5">
                <IntentIcon className="w-4 h-4 text-white" />
            </div>

            <div className="flex-1 min-w-0">
                {/* Intent badge */}
                {msg.intent && msg.intent !== "ambiguous" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-primary/70 mb-1.5">
                        {msg.intent}
                    </span>
                )}

                <div className="bg-white dark:bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-700 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-zinc-700">
                    {isLatest && !renderComplete ? (
                        <TypewriterText
                            text={msg.content}
                            onComplete={() => setRenderComplete(true)}
                            onProgress={onScroll}
                        />
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown
                                components={{
                                    p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                                    strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
                                    ul: ({ children }) => <ul className="list-none pl-0 space-y-1">{children}</ul>,
                                    li: ({ children }) => <li>{children}</li>,
                                }}
                            >
                                {msg.content}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function ThinkingBubble() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex gap-3"
        >
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-primary flex items-center justify-center shadow-sm">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
            <div className="bg-white dark:bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 dark:border-zinc-700 flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Analyzing data</span>
                <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-primary/60"
                            style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

import { useNavigate } from "react-router-dom";
import { useAnalytics } from "@/context/AnalyticsContext";

export default function AskMeAnything() {
    const navigate = useNavigate();
    const { updateAnalysis, updateReport } = useAnalytics();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(() => localStorage.getItem("insightx_chat_session"));
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }, []);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            // Welcome message
            setMessages([{
                id: "welcome",
                role: "assistant",
                content: "👋 Hello! I'm your **UPI Analytics AI**.\n\nAsk me anything about transaction patterns, fraud rates, peak hours, device comparisons, or regional trends. I'll analyze the data and explain my findings clearly.\n\n📊 Try one of the suggested queries below, or type your own!",
                intent: null,
            }]);
        }
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    useEffect(() => {
        if (sessionId) {
            localStorage.setItem("insightx_chat_session", sessionId);
            // Optionally fetch history on load if we have a session but no messages
            if (messages.length === 0) {
                fetchChatHistory(sessionId).then(data => {
                    const history = data.history || [];
                    setChatHistory(history);
                    if (history.length > 0) {
                        // Restore messages if history exists? 
                        // For now we just show history items in the history view.
                    }
                });
            }
        } else {
            localStorage.removeItem("insightx_chat_session");
        }
    }, [sessionId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const sendMessage = useCallback(async (text) => {
        const query = (text || input).trim();
        if (!query || isLoading) return;

        setInput("");
        setShowSuggestions(false);

        const userMsg = { id: Date.now(), role: "user", content: query };
        setMessages((prev) => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const result = await sendChatMessage(query, sessionId);

            if (!sessionId && result.session_id) {
                setSessionId(result.session_id);
            }

            // Update Analytics Dashboard State
            if (result.chart_data) {
                updateAnalysis({
                    query,
                    answer: result.answer,
                    chart_data: result.chart_data
                });

                // If we aren't already on the analytics page, maybe navigate?
                // For now, just ensuring the state is updated is enough.
            }

            const aiMsg = {
                id: Date.now() + 1,
                role: "assistant",
                content: result.answer,
                intent: result.intent,
                needsClarification: result.needs_clarification,
            };
            setMessages((prev) => [...prev, aiMsg]);

            // Handle Auto Dashboard Generation
            if (result.intent === "dashboard" && result.data) {
                updateReport(result.data);
                setTimeout(() => {
                    navigate("/dashboard/auto-report");
                    setIsOpen(false); // Close the chat drawer
                }, 1500);
            }
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    role: "assistant",
                    content: `⚠️ **Connection Error**\n\nCouldn't reach the analytics server. Please make sure the backend is running on \`localhost:8000\`.\n\n_Error: ${err.message}_`,
                    intent: null,
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [input, sessionId, isLoading]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const startListening = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice recognition is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-IN";

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            // Optional: auto-send
            setTimeout(() => sendMessage(transcript), 500);
        };

        recognition.start();
    }, [sendMessage]);

    const handleDeleteHistory = async (e, index) => {
        e.stopPropagation();
        if (!sessionId) return;
        try {
            await deleteHistoryItem(sessionId, index);
            setChatHistory(prev => prev.filter((_, i) => Math.floor(i / 2) !== index));
            // Also update main messages if they are the ones being deleted
            // Note: Simplification - just refresh history list
            const data = await fetchChatHistory(sessionId);
            setChatHistory(data.history || []);
        } catch (err) {
            console.error("Failed to delete:", err);
        }
    };

    const handleReset = () => {
        setMessages([]);
        setSessionId(null);
        setShowSuggestions(true);
        setTimeout(() => {
            setMessages([{
                id: "welcome-reset",
                role: "assistant",
                content: "🔄 Conversation reset! I've cleared the context. What would you like to analyze?",
                intent: null,
            }]);
        }, 100);
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
            <AnimatePresence mode="wait">
                {isOpen ? (
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0, y: 20, scale: 0.93 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.93 }}
                        transition={{ type: "spring", damping: 28, stiffness: 320 }}
                        className="w-[92vw] max-w-lg bg-gray-50 dark:bg-zinc-950 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden flex flex-col"
                        style={{ height: "min(680px, 85vh)" }}
                    >
                        {/* Gradient top accent */}
                        <div className="h-1 bg-gradient-to-r from-amber-400 via-primary to-violet-600 flex-shrink-0" />

                        {/* Header */}
                        <div className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 flex-shrink-0">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-primary flex items-center justify-center shadow-sm">
                                <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">UPI Analytics AI</h2>
                                <p className="text-[11px] text-gray-400 leading-tight">Context-aware • Real-time data</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={async () => {
                                        if (!showHistory && sessionId) {
                                            const data = await fetchChatHistory(sessionId);
                                            setChatHistory(data.history || []);
                                        }
                                        setShowHistory(!showHistory);
                                    }}
                                    title="View History"
                                    className={`p-2 rounded-xl transition-colors ${showHistory ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-600'}`}
                                >
                                    <div className="relative">
                                        <Clock className="w-4 h-4" />
                                        {chatHistory.length > 0 && !showHistory && (
                                            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-primary rounded-full" />
                                        )}
                                    </div>
                                </button>
                                <button
                                    onClick={handleReset}
                                    title="Reset conversation"
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {showHistory ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex-1 overflow-y-auto px-4 py-2 space-y-3"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Recent Queries</h3>
                                    <button onClick={() => setShowHistory(false)} className="text-[10px] text-primary font-medium hover:underline">Back to chat</button>
                                </div>
                                {chatHistory.length === 0 ? (
                                    <div className="text-center py-10">
                                        <History className="w-8 h-8 text-gray-300 mx-auto mb-2 opacity-20" />
                                        <p className="text-xs text-gray-400">No history found for this session.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {chatHistory.filter(m => m.role === "user").map((msg, i) => (
                                            <div key={i} className="relative group/item">
                                                <button
                                                    onClick={() => {
                                                        sendMessage(msg.content);
                                                        setShowHistory(false);
                                                    }}
                                                    className="w-full text-left p-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 hover:border-primary/50 transition-all text-xs text-gray-600 dark:text-gray-300 shadow-sm flex gap-3 group"
                                                >
                                                    <Clock className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary mt-0.5" />
                                                    <span className="flex-1 truncate">{msg.content}</span>
                                                    <ChevronRight className="w-3 h-3 text-gray-300" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteHistory(e, i)}
                                                    className="absolute right-8 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover/item:opacity-100 hover:text-red-500 transition-all text-gray-400"
                                                    title="Delete entry"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0 scroll-smooth">
                                {messages.map((msg, i) => (
                                    <MessageBubble
                                        key={msg.id}
                                        msg={msg}
                                        isLatest={i === messages.length - 1 && msg.role === "assistant"}
                                        onScroll={scrollToBottom}
                                    />
                                ))}

                                <AnimatePresence>
                                    {isLoading && <ThinkingBubble />}
                                </AnimatePresence>

                                {/* Suggested queries */}
                                <AnimatePresence>
                                    {showSuggestions && messages.length <= 1 && !isLoading && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="pt-1"
                                        >
                                            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-widest mb-2 px-1">Try asking</p>
                                            <div className="flex flex-wrap gap-2">
                                                {SUGGESTED_QUERIES.slice(0, 6).map((q) => (
                                                    <button
                                                        key={q}
                                                        onClick={() => sendMessage(q)}
                                                        className="text-xs bg-white dark:bg-zinc-800 hover:bg-primary hover:text-white dark:hover:bg-primary border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 rounded-full px-3 py-1.5 transition-all duration-200 shadow-sm flex items-center gap-1.5 group"
                                                    >
                                                        <ChevronRight className="w-3 h-3 text-primary group-hover:text-white" />
                                                        {q}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div ref={bottomRef} />
                            </div>
                        )}

                        {/* Input */}
                        <div className="flex-shrink-0 p-4 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800">
                            <div className="flex gap-2 items-end">
                                <div className="flex-1 relative">
                                    <textarea
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={isListening ? "Listening..." : "Ask about transactions..."}
                                        rows={1}
                                        className={`w-full resize-none bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 rounded-2xl px-4 py-3 text-sm outline-none border transition-all leading-relaxed min-h-[44px] max-h-[120px] overflow-y-auto pr-10 ${isListening ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 dark:border-zinc-700'}`}
                                        style={{ fieldSizing: "content" }}
                                        disabled={isLoading}
                                    />
                                    <button
                                        onClick={startListening}
                                        disabled={isLoading}
                                        className={`absolute right-3 bottom-3 p-1 rounded-lg transition-all ${isListening ? 'text-primary animate-pulse' : 'text-gray-400 hover:text-primary'}`}
                                        title="Voice Assistant"
                                    >
                                        {isListening ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                    </button>
                                </div>
                                <button
                                    onClick={() => sendMessage()}
                                    disabled={!input.trim() || isLoading}
                                    className="flex-shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-violet-600 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-md shadow-primary/30 transition-all duration-200 active:scale-95"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4 text-white" />
                                    )}
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400 text-center mt-2">
                                AI-powered analysis · Context remembered across questions
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    /* Pill trigger */
                    <motion.div
                        key="pill"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setIsOpen(true)}
                        className="cursor-pointer group relative"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-primary to-violet-600 rounded-full blur opacity-30 group-hover:opacity-80 transition duration-500 group-hover:duration-200" />
                        <div className="relative flex items-center gap-3 pl-2 pr-6 py-2 bg-white dark:bg-zinc-900 rounded-full ring-1 ring-gray-200/80 dark:ring-zinc-700 shadow-lg">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-primary flex items-center justify-center shadow-sm">
                                <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">Ask me anything</span>
                                <p className="text-[10px] text-gray-400 leading-tight">UPI Analytics AI</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes bounce {
                    0%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-6px); }
                }
            `}</style>
        </div>
    );
}
