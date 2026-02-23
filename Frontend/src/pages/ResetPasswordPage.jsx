import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

import { toast } from "react-toastify";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            toast.success("Password updated successfully!");
            setTimeout(() => navigate("/login"), 2000);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <Card className="border-none shadow-xl rounded-[2rem] p-4 bg-white text-left">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                        <CardDescription>
                            Enter your new password below.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        className="pl-10 rounded-xl h-12"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full rounded-xl h-12 text-lg" disabled={loading}>
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
