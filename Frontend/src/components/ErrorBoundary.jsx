import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from './ui/button';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-red-100 p-8 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                        <div className="mx-auto w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-red-200 rounded-3xl animate-ping opacity-20" />
                            <AlertTriangle className="w-10 h-10 text-red-500 relative z-10" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Something went wrong</h1>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                The AI Agent encountered a data-sync glitch while generating your report. We've captured the technical details to prevent this from repeating.
                            </p>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-2xl text-[10px] text-left font-mono text-gray-400 overflow-auto max-h-32 border border-gray-100 italic">
                            <span className="text-red-400 font-bold uppercase mb-1 block not-italic">Context Log:</span>
                            {this.state.error?.toString()}
                            <br />
                            {this.state.error?.stack?.split('\n').slice(0, 2).join('\n')}
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button
                                onClick={this.handleReset}
                                variant="outline"
                                className="rounded-2xl border-gray-200 hover:bg-gray-50 h-12 gap-2 text-xs font-bold"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Retry System
                            </Button>
                            <Button
                                onClick={() => window.location.href = '/'}
                                className="rounded-2xl bg-primary hover:bg-primary/90 h-12 gap-2 text-xs font-bold shadow-lg shadow-primary/20"
                            >
                                <Home className="w-4 h-4" />
                                Go Home
                            </Button>
                        </div>

                        <p className="text-[10px] text-gray-400 font-medium pt-4">
                            Error ID: {Math.random().toString(36).substring(7).toUpperCase()}
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
