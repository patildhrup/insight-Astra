import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function CTA() {
    return (
        <section className="py-24 px-6 bg-[#FAFAF9]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <Card className="max-w-5xl mx-auto p-12 lg:p-20 bg-white border-none shadow-xl rounded-[2.5rem] text-center space-y-8 relative overflow-hidden" style={{ borderRadius: "2.5rem" }}>
                    {/* Subtle accent blob */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />

                    <div className="relative z-10 space-y-6">
                        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
                            Ready to secure your <br className="hidden md:block" /> business infrastructure?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Join 500+ enterprises already using AI Fraud Shield to protect their
                            digital assets and customer trust.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Button size="lg" className="rounded-xl px-12 h-16 text-lg w-full sm:w-auto">
                                Start Free Trial
                            </Button>
                            <Button size="lg" variant="outline" className="rounded-xl px-12 h-16 text-lg border-2 w-full sm:w-auto">
                                Talk to Sales
                            </Button>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </section>
    );
}
