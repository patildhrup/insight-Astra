import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Zap, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
    const { user } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navItems = ["Features", "Solutions", "Pricing", "About"];

    const handleNavClick = (item) => {
        setMobileOpen(false);
        const el = document.getElementById(item.toLowerCase());
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-6 py-3 sm:py-4 ${isScrolled ? "glass m-2 sm:m-4 rounded-2xl shadow-sm" : "bg-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo — clickable, navigates home */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/30 rounded-lg blur-md group-hover:bg-primary/50 transition-all duration-300 scale-110 animate-pulse-slow" />
                        <div className="relative bg-gradient-to-br from-[#DD2C00] to-[#FF6B35] p-1.5 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Zap className="w-5 h-5 text-white" fill="white" />
                        </div>
                    </div>
                    <span className="text-xl font-black tracking-tight">
                        <span
                            className="bg-gradient-to-r from-[#DD2C00] via-[#FF6B35] to-[#DD2C00] bg-clip-text text-transparent"
                            style={{ backgroundSize: "200% auto", animation: "shine 3s linear infinite" }}
                        >
                            Xtreme
                        </span>
                        <span className="text-gray-800 font-medium text-base ml-1 hidden sm:inline">InsightX</span>
                    </span>
                </Link>

                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-8">
                    {navItems.map((item) => (
                        <button
                            key={item}
                            onClick={() => handleNavClick(item)}
                            className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
                        >
                            {item}
                        </button>
                    ))}
                </div>

                {/* Auth buttons */}
                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        <Link to="/dashboard">
                            <Button className="rounded-xl px-6 gap-2">
                                <LayoutDashboard className="w-4 h-4" />
                                Go to Dashboard
                            </Button>
                        </Link>
                    ) : (
                        <>
                            <Link to="/login">
                                <Button variant="ghost" className="text-gray-600 hover:text-primary">
                                    Login
                                </Button>
                            </Link>
                            <Link to="/signup">
                                <Button className="rounded-xl px-6">Sign Up</Button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile hamburger */}
                <button
                    className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden bg-white/95 backdrop-blur-md rounded-2xl mt-3 p-4 shadow-xl border border-gray-100 space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item}
                            onClick={() => handleNavClick(item)}
                            className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-xl transition-all"
                        >
                            {item}
                        </button>
                    ))}
                    <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                        {user ? (
                            <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                                <Button className="w-full rounded-xl gap-2">
                                    <LayoutDashboard className="w-4 h-4" />
                                    Go to Dashboard
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setMobileOpen(false)}>
                                    <Button variant="ghost" className="w-full text-gray-600 hover:text-primary">Login</Button>
                                </Link>
                                <Link to="/signup" onClick={() => setMobileOpen(false)}>
                                    <Button className="w-full rounded-xl">Sign Up</Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes shine {
                    0% { background-position: 0% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.7; }
                }
                .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
            `}</style>
        </nav>
    );
}
