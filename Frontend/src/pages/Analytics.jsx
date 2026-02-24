import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from "recharts";
import { useAnalytics } from "@/context/AnalyticsContext";
import { getAnalyticsSummary } from "@/services/api";
import { Activity, LayoutDashboard, TrendingUp, AlertTriangle } from "lucide-react";

// StatCard from Dashboard.jsx (could be moved to a shared component)
function StatCard({ label, value, icon: Icon, color, bg, subtitle }) {
    return (
        <Card className="border-none shadow-sm rounded-2xl bg-white p-2 text-left">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-500">{label}</CardTitle>
                <div className={`${bg} p-2 rounded-xl`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
            </CardContent>
        </Card>
    );
}

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

export default function Analytics() {
    const { lastAnalysis } = useAnalytics();
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAnalyticsSummary().then(res => {
            setKpis(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const chartTitle = lastAnalysis?.chart_data?.title || "Transaction Volume by Category";
    const chartType = lastAnalysis?.chart_data?.type || "bar";
    const chartData = lastAnalysis?.chart_data?.data || [
        { name: "Food", value: 4500 },
        { name: "Shopping", value: 3200 },
        { name: "Travel", value: 2100 },
        { name: "Bills", value: 1800 },
        { name: "Other", value: 1200 }
    ];

    const renderChart = () => {
        if (chartType === "bar") {
            return (
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            );
        }

        if (chartType === "pie") {
            return (
                <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={120}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            );
        }

        if (chartType === "line") {
            return (
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                </ResponsiveContainer>
            );
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-left">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Data Analytics</h1>
                <p className="text-gray-500 mt-2">
                    Deep dive into your transaction patterns and risk distribution.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Transaction Volume"
                    value={kpis?.total_transactions?.toLocaleString() || "—"}
                    icon={Activity}
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                    subtitle="Last 30 days"
                />
                <StatCard
                    label="Avg Fraud Risk"
                    value={`${kpis?.fraud_rate_pct || "—"}%`}
                    icon={TrendingUp}
                    color="text-rose-600"
                    bg="bg-rose-50"
                    subtitle="System wide metric"
                />
                <StatCard
                    label="Active Locations"
                    value={kpis?.unique_states || "—"}
                    icon={LayoutDashboard}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                    subtitle="Pan-India coverage"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl bg-white p-6 overflow-hidden">
                    <CardHeader className="px-0 pt-0 pb-6">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl font-bold text-left">{chartTitle}</CardTitle>
                            {lastAnalysis && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
                                    <Sparkles className="w-3 h-3" />
                                    AI Insight View
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {renderChart()}
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-3xl bg-indigo-600 p-8 text-white flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-bold mb-4 opacity-100">AI Narrative</h3>
                        <p className="text-indigo-100 leading-relaxed text-left italic">
                            {lastAnalysis?.answer || "Ask our AI Agent to analyze specific patterns, compare segments, or predict risks. The dashboard will automatically update to visualize the findings."}
                        </p>
                    </div>
                    {lastAnalysis && (
                        <div className="mt-8 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                            <div className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-1">Last Query</div>
                            <div className="text-sm font-medium line-clamp-2">{lastAnalysis.query}</div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

function Sparkles({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></svg>
    );
}
