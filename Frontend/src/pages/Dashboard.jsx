import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import {
    ArrowUpRight,
    ShieldAlert,
    ShieldCheck,
    Activity,
    UserCheck
} from "lucide-react";
import confetti from "canvas-confetti";
import { useAuth } from "../context/AuthContext";

const stats = [
    { label: "Total Transactions", value: "1,284", icon: Activity, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Fraud Alerts", value: "12", icon: ShieldAlert, color: "text-red-500", bg: "bg-red-50" },
    { label: "Scanned Protected", value: "99.8%", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Legit Users", value: "854", icon: UserCheck, color: "text-amber-500", bg: "bg-amber-50" },
];

const transactions = [
    { id: "TX-9012", user: "Emma Vance", amount: "$120.00", date: "Today, 11:45 AM", risk: "Low", status: "Approved" },
    { id: "TX-9011", user: "Michael Chen", amount: "$4,500.00", date: "Today, 10:20 AM", risk: "High", status: "Flagged" },
    { id: "TX-9010", user: "Sarah Jenkins", amount: "$35.20", date: "Today, 09:12 AM", risk: "Low", status: "Approved" },
    { id: "TX-9009", user: "Unknown (VPN)", amount: "$890.00", date: "Yesterday, 11:55 PM", risk: "Medium", status: "Review" },
    { id: "TX-9008", user: "David Smith", amount: "$210.00", date: "Yesterday, 08:30 PM", risk: "Low", status: "Approved" },
];

export default function Dashboard() {
    const { user } = useAuth();

    useEffect(() => {
        const hasSeenConfetti = localStorage.getItem(`confetti_shown_${user?.id}`);
        if (user && !hasSeenConfetti) {
            const duration = 5 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min, max) => Math.random() * (max - min) + min;

            const interval = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            localStorage.setItem(`confetti_shown_${user?.user_id || user?.id}`, "true");
        }
    }, [user]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 text-left">
                    Welcome back, {user?.user_metadata?.first_name || 'Chief'}!
                </h1>
                <p className="text-gray-500 text-left">Monitor your system's security and activity in real-time.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                {stats.map((stat) => (
                    <Card key={stat.label} className="border-none shadow-sm rounded-2xl bg-white p-2">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-gray-500">{stat.label}</CardTitle>
                            <div className={`${stat.bg} p-2 rounded-xl`}>
                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <div className="flex items-center text-xs text-emerald-500 font-medium mt-1">
                                <ArrowUpRight className="w-3 h-3 mr-1" />
                                +12% from last week
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden text-left">
                <CardHeader className="px-6 py-6 border-b border-gray-50">
                    <CardTitle className="text-lg font-bold">Recent Transactions</CardTitle>
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
                            {transactions.map((tx) => (
                                <TableRow key={tx.id} className="hover:bg-gray-50/30 transition-colors">
                                    <TableCell className="px-6 font-medium text-gray-900">{tx.id}</TableCell>
                                    <TableCell>{tx.user}</TableCell>
                                    <TableCell>{tx.amount}</TableCell>
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
                                        <span className={`text-sm font-semibold ${tx.status === 'Flagged' ? 'text-red-500' :
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
