import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ScatterChart, Scatter
} from "recharts";
import { useAnalytics } from "@/context/AnalyticsContext";
import { getAnalyticsSummary } from "@/services/api";
import { Activity, LayoutDashboard, TrendingUp, AlertTriangle } from "lucide-react";

// StatCard from Dashboard.jsx (could be moved to a shared component)
function StatCard({ label, value, icon: Icon, color, bg, subtitle }) {
    return (
        <Card className="border-none shadow-md rounded-2xl bg-white p-2 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/40">
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

const CHART_COLORS = [
    '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4',
    '#84cc16', '#f97316', '#ef4444'
];

function CustomTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-2xl text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 py-0.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                        <span className="text-xs font-semibold text-white">
                            {entry.name}: {typeof entry.value === 'number' && entry.value > 100 ? `₹${entry.value.toLocaleString()}` : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
}

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
    const keys = lastAnalysis?.chart_data?.keys || ["value"];

    const renderChart = () => {
        const commonProps = {
            data: chartData,
            margin: { top: 10, right: 10, left: 10, bottom: 0 }
        };

        switch (chartType) {
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                            <YAxis fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="value" stroke="url(#lineGradient)" strokeWidth={4} dot={{ r: 6, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }} />
                            <defs>
                                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#a855f7" />
                                </linearGradient>
                            </defs>
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart {...commonProps}>
                            <defs>
                                <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                            <YAxis fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorArea)" />
                        </AreaChart>
                    </ResponsiveContainer>
                );
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                            <YAxis fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'stacked_bar':
                return (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                            <YAxis fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            {keys.map((key, idx) => (
                                <Bar key={key} dataKey={key} stackId="a" fill={CHART_COLORS[idx % CHART_COLORS.length]} radius={idx === keys.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'grouped_bar':
                return (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                            <YAxis fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            {keys.map((key, idx) => (
                                <Bar key={key} dataKey={key} fill={CHART_COLORS[idx % CHART_COLORS.length]} radius={[6, 6, 0, 0]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'pie':
            case 'donut':
                return (
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Tooltip content={<CustomTooltip />} />
                            <Pie
                                data={chartData}
                                innerRadius={chartType === 'donut' ? 80 : 0}
                                outerRadius={120}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                                animationBegin={0}
                                animationDuration={1000}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                );
            case 'scatter':
                return (
                    <ResponsiveContainer width="100%" height={350}>
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" dataKey="x" name="X" fontSize={11} axisLine={false} tickLine={false} unit="k" />
                            <YAxis type="number" dataKey="y" name="Y" fontSize={11} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                            <Scatter name="Transactions" data={chartData} fill="#6366f1" fillOpacity={0.6} />
                        </ScatterChart>
                    </ResponsiveContainer>
                );
            case 'histogram':
                return (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart {...commonProps} barGap={0}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} dy={10} />
                            <YAxis fontSize={11} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" fill="#6366f1" fillOpacity={0.6} radius={[2, 2, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                );
            default:
                return (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData}>
                            <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                        </BarChart>
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
                <Card className="lg:col-span-2 border-none shadow-md rounded-3xl bg-white p-6 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/40">
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

                <Card className="border-none shadow-md rounded-3xl bg-indigo-600 p-8 text-white flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/40">
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
