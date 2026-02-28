import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
    ArrowUpRight,
    TrendingDown,
    LayoutDashboard,
    Activity,
    IndianRupee,
    Globe,
    ShieldAlert,
    ShieldCheck,
    Loader2
} from "lucide-react";
import { fetchBenchmarkData } from "@/services/api";

function ComparisonCard({ title, current, previous, growth, icon: Icon, isCurrency = false, invertColors = false }) {
    const isPositive = growth > 0;
    const isImproved = invertColors ? !isPositive : isPositive;

    return (
        <Card className="border border-gray-100 shadow-md rounded-2xl bg-white p-4 transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/40">
            <div className="flex justify-between items-start mb-2">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</div>
                <div className={`${isImproved ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} p-1.5 rounded-lg`}>
                    <Icon className="w-3 h-3" />
                </div>
            </div>
            <div className="flex items-baseline gap-2">
                <div className="text-xl font-black">
                    {isCurrency ? `₹${current?.toLocaleString("en-IN")}` : current}
                    {typeof current === 'number' && !isCurrency && current < 100 && '%'}
                </div>
                <div className={`flex items-center text-[10px] font-black ${isImproved ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isPositive ? <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                    {Math.abs(growth)}%
                </div>
            </div>
            <div className="text-[9px] text-gray-400 mt-1 italic font-medium">
                vs {isCurrency ? `₹${previous?.toLocaleString("en-IN")}` : previous}{!isCurrency && previous < 100 && '%'} last period
            </div>
        </Card>
    );
}

export default function BenchmarkPerformance() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBenchmarkData()
            .then(res => setData(res))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="min-h-[400px] flex items-center justify-center">
            <Loader2 className="animate-spin text-primary w-8 h-8" />
        </div>
    );

    if (!data || data.error) return (
        <div className="p-8 text-center text-gray-500">
            Could not load benchmark data.
        </div>
    );

    const mom = data.month_comparison;
    const yoy = data.year_comparison;

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Benchmark Performance</h1>
                    <p className="text-gray-500 mt-1">Comparing current performance against historical data.</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                    <LayoutDashboard className="w-4 h-4 text-primary" />
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Monthly Comparison</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="text-[10px] font-black text-primary uppercase flex items-center gap-2 px-1">
                            <Activity className="w-3 h-3" /> Month-over-Month (MoM)
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <ComparisonCard title="Fraud Rate" current={mom.fraud_rate.current} previous={mom.fraud_rate.previous} growth={mom.fraud_rate.growth} icon={ShieldAlert} invertColors />
                            <ComparisonCard title="Fraud Loss" current={mom.fraud_loss.current} previous={mom.fraud_loss.previous} growth={mom.fraud_loss.growth} icon={IndianRupee} isCurrency invertColors />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="text-[10px] font-black text-primary uppercase flex items-center gap-2 px-1">
                            <Globe className="w-3 h-3" /> Year-over-Year (YoY)
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <ComparisonCard title="Approval Rate" current={yoy.approval_rate.current} previous={yoy.approval_rate.previous} growth={yoy.approval_rate.growth} icon={ShieldCheck} />
                            <ComparisonCard title="Transactions" current={yoy.transactions.current} previous={yoy.transactions.previous} growth={yoy.transactions.growth} icon={Activity} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
