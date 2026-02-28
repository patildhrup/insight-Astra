import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import {
    ArrowUpRight,
    ShieldAlert,
    ShieldCheck,
    Activity,
    IndianRupee,
    Loader2,
    AlertTriangle,
    Bell,
    Settings,
    Play,
    Thermometer,
    Globe,
    TrendingDown,
    Map,
    Sparkles,
    TrendingUp,
    LayoutDashboard,
    BrainCircuit,
    Lightbulb,
    TrendingUp as TrendUpIcon
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { simulateAction, fetchHeatmapData, getAnalyticsSummary } from "@/services/api";
import confetti from "canvas-confetti";
import { useAuth } from "../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const SAMPLE_TRANSACTIONS = [
    { id: "UPI-9012", user: "Priya Sharma", amount: "₹1,200", date: "Today, 11:45 AM", risk: "Low", status: "Approved" },
    { id: "UPI-9011", user: "Rahul Mehta", amount: "₹45,000", date: "Today, 10:20 AM", risk: "High", status: "Flagged" },
    { id: "UPI-9010", user: "Ananya Singh", amount: "₹350", date: "Today, 09:12 AM", risk: "Low", status: "Approved" },
    { id: "UPI-9009", user: "Unknown", amount: "₹8,900", date: "Yesterday, 11:55 PM", risk: "Medium", status: "Review" },
    { id: "UPI-9008", user: "Vikram Patel", amount: "₹2,100", date: "Yesterday, 08:30 PM", risk: "Low", status: "Approved" },
];

function StatCard({ label, value, icon: Icon, color, bg, subtitle, loading }) {
    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            <Card className="border border-gray-100 hover:border-red-300 shadow-md rounded-2xl bg-white p-2 transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/40">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-gray-500">{label}</CardTitle>
                    <div className={`${bg} p-2 rounded-xl`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center gap-2 h-8">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            <span className="text-sm text-gray-400">Loading...</span>
                        </div>
                    ) : (
                        <>
                            <div className="text-2xl font-bold">{value}</div>
                            {subtitle && (
                                <div className="flex items-center text-xs text-emerald-500 font-medium mt-1">
                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                    {subtitle}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    const [kpis, setKpis] = useState(null);
    const [kpiLoading, setKpiLoading] = useState(true);
    const [kpiError, setKpiError] = useState(null);

    useEffect(() => {
        const hasSeenConfetti = localStorage.getItem(`confetti_shown_${user?.id}`);
        if (user && !hasSeenConfetti) {
            const duration = 5 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
            const randomInRange = (min, max) => Math.random() * (max - min) + min;
            const interval = setInterval(function () {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) return clearInterval(interval);
                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
            localStorage.setItem(`confetti_shown_${user?.user_id || user?.id}`, "true");
        }
    }, [user]);

    useEffect(() => {
        getAnalyticsSummary()
            .then((res) => {
                setKpis(res.data);
                setKpiLoading(false);
            })
            .catch((err) => {
                setKpiError(err.message);
                setKpiLoading(false);
            });
    }, []);

    const stats = kpis
        ? [
            {
                label: "Total Transactions",
                value: kpis.total_transactions?.toLocaleString("en-IN"),
                icon: Activity,
                color: "text-blue-500",
                bg: "bg-blue-50",
                subtitle: `${kpis.unique_categories} categories`,
            },
            {
                label: "Avg Transaction",
                value: `₹${Number(kpis.avg_amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
                icon: IndianRupee,
                color: "text-emerald-500",
                bg: "bg-emerald-50",
                subtitle: "per transaction",
            },
            {
                label: "Fraud Rate",
                value: `${kpis.fraud_rate_pct}%`,
                icon: ShieldAlert,
                color: "text-red-500",
                bg: "bg-red-50",
                subtitle: `${kpis.fraud_count?.toLocaleString("en-IN")} flagged`,
            },
            {
                label: "Failure Rate",
                value: `${kpis.failure_rate_pct}%`,
                icon: ShieldCheck,
                color: "text-amber-500",
                bg: "bg-amber-50",
                subtitle: `${kpis.unique_states} states covered`,
            },
        ]
        : [
            { label: "Total Transactions", value: "—", icon: Activity, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Avg Transaction", value: "—", icon: IndianRupee, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "Fraud Rate", value: "—", icon: ShieldAlert, color: "text-red-500", bg: "bg-red-50" },
            { label: "Failure Rate", value: "—", icon: ShieldCheck, color: "text-amber-500", bg: "bg-amber-50" },
        ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 text-left">
                        Welcome back, {user?.user_metadata?.first_name || 'Chief'}!
                    </h1>
                    <p className="text-gray-500 text-left">
                        Real-time UPI transaction insights powered by AI. {kpis && <span className="text-emerald-600 font-medium">✓ Live data loaded</span>}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="px-3 py-1 border-primary/20 bg-primary/5 text-primary">
                        System Online
                    </Badge>
                </div>
            </div>

            {kpiError && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Could not load live KPIs — backend may be offline. Showing placeholder data. <em>Start the backend with <code>uvicorn main:app --reload</code></em></span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                {stats.map((stat) => (
                    <StatCard key={stat.label} {...stat} loading={kpiLoading} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 6. Live Risk Heatmap */}
                <div className="lg:col-span-3">
                    <RiskHeatmap />
                </div>
            </div>

            <Card className="border-none shadow-md rounded-2xl bg-white overflow-hidden text-left transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/40">
                <CardHeader className="px-6 py-6 border-b border-gray-50">
                    <CardTitle className="text-lg font-bold">Recent UPI Transactions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="px-6">Transaction ID</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Risk Level</TableHead>
                                <TableHead className="px-6 text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(kpis?.recent_transactions || SAMPLE_TRANSACTIONS).map((tx) => (
                                <TableRow key={tx.id} className="hover:bg-gray-50/30 transition-colors">
                                    <TableCell className="px-6 font-medium text-gray-900">{tx.id}</TableCell>
                                    <TableCell>{tx.user}</TableCell>
                                    <TableCell>
                                        {typeof tx.amount === 'number'
                                            ? `₹${tx.amount.toLocaleString("en-IN")}`
                                            : tx.amount}
                                    </TableCell>
                                    <TableCell className="text-gray-500">{tx.date}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={`rounded-full px-3 py-0.5 ${tx.risk === 'High' ? 'bg-red-50 text-red-600' :
                                                tx.risk === 'Medium' ? 'bg-amber-50 text-amber-600' :
                                                    'bg-emerald-50 text-emerald-600'
                                                }`}
                                        >
                                            {tx.risk}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-6 text-right">
                                        <span className={`text-sm font-semibold ${tx.status === 'Flagged' || tx.status === 'Failed' ? 'text-red-500' :
                                            tx.status === 'Review' ? 'text-amber-500' :
                                                'text-emerald-500'
                                            }`}>
                                            {tx.status}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}



function RiskHeatmap() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHeatmapData().then(res => {
            setData(res.data || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const getColor = (val) => {
        if (val > 4) return "bg-red-500";
        if (val > 2) return "bg-amber-500";
        return "bg-emerald-500";
    };

    if (loading) return (
        <Card className="h-full border-none shadow-sm rounded-2xl bg-white flex items-center justify-center p-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
        </Card>
    );

    const states = [...new Set(data.map(d => d.state))];
    const times = ["Morning", "Afternoon", "Evening", "Night"];

    return (
        <Card className="border-none shadow-md rounded-2xl bg-white overflow-hidden h-full transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/40">
            <CardHeader className="px-6 py-5 border-b border-gray-50 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-bold">Live Risk Heatmap</CardTitle>
                    <p className="text-xs text-gray-400">Regional Fraud Density by Time Slot</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Low</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Critical</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="overflow-x-auto">
                    <div className="min-w-[500px]">
                        <div className="grid grid-cols-5 gap-2 mb-2">
                            <div />
                            {times.map(t => (
                                <div key={t} className="text-center text-[10px] font-bold text-gray-400 uppercase">{t}</div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            {states.map(state => (
                                <div key={state} className="grid grid-cols-5 gap-2 items-center">
                                    <div className="text-xs font-medium text-gray-600 truncate">{state}</div>
                                    {times.map(time => {
                                        const val = data.find(d => d.state === state && d.time === time)?.value || 0;
                                        return (
                                            <motion.div
                                                key={time}
                                                whileHover={{ scale: 1.05 }}
                                                className={`h-8 rounded-lg ${getColor(val)} opacity-80 cursor-pointer shadow-sm relative group`}
                                            >
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[10px] font-bold text-white">{val}%</span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
