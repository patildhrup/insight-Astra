import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, Mail, Lock, User, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

import { toast } from "react-toastify";

export default function SignupPage() {
    const { user, signUp, verifyOtp } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate("/dashboard");
        }
    }, [user, navigate]);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
    });
    const [otp, setOtp] = useState("");
    const [showOtp, setShowOtp] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error, data } = await signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        full_name: `${formData.firstName} ${formData.lastName}`,
                    },
                    emailRedirectTo: `${window.location.origin}/dashboard`
                }
            });
            if (error) throw error;

            toast.success("Account created! Please enter the 8-digit code sent to your email.");
            setShowOtp(true);
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
            const { error } = await verifyOtp(formData.email, otp, 'signup');
            if (error) throw error;

            toast.success("Email verified! Redirecting to dashboard...");
            setTimeout(() => navigate("/dashboard"), 1500);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-6 text-left">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
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
                            {showOtp ? "Verify Email" : "Create an account"}
                        </CardTitle>
                        <CardDescription>
                            {showOtp
                                ? "Enter the 8-digit code sent to your email address."
                                : "Start your 14-day free trial. No credit card required."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!showOtp ? (
                            <form onSubmit={handleSignup} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First name</Label>
                                        <Input
                                            id="firstName"
                                            placeholder="John"
                                            className="rounded-xl h-12"
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last name</Label>
                                        <Input
                                            id="lastName"
                                            placeholder="Doe"
                                            className="rounded-xl h-12"
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Work Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@company.com"
                                            className="pl-10 rounded-xl h-12"
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            id="password"
                                            type="password"
                                            className="pl-10 rounded-xl h-12"
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button type="submit" className="w-full rounded-xl h-12 text-lg" disabled={loading}>
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                                    </Button>
                                </div>
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
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Continue"}
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => setShowOtp(false)}
                                    className="w-full text-center text-sm text-gray-500 hover:text-primary"
                                >
                                    Back to Signup
                                </button>
                            </form>
                        )}

                        {!showOtp && (
                            <>
                                <p className="px-8 text-center text-sm text-gray-500">
                                    By clicking continue, you agree to our{" "}
                                    <Link to="#" className="underline underline-offset-4 hover:text-primary">
                                        Terms of Service
                                    </Link>{" "}
                                    and{" "}
                                    <Link to="#" className="underline underline-offset-4 hover:text-primary">
                                        Privacy Policy
                                    </Link>
                                    .
                                </p>

                                <p className="text-center text-sm text-gray-500 pt-4">
                                    Already have an account?{" "}
                                    <Link to="/login" className="text-primary font-semibold hover:underline">
                                        Sign In
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
