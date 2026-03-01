import { Link } from "react-router-dom";
import { Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
    return (
        <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-6 text-left">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="text-center">
                    <Link to="/" className="flex items-center gap-2 group mb-6 justify-center scale-150 transform">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/30 rounded-lg blur-md group-hover:bg-primary/50 transition-all duration-300 scale-110 animate-pulse-slow" />
                            <div className="relative bg-gradient-to-br from-[#DD2C00] to-[#FF6B35] p-1.5 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <Zap className="w-6 h-6 text-white" fill="white" />
                            </div>
                        </div>
                        <span className="text-2xl font-black tracking-tight">
                            <span
                                className="bg-gradient-to-r from-[#DD2C00] via-[#FF6B35] to-[#DD2C00] bg-clip-text text-transparent"
                                style={{ backgroundSize: "200% auto", animation: "shine 3s linear infinite" }}
                            >
                                Xtreme
                            </span>
                            <span className="text-gray-800 font-medium text-lg ml-1">InsightX</span>
                        </span>
                    </Link>
                </div>

                <div className="space-y-4">
                    <h1 className="text-6xl font-black text-gray-900 tracking-tight">404</h1>
                    <h2 className="text-2xl font-bold text-gray-800">Page Not Found</h2>
                    <p className="text-gray-500">
                        Oops! The page you're looking for was intercepted or doesn't exist.
                        The Xtreme InsightX shield is working, but it can't find this URL.
                    </p>
                </div>

                <div className="pt-4">
                    <Button asChild className="rounded-xl h-12 px-8 text-lg group">
                        <Link to="/">
                            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Back to Safety
                        </Link>
                    </Button>
                </div>
            </div>
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
        </div>
    );
}
