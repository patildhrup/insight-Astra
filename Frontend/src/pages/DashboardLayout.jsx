import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    ArrowLeftRight,
    AlertCircle,
    BarChart3,
    Settings,
    LogOut,
    Shield,
    Bell,
    Search,
    User as UserIcon
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

const sidebarLinks = [
    { name: "Overview", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Transactions", icon: ArrowLeftRight, path: "/dashboard/transactions" },
    { name: "Fraud Alerts", icon: AlertCircle, path: "/dashboard/alerts" },
    { name: "Analytics", icon: BarChart3, path: "/dashboard/analytics" },
    { name: "Settings", icon: Settings, path: "/dashboard/settings" },
];

export default function DashboardLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, signOut, loading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            navigate("/login");
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Shield className="w-12 h-12 text-primary animate-pulse" />
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

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            {/* Sidebar */}
            <aside className={`fixed left-0 top-0 bottom-0 z-40 bg-white border-r border-gray-100 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
                <div className="flex flex-col h-full p-4">
                    <div className="flex items-center gap-3 px-2 mb-10">
                        <Shield className="w-8 h-8 text-primary flex-shrink-0" />
                        {isSidebarOpen && (
                            <span className="font-bold text-lg text-gray-900 whitespace-nowrap">AI Shield</span>
                        )}
                    </div>

                    <nav className="flex-1 space-y-1 text-left">
                        {sidebarLinks.map((link) => {
                            const isActive = location.pathname === link.path;
                            return (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive
                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                        : "text-gray-500 hover:bg-gray-50"
                                        }`}
                                >
                                    <link.icon className="w-5 h-5 flex-shrink-0" />
                                    {isSidebarOpen && <span className="font-medium">{link.name}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all mt-auto"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        {isSidebarOpen && <span className="font-medium">Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
                {/* Topbar */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30 px-8 flex items-center justify-between">
                    <div className="flex-1 max-w-md relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input placeholder="Search records..." className="pl-10 bg-gray-50 border-none rounded-xl h-10" />
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-gray-500 relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-3 px-2 hover:bg-gray-100 rounded-xl h-12 transition-colors">
                                    <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                                        <AvatarImage src={avatarUrl} />
                                        <AvatarFallback className="bg-primary text-white text-xs">{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="hidden md:flex flex-col items-start pr-2">
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
                                <DropdownMenuItem className="rounded-xl p-3 cursor-pointer hover:bg-gray-50 transition-colors focus:bg-gray-50">
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

                <div className="p-8">
                    {children}
                </div>
                <AskMeAnything />
            </main>
        </div>
    );
}

