import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Mail, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";

import { toast } from "react-toastify";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            toast.success("Check your email for the reset link!");
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <Link to="/" className="flex items-center gap-2 group mb-6 justify-center">
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

                <Card className="border-none shadow-xl rounded-[2rem] p-4 bg-white text-left">
                    <CardHeader className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Link to="/login" className="text-gray-400 hover:text-primary transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
                        </div>
                        <CardDescription>
                            Enter your email and we'll send you a link to reset your password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={handleReset} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@company.com"
                                        className="pl-10 rounded-xl h-12"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full rounded-xl h-12 text-lg" disabled={loading}>
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
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
