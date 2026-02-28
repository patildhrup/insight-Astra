import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    BrainCircuit,
    Sparkles,
    TrendingUp,
    TrendingUp as TrendUpIcon,
    Lightbulb,
    Loader2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { askBusinessAdvisor } from "@/services/api";

export default function BusinessAdvisor() {
    const [query, setQuery] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleAsk = async () => {
        if (!query) return;
        setLoading(true);
        try {
            const data = await askBusinessAdvisor(query);
            setResult(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const chartData = [
        { name: 'Current', profit: result?.chart_projection?.current_profit || 0 },
        { name: 'Projected', profit: result?.chart_projection?.projected_profit || 0 },
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">AI Business Advisor</h1>
                    <p className="text-gray-500 mt-1">Strategic profit & fraud simulation powered by AI.</p>
                </div>
            </div>

            <Card className="border-none shadow-md rounded-[2rem] bg-white overflow-hidden border border-primary/5 transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/40">
                <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-transparent p-6 border-b border-gray-50 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary text-white p-2.5 rounded-2xl shadow-lg shadow-primary/20">
                            <BrainCircuit className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black tracking-tight text-gray-900">AI Business Advisor</CardTitle>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Strategic profit & fraud simulation</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter">Live Advisory Active</span>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <div className="relative flex-1">
                            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                                placeholder="How can we optimize our fraud-to-profit ratio this quarter?"
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-red-500/20 focus:border-red-500/50 transition-all outline-none placeholder:text-gray-400"
                            />
                        </div>
                        <button
                            onClick={handleAsk}
                            disabled={loading || !query}
                            className="bg-primary text-white px-8 rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-primary/20 group h-[52px] hover:shadow-lg hover:shadow-red-600/40"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4 group-hover:text-yellow-300 transition-colors" />}
                            Run AI Analysis
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {result && !loading && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                            >
                                <div className="space-y-8">
                                    <div className="bg-emerald-50/30 p-6 rounded-[1.5rem] border border-emerald-100/50 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <TrendingUp className="w-24 h-24 text-emerald-600" />
                                        </div>
                                        <h3 className="text-[10px] font-black uppercase text-emerald-700 mb-3 flex items-center gap-2 tracking-widest">
                                            Executive Assessment
                                        </h3>
                                        <p className="text-sm text-emerald-900 leading-relaxed font-bold italic relative z-10">{result.analysis_summary}</p>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Top Strategic Initiatives</h3>
                                        {result.strategies.map((strat, i) => (
                                            <div key={i} className="bg-white border border-gray-100 p-5 rounded-2xl hover:border-red-400 hover:shadow-lg transition-all duration-300 group relative overflow-hidden hover:shadow-2xl hover:shadow-red-600/40">
                                                <div className="absolute top-0 right-0 h-full w-1 bg-gray-50 group-hover:bg-primary/20 transition-colors" />
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-black text-gray-900 text-base">{strat.title}</h4>
                                                    <Badge className={`text-[9px] font-black px-2 py-0 border-none ${strat.risk_level === 'Low' ? 'bg-emerald-50 text-emerald-600' :
                                                        strat.risk_level === 'Medium' ? 'bg-amber-50 text-amber-600' :
                                                            'bg-red-50 text-red-600'
                                                        }`}>
                                                        {strat.risk_level} RISK
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-gray-500 mb-4 font-medium leading-relaxed">{strat.description}</p>
                                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                                                    <div className="text-emerald-600 font-black text-xs flex items-center gap-1.5">
                                                        <div className="p-1 bg-emerald-50 rounded-md">
                                                            <TrendUpIcon className="w-3 h-3" />
                                                        </div>
                                                        EST. IMPACT: ₹{strat.estimated_profit_impact?.toLocaleString("en-IN")}
                                                    </div>
                                                    <button className="text-[10px] font-black text-primary hover:underline uppercase tracking-tighter">Queue for Q4 ↗</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-gray-50/50 rounded-[2rem] p-8 border border-gray-100 flex flex-col">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 mb-8 flex items-center justify-between tracking-widest px-2">
                                        Simulated Profit Expansion
                                        <span className="text-emerald-500 font-black bg-emerald-100/50 px-2 py-0.5 rounded-lg">
                                            +{Math.round((result.chart_projection.projected_profit / result.chart_projection.current_profit - 1) * 100)}% ROI
                                        </span>
                                    </h3>
                                    <div className="h-[280px] w-full mb-8">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#9ca3af' }} dy={10} />
                                                <YAxis hide />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="bg-zinc-900 p-4 rounded-2xl shadow-2xl border border-zinc-800">
                                                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">{payload[0].payload.name} Phase</p>
                                                                    <p className="text-lg font-black text-white italic">₹{payload[0].value?.toLocaleString("en-IN")}</p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Bar dataKey="profit" radius={[12, 12, 12, 12]} barSize={80}>
                                                    {chartData.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={index === 0 ? '#9ca3af' : '#DD2C00'}
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-auto grid grid-cols-2 gap-4">
                                        <div className="bg-white p-4 rounded-2xl border border-gray-100">
                                            <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Current Baseline</p>
                                            <p className="text-lg font-black text-gray-900">₹{result.chart_projection.current_profit?.toLocaleString("en-IN")}</p>
                                        </div>
                                        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                            <p className="text-[9px] font-black text-primary uppercase mb-1">Projected Peak</p>
                                            <p className="text-lg font-black text-primary">₹{result.chart_projection.projected_profit?.toLocaleString("en-IN")}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </div>
    );
}
