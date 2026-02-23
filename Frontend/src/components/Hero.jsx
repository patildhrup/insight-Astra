import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import gsap from "gsap";
import { Card } from "@/components/ui/card";
import CustomCursor from "./CustomCursor";

export default function Hero() {
    const heroRef = useRef(null);
    const glowRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Fade up hero text
            gsap.from(".hero-content > *", {
                y: 40,
                opacity: 0,
                duration: 1,
                stagger: 0.2,
                ease: "power3.out",
            });

            // Animated background glow
            gsap.to(glowRef.current, {
                scale: 1.2,
                opacity: 0.6,
                duration: 4,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });

            // Dashboard mockup entrance
            gsap.from(".hero-mockup", {
                x: 100,
                opacity: 0,
                duration: 1.5,
                delay: 0.5,
                ease: "power2.out",
            });
        }, heroRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={heroRef}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-[#FAFAF9] cursor-none"
        >
            <CustomCursor
                x={mousePos.x}
                y={mousePos.y}
                isVisible={isHovering}
                label="Try Demo"
            />

            {/* Background Glow */}
            <div
                ref={glowRef}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none opacity-40"
            />

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                <div className="hero-content space-y-8">
                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-tight">
                        AI-Powered <br />
                        <span className="text-primary">Fraud Detection</span> <br />
                        for Modern Business
                    </h1>
                    <p className="text-xl text-gray-600 max-w-lg leading-relaxed text-left">
                        Protect your revenue with real-time machine learning analysis.
                        Identify suspicious patterns before they impact your growth.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Button size="lg" className="rounded-xl px-8 h-14 text-lg">
                            Get Started
                        </Button>
                        <Button size="lg" variant="outline" className="rounded-xl px-8 h-14 text-lg border-2">
                            Request Demo
                        </Button>
                    </div>
                </div>

                <div className="hero-mockup hidden lg:block">
                    <Card className="p-4 bg-white/80 backdrop-blur border-white/50 shadow-2xl rounded-2xl overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-500">
                        <div className="bg-gray-50 rounded-xl p-6 h-[400px] flex flex-col gap-4">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                                <div className="flex gap-2">
                                    <div className="h-2 w-2 bg-red-400 rounded-full" />
                                    <div className="h-2 w-2 bg-yellow-400 rounded-full" />
                                    <div className="h-2 w-2 bg-green-400 rounded-full" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="h-24 bg-primary/5 rounded-lg p-3 flex flex-col justify-end">
                                    <div className="h-4 w-20 bg-primary/20 rounded" />
                                </div>
                                <div className="h-24 bg-gray-100 rounded-lg p-3 flex flex-col justify-end">
                                    <div className="h-4 w-20 bg-gray-200 rounded" />
                                </div>
                            </div>
                            <div className="space-y-3 pt-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-10 bg-white rounded-lg border flex items-center px-4 justify-between">
                                        <div className="h-2 w-24 bg-gray-100 rounded" />
                                        <div className={`h-4 w-12 rounded-full ${i === 1 ? 'bg-red-100' : 'bg-green-100'}`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </section>
    );
}
