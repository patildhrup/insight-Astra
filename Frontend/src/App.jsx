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
import { AuthProvider } from "./context/AuthContext";
import { AnalyticsProvider } from "./context/AnalyticsContext";
import Analytics from "./pages/Analytics";
import AutoReport from "./pages/AutoReport";
import CustomCursor from "./components/CustomCursor";
import { useAuth } from "./context/AuthContext";

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

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
                    {/* Global custom cursor — rendered once for all pages */}
                    <CustomCursor />

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
                                        <Route path="analytics" element={<Analytics />} />
                                        <Route path="auto-report" element={<AutoReport />} />
                                        <Route path="settings" element={<SettingsPage />} />
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

// Simple Settings page inline (no new file)
function SettingsPage() {
    // eslint-disable-next-line no-unused-vars
    const { user } = useAuth();
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <p className="text-gray-500 mt-1">Manage your account preferences</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
                <h3 className="font-semibold text-gray-800">Profile</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1">Display Name</label>
                        <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" defaultValue="Admin User" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1">Email</label>
                        <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400" disabled placeholder="user@example.com" />
                    </div>
                </div>
                <button className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
                    Save Changes
                </button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
                <h3 className="font-semibold text-gray-800">Notifications</h3>
                {["Email alerts for fraud detection", "Weekly summary reports", "Real-time anomaly alerts"].map(setting => (
                    <div key={setting} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-700">{setting}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
