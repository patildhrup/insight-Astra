import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Mic, Shield } from "lucide-react";

export default function AskMeAnything() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
            <AnimatePresence mode="wait">
                {isOpen ? (
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="w-[90vw] max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative group"
                    >
                        {/* Gradient Border for Expanded State - Optional but keeps consistency */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-violet-600 rounded-2xl blur opacity-20 pointer-events-none"></div>

                        <div className="relative bg-white dark:bg-zinc-900 rounded-2xl">
                            {/* Header */}
                            <div className="p-6 pb-2 text-center relative">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="absolute top-4 right-4 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-zinc-500" />
                                </button>

                                <div className="w-20 h-20 mx-auto mb-4 rounded-full p-1 bg-gradient-to-tr from-yellow-400 to-purple-600">
                                    <div className="w-full h-full rounded-full bg-primary overflow-hidden flex items-center justify-center">
                                        <Shield className="w-10 h-10 text-white" />
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
                                    AI Security Assistant
                                </h2>
                                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4 px-6 leading-tight">
                                    I can help you monitor transactions, analyze fraud alerts, and answer questions about your system security.
                                </h3>

                                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto mb-6">
                                    Ask me anything about your dashboard
                                </p>
                            </div>



                            {/* Input Area */}
                            <div className="p-4 pt-2">
                                <div className="relative">
                                    {/* Gradient Border Wrapper */}
                                    <div className="p-[2px] rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600">
                                        <input
                                            type="text"
                                            placeholder="Ask me anything..."
                                            className="w-full pl-12 pr-12 py-4 bg-white dark:bg-zinc-800 border-none rounded-full outline-none text-zinc-700 dark:text-zinc-200 placeholder-zinc-400 transition-all focus:ring-0"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                                        <MessageCircle className="w-5 h-5" />
                                    </div>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                        <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full text-zinc-400 transition-colors">
                                            <Mic className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-full text-zinc-600 dark:text-zinc-300 transition-colors">
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-center mt-3">
                                    <p className="text-[10px] text-zinc-400">
                                        AI can make mistakes. Please double-check responses.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="pill"
                        layoutId="ama-pill"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setIsOpen(true)}
                        className="cursor-pointer group relative"
                    >
                        {/* Glowing Gradient Border Effect - Exact implementation requested */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-violet-600 rounded-full blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>

                        <div className="relative flex items-center gap-3 pl-2 pr-6 py-2 bg-white dark:text-white dark:bg-zinc-900 rounded-full ring-1 ring-gray-900/5 leading-none">

                            <div className="relative w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-primary to-purple-600">
                                <div className="w-full h-full rounded-full bg-primary flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <span className="relative text-lg font-medium text-slate-800 dark:text-zinc-200">
                                Ask me anything
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
