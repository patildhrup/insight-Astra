import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
    Play,
    Activity,
    Loader2,
    Sparkles
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { simulateAction } from "@/services/api";

export default function ExecutiveSimulator() {
    const [action, setAction] = useState("Reduce Transaction Limit");
    const [percentage, setPercentage] = useState([20]);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSimulate = async () => {
        setLoading(true);
        try {
            const data = await simulateAction(action, percentage[0]);
            setResult(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 text-left hover:text-primary transition-colors duration-200">Executive Simulator</h1>
                    <p className="text-gray-500 text-left hover:text-gray-700 transition-colors duration-200">
                        Simulate the impact of executive actions on fraud rates and business metrics
                    </p>
                </div>
                <Badge variant="outline" className="px-3 py-1 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all duration-200">
                    Live Simulation
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-md rounded-2xl bg-zinc-900 text-white overflow-hidden h-full transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/30">
                    <CardHeader className="bg-zinc-800/50 border-b border-zinc-700/50">
                        <div className="flex items-center gap-2">
                            <Play className="w-4 h-4 text-emerald-400" />
                            <CardTitle className="text-sm font-bold uppercase tracking-widest">Executive Action Simulator</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] text-zinc-400 uppercase font-bold">Target Action</label>
                                <Select value={action} onValueChange={setAction}>
                                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:border-red-500/50 transition-all duration-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-200">
                                        <SelectItem value="Reduce Transaction Limit">Reduce Transaction Limit</SelectItem>
                                        <SelectItem value="Increase Fraud Monitoring">Increase Fraud Monitoring</SelectItem>
                                        <SelectItem value="Block Risky Device Type">Block Risky Device Type</SelectItem>
                                        <SelectItem value="Enable Extra Verification">Enable Extra Verification</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between">
                                    <label className="text-[10px] text-zinc-400 uppercase font-bold">Intensity / Reach</label>
                                    <span className="text-xs text-emerald-400 font-bold">{percentage}%</span>
                                </div>
                                <Slider
                                    value={percentage}
                                    onValueChange={setPercentage}
                                    max={100}
                                    step={5}
                                    className="py-4"
                                />
                            </div>

                            <button
                                onClick={handleSimulate}
                                disabled={loading}
                                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-red-600/30 hover:scale-[1.02]"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Simulate Impact
                            </button>
                        </div>

                        {result && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50 grid grid-cols-2 gap-4 transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/30"
                            >
                                <div className="text-center p-3 rounded-xl bg-zinc-700/30 hover:bg-zinc-700/50 transition-all duration-200">
                                    <p className="text-[9px] text-zinc-400 uppercase">Fraud Change</p>
                                    <p className={`text-lg font-bold ${result.fraud_change < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {result.fraud_change}%
                                    </p>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-zinc-700/30 hover:bg-zinc-700/50 transition-all duration-200">
                                    <p className="text-[9px] text-zinc-400 uppercase">Revenue Impact</p>
                                    <p className={`text-lg font-bold ${result.revenue_change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {result.revenue_change > 0 ? '+' : ''}{result.revenue_change}%
                                    </p>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-zinc-700/30 hover:bg-zinc-700/50 transition-all duration-200">
                                    <p className="text-[9px] text-zinc-400 uppercase">Complaints</p>
                                    <p className={`text-lg font-bold ${result.complaints_change >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {result.complaints_change > 0 ? '+' : ''}{result.complaints_change}%
                                    </p>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-zinc-700/30 hover:bg-zinc-700/50 transition-all duration-200">
                                    <p className="text-[9px] text-zinc-400 uppercase">User Impact</p>
                                    <p className={`text-lg font-bold ${result.user_impact >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {result.user_impact > 0 ? '+' : ''}{result.user_impact}%
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md rounded-2xl bg-white overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/30">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary" />
                            <CardTitle className="text-sm font-bold uppercase tracking-widest">Simulation Insights</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:shadow-red-500/10">
                            <h4 className="font-bold text-blue-800 text-sm mb-2">Pro Tip</h4>
                            <p className="text-blue-700 text-sm">
                                Use the simulator to evaluate the trade-offs between fraud reduction and business impact before implementing real policy changes.
                            </p>
                        </div>
                        
                        <div className="space-y-3">
                            <h4 className="font-bold text-gray-800 text-sm">Common Scenarios:</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 hover:shadow-sm hover:shadow-red-500/5">
                                    <span className="text-gray-600">Reduce Transaction Limit (20%)</span>
                                    <span className="font-medium">Fraud: -8%, Revenue: -4%</span>
                                </div>
                                <div className="flex justify-between text-sm p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 hover:shadow-sm hover:shadow-red-500/5">
                                    <span className="text-gray-600">Increase Fraud Monitoring (30%)</span>
                                    <span className="font-medium">Fraud: -18%, Complaints: +9%</span>
                                </div>
                                <div className="flex justify-between text-sm p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 hover:shadow-sm hover:shadow-red-500/5">
                                    <span className="text-gray-600">Enable Extra Verification (15%)</span>
                                    <span className="font-medium">Fraud: -25%, User Impact: +10%</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}