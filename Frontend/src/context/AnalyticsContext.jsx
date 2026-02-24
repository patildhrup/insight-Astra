import React, { createContext, useContext, useState } from 'react';

const AnalyticsContext = createContext();

export function AnalyticsProvider({ children }) {
    const [lastAnalysis, setLastAnalysis] = useState(null);

    const updateAnalysis = (data) => {
        setLastAnalysis(data);
    };

    return (
        <AnalyticsContext.Provider value={{ lastAnalysis, updateAnalysis }}>
            {children}
        </AnalyticsContext.Provider>
    );
}

export function useAnalytics() {
    const context = useContext(AnalyticsContext);
    if (!context) {
        throw new Error('useAnalytics must be used within an AnalyticsProvider');
    }
    return context;
}
