import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
    return (
        <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-6 text-left">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="relative inline-block">
                    <div className="absolute -inset-4 bg-primary/10 blur-2xl rounded-full" />
                    <ShieldAlert className="w-24 h-24 text-primary relative" />
                </div>

                <div className="space-y-4">
                    <h1 className="text-6xl font-black text-gray-900 tracking-tight">404</h1>
                    <h2 className="text-2xl font-bold text-gray-800">Page Not Found</h2>
                    <p className="text-gray-500">
                        Oops! The page you're looking for was intercepted or doesn't exist.
                        Our shield is working, but it can't find this URL.
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
        </div>
    );
}
