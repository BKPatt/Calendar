import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Theme } from '../types/types';
import { Notifications } from '../types/event';

interface AppContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    notifications: Notifications[];
    addNotification: (notification: Notifications) => void;
    removeNotification: (id: number) => void;
    clearNotifications: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('light');
    const [notifications, setNotifications] = useState<Notifications[]>([]);

    const addNotification = (notification: Notifications) => {
        setNotifications(prev => [...prev, notification]);
    };

    const removeNotification = (id: number) => {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    const value = {
        theme,
        setTheme,
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};