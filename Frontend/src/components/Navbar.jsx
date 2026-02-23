import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, LayoutDashboard } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
    const { user } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 ${isScrolled ? "glass m-4 rounded-2xl shadow-sm" : "bg-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <Shield className="w-8 h-8 text-primary" />
                    <span className="text-xl font-bold tracking-tight text-gray-900">
                        AI <span className="text-primary">Fraud</span> Shield
                    </span>
                </Link>

                <div className="hidden md:flex items-center gap-8">
                    {["Features", "Solutions", "Pricing", "About"].map((item) => (
                        <Link
                            key={item}
                            to={`#${item.toLowerCase()}`}
                            className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
                        >
                            {item}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-4">
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
            </div>
        </nav>
    );
}

