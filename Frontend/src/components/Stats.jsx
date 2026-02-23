import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const stats = [
    { label: "Accuracy", value: 98, suffix: "%" },
    { label: "Fraud Reduction", value: 40, suffix: "%" },
    { label: "Real-time Scoring", value: 100, suffix: "ms" },
];

export default function Stats() {
    const statsRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".stat-item", {
                scrollTrigger: {
                    trigger: statsRef.current,
                    start: "top 80%",
                },
                y: 40,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2,
                ease: "power2.out",
            });

            // Simple counter animation
            const items = gsap.utils.toArray(".stat-number");
            items.forEach((item) => {
                const value = parseInt(item.getAttribute("data-value"));
                gsap.to(item, {
                    scrollTrigger: {
                        trigger: item,
                        start: "top 90%",
                    },
                    innerText: value,
                    duration: 2,
                    snap: { innerText: 1 },
                    ease: "power2.out",
                });
            });
        }, statsRef);

        return () => ctx.revert();
    }, []);

    return (
        <section className="py-24 bg-white border-y border-gray-100" ref={statsRef}>
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="stat-item space-y-2">
                            <div className="text-5xl font-bold text-gray-900 tracking-tight">
                                <span className="stat-number" data-value={stat.value}>0</span>
                                <span>{stat.suffix}</span>
                            </div>
                            <p className="text-gray-500 font-medium uppercase tracking-wider text-sm">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
