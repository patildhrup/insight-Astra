import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import gsap from "gsap";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, BarChart3, Zap, Lock } from "lucide-react";

export default function Hero() {
    const heroRef = useRef(null);
    const glowRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".hero-content > *", {
                y: 40,
                opacity: 0,
                duration: 1,
                stagger: 0.15,
                ease: "power3.out",
            });

            gsap.to(glowRef.current, {
                scale: 1.25,
                opacity: 0.65,
                duration: 4,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });

            gsap.from(".hero-visual", {
                x: 80,
                opacity: 0,
                duration: 1.4,
                delay: 0.4,
                ease: "power2.out",
            });

            // Floating cards animation
            gsap.to(".float-card-1", {
                y: -12,
                duration: 2.5,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });
            gsap.to(".float-card-2", {
                y: 10,
                duration: 3.2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                delay: 0.8,
            });
            gsap.to(".float-card-3", {
                y: -8,
                duration: 2.8,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                delay: 1.4,
            });
        }, heroRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={heroRef}
            className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-gradient-to-br from-[#FAFAF9] via-white to-[#FFF4F0]"
        >
            {/* Background Glow */}
            <div
                ref={glowRef}
                className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/8 rounded-full blur-[140px] pointer-events-none opacity-30"
            />
            <div className="absolute top-20 right-10 w-64 h-64 bg-orange-200/20 rounded-full blur-[80px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16 items-center relative z-10 w-full">
                {/* Left — Text Content */}
                <div className="hero-content space-y-6 sm:space-y-8 text-center lg:text-left">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20 rounded-full px-4 py-2 text-sm font-medium text-primary mx-auto lg:mx-0">
                        <Zap className="w-4 h-4" fill="currentColor" />
                        AI-Powered Platform
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-gray-900 leading-tight">
                        AI-Powered <br />
                        <span className="text-primary">Fraud Detection</span> <br />
                        <span className="text-gray-700">for Modern Business</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-gray-600 max-w-lg leading-relaxed mx-auto lg:mx-0">
                        Protect your revenue with real-time machine learning analysis.
                        Identify suspicious patterns before they impact your growth.
                    </p>

                    <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center lg:justify-start">
                        <Link to="/signup">
                            <Button size="lg" className="rounded-xl px-8 h-14 text-lg w-full sm:w-auto gap-2">
                                Get Started
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </Link>
                        <Link to="/login">
                            <Button size="lg" variant="outline" className="rounded-xl px-8 h-14 text-lg border-2 w-full sm:w-auto">
                                Request Demo
                            </Button>
                        </Link>
                    </div>

                    {/* Trust badges */}
                    <div className="flex flex-wrap gap-6 justify-center lg:justify-start pt-2">
                        {[
                            { icon: Shield, label: "Bank-grade Security" },
                            { icon: BarChart3, label: "99.7% Accuracy" },
                            { icon: Lock, label: "GDPR Compliant" },
                        ].map(({ icon: Icon, label }) => (
                            <div key={label} className="flex items-center gap-2 text-sm text-gray-500">
                                <Icon className="w-4 h-4 text-primary" />
                                {label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right — Animated Visual */}
                <div className="hero-visual relative hidden lg:flex items-center justify-center">
                    {/* Main dashboard mockup */}
                    <div className="relative w-full max-w-lg">
                        {/* Main card */}
                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 backdrop-blur">
                            {/* Header bar */}
                            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-[#DD2C00] rounded-full" />
                                    <div className="w-3 h-3 bg-orange-400 rounded-full" />
                                    <div className="w-3 h-3 bg-green-400 rounded-full" />
                                </div>
                                <div className="h-3 w-28 bg-gray-100 rounded-full" />
                                <div className="flex items-center gap-1.5">
                                    <div className="h-3 w-3 bg-primary/20 rounded-full" />
                                    <div className="h-3 w-12 bg-gray-100 rounded-full" />
                                </div>
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                {[
                                    { label: "Total Blocked", value: "₹2.4M", color: "bg-red-50 border-red-100", textColor: "text-red-600" },
                                    { label: "Accuracy", value: "99.7%", color: "bg-green-50 border-green-100", textColor: "text-green-600" },
                                    { label: "Active Rules", value: "1,284", color: "bg-blue-50 border-blue-100", textColor: "text-blue-600" },
                                ].map(({ label, value, color, textColor }) => (
                                    <div key={label} className={`rounded-xl p-3 border ${color}`}>
                                        <p className="text-[10px] text-gray-400 mb-1">{label}</p>
                                        <p className={`text-base font-bold ${textColor}`}>{value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Chart area */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-4 h-28 relative overflow-hidden">
                                <div className="text-xs text-gray-400 mb-2">Transaction Volume</div>
                                <svg viewBox="0 0 300 60" className="w-full h-16" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#DD2C00" stopOpacity="0.3" />
                                            <stop offset="100%" stopColor="#DD2C00" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M0,45 C30,35 60,20 90,30 C120,40 150,10 180,15 C210,20 240,35 270,25 L300,20 L300,60 L0,60 Z" fill="url(#chartGrad)" />
                                    <path d="M0,45 C30,35 60,20 90,30 C120,40 150,10 180,15 C210,20 240,35 270,25 L300,20" fill="none" stroke="#DD2C00" strokeWidth="2" />
                                </svg>
                            </div>

                            {/* Transaction list */}
                            <div className="space-y-2">
                                {[
                                    { name: "Online Purchase", amount: "₹4,250", status: "Safe", safe: true },
                                    { name: "UPI Transfer", amount: "₹18,000", status: "Flagged", safe: false },
                                    { name: "Subscription", amount: "₹999", status: "Safe", safe: true },
                                ].map(({ name, amount, status, safe }) => (
                                    <div key={name} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${safe ? 'bg-green-400' : 'bg-red-500'}`} />
                                            <span className="text-sm font-medium text-gray-700">{name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-gray-500">{amount}</span>
                                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${safe ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Floating cards */}
                        <div className="float-card-1 absolute -top-8 -right-8 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-44">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                    <Shield className="w-4 h-4 text-red-600" />
                                </div>
                                <span className="text-xs font-semibold text-gray-600">Threat Blocked</span>
                            </div>
                            <p className="text-xl font-bold text-gray-900">₹2.4M</p>
                            <p className="text-[10px] text-green-500 font-medium mt-0.5">↑ Protected this month</p>
                        </div>

                        <div className="float-card-2 absolute -bottom-6 -left-10 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-48">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <BarChart3 className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="text-xs font-semibold text-gray-600">AI Confidence</span>
                            </div>
                            <div className="flex items-end gap-1">
                                <p className="text-2xl font-bold text-gray-900">99.7</p>
                                <p className="text-sm text-gray-500 mb-1">%</p>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                                <div className="bg-green-400 h-1.5 rounded-full" style={{ width: "99.7%" }} />
                            </div>
                        </div>

                        <div className="float-card-3 absolute top-1/2 -right-14 bg-[#DD2C00] rounded-2xl shadow-xl p-3 w-36">
                            <p className="text-white text-xs font-semibold mb-1">Real-time Scan</p>
                            <div className="space-y-1">
                                {[80, 60, 90].map((w, i) => (
                                    <div key={i} className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                                        <div className="h-full bg-white rounded-full animate-pulse" style={{ width: `${w}%` }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
