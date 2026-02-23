import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Stats from "../components/Stats";
import HowItWorks from "../components/HowItWorks";
import CTA from "../components/CTA";

export default function LandingPage() {
    return (
        <main className="min-h-screen">
            <Navbar />
            <Hero />
            <Stats />
            <Features />
            <HowItWorks />
            <CTA />

            {/* Simple Footer */}
            <footer className="py-12 border-t border-gray-100 text-center text-gray-500 bg-[#FAFAF9]">
                <p>© 2026 AI Fraud Shield. All rights reserved.</p>
            </footer>
        </main>
    );
}
