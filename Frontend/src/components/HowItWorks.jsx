import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { UploadCloud, Search, PieChart } from "lucide-react";

const steps = [
    {
        title: "Upload Data",
        description: "Securely connect your transaction streams via API or SDK.",
        icon: UploadCloud,
    },
    {
        title: "AI Analysis",
        description: "Our neural networks process data for anomalies in real-time.",
        icon: Search,
    },
    {
        title: "Fraud Prediction",
        description: "Get instant risk scores and automated action triggers.",
        icon: PieChart,
    },
];

export default function HowItWorks() {
    return (
        <section className="py-24 bg-[#FAFAF9]">
            <div className="max-w-7xl mx-auto px-6">
                <motion.h2
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="text-4xl font-bold text-gray-900 text-center mb-16"
                >
                    How AI Fraud Shield Works
                </motion.h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
                    {/* Connector line for desktop */}
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />

                    {steps.map((step, idx) => (
                        <motion.div
                            key={idx}
                            className="relative z-10"
                            initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.7, delay: idx * 0.2 }}
                        >
                            <Card className="p-8 bg-white border-none shadow-sm rounded-2xl text-center space-y-6">
                                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
                                    <step.icon className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                                    <p className="text-gray-600">{step.description}</p>
                                </div>
                                <div className="text-4xl font-black text-gray-100 absolute -top-4 -right-4 select-none">
                                    0{idx + 1}
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
