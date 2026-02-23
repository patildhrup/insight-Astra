import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Mail, Loader2, ArrowLeft } from "lucide-react";
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
                    <Link to="/" className="inline-flex items-center gap-2 mb-4">
                        <Shield className="w-10 h-10 text-primary" />
                        <span className="text-2xl font-bold tracking-tight text-gray-900">
                            AI <span className="text-primary">Fraud</span> Shield
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
        </div>
    );
}
