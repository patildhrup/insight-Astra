import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, Mail, Lock, Chrome, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

import { toast } from "react-toastify";

export default function LoginPage() {
    const { user, signIn, signInWithOtp, verifyOtp, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate("/dashboard");
        }
    }, [user, navigate]);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [loading, setLoading] = useState(false);
    const [useOtp, setUseOtp] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (useOtp) {
                const { error } = await signInWithOtp(email);
                if (error) throw error;
                toast.success("Check your email for the magic link or 8-digit code!");
                setShowOtpInput(true);
            } else {
                const { error } = await signIn({ email, password });
                if (error) throw error;
                toast.success("Welcome back!");
                navigate("/dashboard");
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await verifyOtp(email, otp, 'magiclink');
            if (error) throw error;
            toast.success("Logged in successfully!");
            navigate("/dashboard");
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await signInWithGoogle();
            if (error) throw error;
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-6 text-left">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <Link to="/" className="inline-flex items-center gap-2 mb-4">
                        <Shield className="w-10 h-10 text-primary" />
                        <span className="text-2xl font-bold tracking-tight text-gray-900">
                            AI <span className="text-primary">Fraud</span> Shield
                        </span>
                    </Link>
                </div>

                <Card className="border-none shadow-xl rounded-[2rem] p-4 bg-white">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold">
                            {showOtpInput ? "Verify Code" : "Welcome back"}
                        </CardTitle>
                        <CardDescription>
                            {showOtpInput
                                ? "Enter the 8-digit code sent to your email."
                                : (useOtp ? "Enter your email to receive a magic link" : "Enter your credentials to access your dashboard")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!showOtpInput ? (
                            <form onSubmit={handleLogin} className="space-y-4">
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

                                {!useOtp && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password">Password</Label>
                                            <Link to="/forgot-password" size="sm" className="text-sm text-primary hover:underline">
                                                Forgot password?
                                            </Link>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                id="password"
                                                type="password"
                                                className="pl-10 rounded-xl h-12"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required={!useOtp}
                                            />
                                        </div>
                                    </div>
                                )}

                                <Button type="submit" className="w-full rounded-xl h-12 text-lg" disabled={loading}>
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (useOtp ? "Send Magic Link" : "Sign In")}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="otp">Verification Code</Label>
                                    <Input
                                        id="otp"
                                        placeholder="12345678"
                                        className="rounded-xl h-12 text-center text-2xl tracking-[0.5em] font-mono"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        maxLength={8}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full rounded-xl h-12 text-lg" disabled={loading}>
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Sign In"}
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => setShowOtpInput(false)}
                                    className="w-full text-center text-sm text-gray-500 hover:text-primary"
                                >
                                    Back to Login
                                </button>
                            </form>
                        )}

                        {!showOtpInput && (
                            <>
                                <div className="flex items-center justify-between px-2">
                                    <button
                                        onClick={() => setUseOtp(!useOtp)}
                                        className="text-sm text-gray-500 hover:text-primary transition-colors"
                                    >
                                        {useOtp ? "Login with Password instead" : "Use Magic Link (OTP)"}
                                    </button>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-gray-100"></span>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-gray-400">Or continue with</span>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    className="w-full rounded-xl h-12 border-gray-200"
                                    onClick={handleGoogleLogin}
                                >
                                    <Chrome className="w-5 h-5 mr-2" />
                                    Continue with Google
                                </Button>

                                <p className="text-center text-sm text-gray-500 pt-4">
                                    Don't have an account?{" "}
                                    <Link to="/signup" className="text-primary font-semibold hover:underline">
                                        Create Account
                                    </Link>
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
