import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Lenis from "@studio-freight/lenis";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFoundPage from "./pages/NotFoundPage";
import DashboardLayout from "./pages/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

import { AuthProvider } from "./context/AuthContext";
import { AnalyticsProvider } from "./context/AnalyticsContext";
import Analytics from "./pages/Analytics";
import AutoReport from "./pages/AutoReport";

function App() {
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, []);

    return (
        <AuthProvider>
            <AnalyticsProvider>
                <Router>
                    <ScrollToTop />
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        <Route
                            path="/dashboard/*"
                            element={
                                <DashboardLayout>
                                    <Routes>
                                        <Route index element={<Dashboard />} />
                                        <Route path="transactions" element={<div>Transactions Page Coming Soon</div>} />
                                        <Route path="alerts" element={<div>Alerts Page Coming Soon</div>} />
                                        <Route path="analytics" element={<Analytics />} />
                                        <Route path="auto-report" element={<AutoReport />} />
                                        <Route path="settings" element={<div>Settings Page Coming Soon</div>} />
                                        <Route path="*" element={<NotFoundPage />} />
                                    </Routes>
                                </DashboardLayout>
                            }
                        />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                    <ToastContainer
                        position="top-right"
                        autoClose={5000}
                        hideProgressBar={false}
                        newestOnTop
                        closeOnClick
                        rtl={false}
                        pauseOnFocusLoss
                        draggable
                        pauseOnHover
                        theme="light"
                    />
                </Router>
            </AnalyticsProvider>
        </AuthProvider>
    );
}

export default App;
