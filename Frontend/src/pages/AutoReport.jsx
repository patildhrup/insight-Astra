import { useAnalytics } from "@/context/AnalyticsContext";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import {
    TrendingUp, TrendingDown, IndianRupee, Activity, ShieldCheck,
    AlertTriangle, Calendar, FileText, Download, Share2, Sparkles,
    BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const COLORS = ["#F59E0B", "#3B82F6", "#8B5CF6", "#10B981", "#EF4444"];

export default function AutoReport() {
    const { lastReport } = useAnalytics();
    const reportRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);

    const handleExportPDF = async () => {
        if (!reportRef.current) return;

        setIsExporting(true);
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff"
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "px",
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
            pdf.save(`${lastReport.title.replace(/\s+/g, "_")}.pdf`);
        } catch (error) {
            console.error("PDF Export failed:", error);
        } finally {
            setIsExporting(false);
        }
    };

    const EmptyState = () => {
        const examples = [
            "Generate a monthly transaction report",
            "Show fraud trends by merchant category",
            "Executive health synthesis for Maharashtra",
            "Weekly KPI dashboard with distribution graphs"
        ];

        return (
            <div className="relative min-h-[70vh] flex items-center justify-center p-6 overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 90, 0],
                            opacity: [0.1, 0.2, 0.1]
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]"
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.3, 1],
                            rotate: [0, -90, 0],
                            opacity: [0.1, 0.15, 0.1]
                        }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-violet-500/10 rounded-full blur-[120px]"
                    />
                </div>

                <div className="relative z-10 max-w-2xl w-full">
                    <div className="text-center mb-12">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="inline-block relative mb-8"
                        >
                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse" />
                            <div className="relative bg-white p-6 rounded-[2.5rem] shadow-2xl border border-gray-100">
                                <FileText className="w-12 h-12 text-primary" />
                                <motion.div
                                    animate={{ y: [0, -8, 0], rotate: [0, 10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="absolute -top-4 -right-4 bg-violet-500 text-white p-2 rounded-xl shadow-lg"
                                >
                                    <Sparkles className="w-4 h-4" />
                                </motion.div>
                                <motion.div
                                    animate={{ y: [0, 8, 0], rotate: [0, -10, 0] }}
                                    transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                                    className="absolute -bottom-2 -left-6 bg-emerald-500 text-white p-2 rounded-xl shadow-lg"
                                >
                                    <Activity className="w-4 h-4" />
                                </motion.div>
                            </div>
                        </motion.div>

                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-4xl font-black text-gray-900 tracking-tight mb-4"
                        >
                            Awaiting Intelligence
                        </motion.h2>
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-gray-500 text-lg font-medium leading-relaxed px-4"
                        >
                            Your automated command center is ready. Initialize your first report by prompting the AI Assistant below.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 px-4">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white/40 backdrop-blur-xl border border-white/60 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <h4 className="font-bold text-gray-900 mb-1">Time-Based Reports</h4>
                            <p className="text-xs text-gray-500 leading-relaxed font-medium">Generate daily, weekly, or monthly executive summaries.</p>
                        </motion.div>
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white/40 backdrop-blur-xl border border-white/60 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="w-10 h-10 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <AlertTriangle className="w-5 h-5 text-violet-600" />
                            </div>
                            <h4 className="font-bold text-gray-900 mb-1">Risk Deep Dives</h4>
                            <p className="text-xs text-gray-500 leading-relaxed font-medium">Ask for fraud distribution and regional failure heatmaps.</p>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="space-y-3 px-4"
                    >
                        <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest text-center mb-4">Try these prompts</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {examples.map((ex, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        // Dispatch a custom event or just let the user copy it
                                        navigator.clipboard.writeText(ex);
                                        // Could add a toast here
                                    }}
                                    className="bg-white border border-gray-100 hover:border-primary/50 px-4 py-2 rounded-full text-xs font-bold text-gray-600 hover:text-primary transition-all hover:shadow-lg hover:shadow-primary/5"
                                >
                                    {ex}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    };

    if (!lastReport) {
        return <EmptyState />;
    }

    const { kpis, trend, breakdowns, title, insights } = lastReport;

    return (
        <div ref={reportRef} className="space-y-8 animate-in fade-in duration-700 bg-white p-8 rounded-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/40">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI-Generated Report
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">{title}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:shadow-red-600/30"
                    >
                        <Download className="w-4 h-4" /> {isExporting ? "Exporting..." : "Export PDF"}
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all duration-300 hover:shadow-lg hover:shadow-red-600/40">
                        <Share2 className="w-4 h-4" /> Share
                    </button>
                </div>
            </div>

            {/* AI Narrative Insight */}
            {insights && insights.length > 0 && (
                <div className="bg-gradient-to-br from-primary/5 to-violet-500/5 rounded-3xl p-6 border border-primary/10 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/40">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Sparkles className="w-24 h-24 text-primary" />
                    </div>
                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Executive Summary
                    </h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 leading-relaxed font-medium">
                        <ReactMarkdown>{insights[0]}</ReactMarkdown>
                    </div>
                </div>
            )}

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Volume"
                    value={kpis?.volume || 0}
                    icon={Activity}
                    sub="Transactions"
                />
                <KPICard
                    title="Revenue"
                    value={kpis?.total_amount ? `₹${(kpis.total_amount / 100000).toFixed(1)}L` : "₹0"}
                    icon={IndianRupee}
                    trend={+12.5}
                />
                <KPICard
                    title="Fraud Rate"
                    value={`${(kpis?.fraud_rate || 0).toFixed(2)}%`}
                    icon={ShieldCheck}
                    variant={kpis?.fraud_rate > 2 ? "danger" : "success"}
                />
                <KPICard
                    title="Success Rate"
                    value={`${(kpis?.success_rate || 0).toFixed(1)}%`}
                    icon={Activity}
                    variant={kpis?.success_rate < 90 ? "warning" : "success"}
                />
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trend Chart */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-md transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/40">
                    <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" /> Transaction Volume Trend
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trend || []}>
                                <defs>
                                    <linearGradient id="colorSum" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" hide />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorSum)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Merchant Breakdown */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/40">
                    <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" /> Top Categories
                    </h3>
                    <div className="space-y-4">
                        {breakdowns?.merchant?.map((item, i) => (
                            <div key={item.label} className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className="text-gray-600">{item.label}</span>
                                    <span className="text-gray-900">{item.value.toLocaleString()}</span>
                                </div>
                                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(item.value / (breakdowns.merchant[0]?.value || 1)) * 100}%` }}
                                        className="h-full bg-primary"
                                    />
                                </div>
                            </div>
                        )) || <p className="text-xs text-center text-gray-400 py-10">No category breakdown available</p>}
                    </div>
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/40">
                    <h3 className="text-sm font-bold text-gray-900 mb-6">Regional Performance (Top 5 States)</h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={breakdowns?.state || []} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="label" type="category" width={80} tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/40">
                    <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" /> Platform Insights
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {breakdowns?.device?.map((item, i) => (
                            <div key={item.label} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/40 hover:border-red-400">
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">{item.label}</p>
                                <p className="text-lg font-black text-gray-900">{item.value.toLocaleString()}</p>
                                <p className="text-[10px] text-primary font-bold">Active Devices</p>
                            </div>
                        )) || <p className="text-xs text-center text-gray-400 py-10 w-full col-span-2">No device logs found</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, icon: Icon, trend, sub, variant = "default" }) {
    const variants = {
        default: "text-primary bg-primary/10",
        danger: "text-red-600 bg-red-50",
        warning: "text-amber-600 bg-amber-50",
        success: "text-emerald-600 bg-emerald-50"
    };

    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/40">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl ${variants[variant]}`}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
            <h4 className="text-2xl font-black text-gray-900 tracking-tight">{value}</h4>
            {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
        </div>
    );
}
