import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    BarChart3,
    Settings,
    LogOut,
    Bell,
    Search,
    FileText,
    BrainCircuit,
    Activity,
    User as UserIcon,
    Zap,
    ChevronLeft,
    ChevronRight,
    Menu,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "../context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AskMeAnything from "@/components/AskMeAnything";
import { Badge } from "@/components/ui/badge";

const sidebarLinks = [
    { name: "Overview", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Executive Simulator", icon: Zap, path: "/dashboard/executive-simulator" },
    { name: "Benchmark Performance", icon: Activity, path: "/dashboard/benchmark" },
    { name: "AI Business Advisor", icon: BrainCircuit, path: "/dashboard/business-advisor" },
    { name: "Analytics", icon: BarChart3, path: "/dashboard/analytics" },
    { name: "AI Reports", icon: FileText, path: "/dashboard/auto-report" },
    { name: "Settings", icon: Settings, path: "/dashboard/settings" },
];

export default function DashboardLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, signOut, loading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Responsive: collapse sidebar on small screens by default
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const [notifications, setNotifications] = useState([
        { id: 1, title: "Significant Fraud Increase", message: "Large volume spike in Maharashtra identified (>12%)", severity: "High", time: "2m ago" },
        { id: 2, title: "Revenue Drop Alert", message: "Unexpected 15% revenue drop in Gaming segment.", severity: "Medium", time: "15m ago" }
    ]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            navigate("/login");
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="bg-gradient-to-br from-[#DD2C00] to-[#FF6B35] p-3 rounded-xl shadow-lg animate-pulse">
                            <Zap className="w-8 h-8 text-white" fill="white" />
                        </div>
                    </div>
                    <p className="text-gray-500 font-medium animate-pulse">Authenticating...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const handleSignOut = async () => {
        await signOut();
        navigate("/login");
    };

    const userEmail = user?.email || "user@example.com";
    const fullName = user?.user_metadata?.full_name || user?.user_metadata?.first_name || "Admin User";
    const avatarUrl = user?.user_metadata?.avatar_url;
    const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase();

    const SidebarContent = ({ collapsed }) => (
        <div className="flex flex-col h-full p-4">
            {/* Logo — clickable, goes to home */}
            <Link
                to="/"
                className="flex items-center gap-3 px-2 mb-10 group"
                onClick={() => setIsMobileSidebarOpen(false)}
            >
                <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-primary/30 rounded-lg blur-sm group-hover:bg-primary/50 transition-all duration-300 scale-110" />
                    <div className="relative bg-gradient-to-br from-[#DD2C00] to-[#FF6B35] p-1.5 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Zap className="w-5 h-5 text-white" fill="white" />
                    </div>
                </div>
                {!collapsed && (
                    <span className="font-black text-lg tracking-tight overflow-hidden whitespace-nowrap">
                        <span
                            className="bg-gradient-to-r from-[#DD2C00] via-[#FF6B35] to-[#DD2C00] bg-clip-text text-transparent"
                            style={{ backgroundSize: "200% auto", animation: "shine 3s linear infinite" }}
                        >
                            Xtreme
                        </span>
                    </span>
                )}
            </Link>

            <nav className="flex-1 space-y-1 text-left">
                {sidebarLinks.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.name}
                            to={link.path}
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "text-gray-500 hover:bg-red-100 hover:text-red-700 hover:shadow-lg hover:shadow-red-600/30"
                                }`}
                        >
                            <link.icon className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && <span className="font-medium">{link.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all mt-auto"
            >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium">Sign Out</span>}
            </button>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            {/* Desktop Sidebar */}
            <aside className={`hidden md:flex fixed left-0 top-0 bottom-0 z-40 bg-white border-r border-gray-100 transition-all duration-300 flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
                <SidebarContent collapsed={!isSidebarOpen} />
                {/* Toggle button */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:shadow-md transition-all z-50"
                >
                    {isSidebarOpen
                        ? <ChevronLeft className="w-4 h-4 text-gray-500" />
                        : <ChevronRight className="w-4 h-4 text-gray-500" />
                    }
                </button>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileSidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}
            <aside className={`md:hidden fixed left-0 top-0 bottom-0 z-50 bg-white border-r border-gray-100 transition-all duration-300 w-64 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="absolute right-4 top-4 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>
                <SidebarContent collapsed={false} />
            </aside>

            {/* Main Content */}
            <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
                {/* Topbar */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between gap-4">
                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsMobileSidebarOpen(true)}
                        aria-label="Open sidebar"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="flex-1 max-w-md relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input placeholder="Search records..." className="pl-10 bg-gray-50 border-none rounded-xl h-10 w-full" />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-500 relative"
                                onClick={() => setIsNotifOpen(!isNotifOpen)}
                            >
                                <Bell className="w-5 h-5" />
                                {notifications.length > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                                )}
                            </Button>

                            <AnimatePresence>
                                {isNotifOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100]"
                                    >
                                        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                            <h3 className="font-bold text-sm">Smart Alerts</h3>
                                            <Badge variant="secondary" className="text-[10px]">{notifications.length} New</Badge>
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto">
                                            {notifications.map(n => (
                                                <div key={n.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${n.severity === 'High' ? 'text-red-500' : 'text-amber-500'}`}>
                                                            {n.severity} Priority
                                                        </span>
                                                        <span className="text-[10px] text-gray-400">{n.time}</span>
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-900 mb-1">{n.title}</p>
                                                    <p className="text-[11px] text-gray-500 leading-relaxed">{n.message}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-3 text-center border-t border-gray-50">
                                            <button className="text-xs font-bold text-primary hover:underline">View All Notifications</button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-2 sm:gap-3 px-2 hover:bg-gray-100 rounded-xl h-12 transition-colors">
                                    <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                                        <AvatarImage src={avatarUrl} />
                                        <AvatarFallback className="bg-primary text-white text-xs">{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="hidden sm:flex flex-col items-start pr-2">
                                        <span className="text-sm font-bold text-gray-900 leading-none mb-1">{fullName}</span>
                                        <span className="text-[11px] text-gray-500 leading-none">{userEmail}</span>
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 mt-2 border-gray-100 shadow-xl">
                                <DropdownMenuLabel className="font-normal p-4">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-bold text-gray-900 leading-none">{fullName}</p>
                                        <p className="text-xs text-gray-500 leading-none pt-1">{userEmail}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-gray-50" />
                                <DropdownMenuItem className="rounded-xl p-3 cursor-pointer hover:bg-gray-50 transition-colors focus:bg-gray-50">
                                    <UserIcon className="mr-3 h-4 w-4 text-gray-500" />
                                    <span className="font-medium text-gray-700">Profile Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => navigate("/dashboard/settings")}
                                    className="rounded-xl p-3 cursor-pointer hover:bg-gray-50 transition-colors focus:bg-gray-50"
                                >
                                    <Settings className="mr-3 h-4 w-4 text-gray-500" />
                                    <span className="font-medium text-gray-700">Workspace Management</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-gray-50" />
                                <DropdownMenuItem
                                    onClick={handleSignOut}
                                    className="rounded-xl p-3 cursor-pointer text-red-500 hover:bg-red-50 transition-colors focus:bg-red-50"
                                >
                                    <LogOut className="mr-3 h-4 w-4" />
                                    <span className="font-medium">Sign Out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <div className="p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
                <AskMeAnything />
            </main>

            <style>{`
                @keyframes shine {
                    0% { background-position: 0% center; }
                    100% { background-position: 200% center; }
                }
            `}</style>
        </div>
    );
}
