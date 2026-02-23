import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShieldCheck, Activity, Brain, Lock, Users, Zap } from "lucide-react";

const features = [
    {
        title: "Real-time Analysis",
        description: "Scan thousands of transactions every second with sub-millisecond latency.",
        icon: Activity,
    },
    {
        title: "ML Risk Scoring",
        description: "Personalized machine learning models trained on your specific business data.",
        icon: Brain,
    },
    {
        title: "Fraud Shield",
        description: "Automated blocking of known malicious actors and suspicious geolocations.",
        icon: ShieldCheck,
    },
    {
        title: "Enterprise Security",
        description: "Bank-grade encryption and SOC 2 Type II compliance for your peace of mind.",
        icon: Lock,
    },
    {
        title: "Customer Insights",
        description: "Deep dive into behavioral patterns to improve user experience while keeping it safe.",
        icon: Users,
    },
    {
        title: "Instant Integration",
        description: "Go live in minutes with our robust SDKs and comprehensive documentation.",
        icon: Zap,
    },
];

export default function Features() {
    return (
        <section id="features" className="py-24 bg-[#FAFAF9]">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-3xl mx-auto mb-16 space-y-4"
                >
                    <h2 className="text-4xl font-bold text-gray-900">Advanced Fraud Prevention</h2>
                    <p className="text-lg text-gray-600">
                        Our platform provides end-to-end protection for your digital ecosystem,
                        powered by cutting-edge artificial intelligence.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                        >
                            <Card
                                className="group border-none shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] bg-white rounded-2xl p-4"
                            >
                                <CardHeader>
                                    <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                        <feature.icon className="w-6 h-6" />
                                    </div>
                                    <CardTitle className="text-xl font-bold text-gray-900">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
