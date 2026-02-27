import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Phone } from "lucide-react";

export default function CTA() {
    return (
        <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#FAFAF9]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <Card className="max-w-5xl mx-auto p-8 sm:p-12 lg:p-20 bg-white border-none shadow-xl text-center space-y-8 relative overflow-hidden" style={{ borderRadius: "2.5rem" }}>
                    {/* Background blobs */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />

                    <div className="relative z-10 space-y-6">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
                            Ready to secure your <br className="hidden md:block" />
                            business infrastructure?
                        </h2>
                        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                            Join 500+ enterprises already using Xtreme InsightX to protect their
                            digital assets and customer trust.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link to="/signup">
                                <Button size="lg" className="rounded-xl px-10 h-14 text-lg w-full sm:w-auto gap-2">
                                    Start Free Trial
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            </Link>
                            <Link to="/login">
                                <Button size="lg" variant="outline" className="rounded-xl px-10 h-14 text-lg border-2 w-full sm:w-auto gap-2">
                                    <Phone className="w-5 h-5" />
                                    Talk to Sales
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </section>
    );
}
