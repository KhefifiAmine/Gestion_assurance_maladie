import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success', duration = 5000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none min-w-[320px] max-w-md">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <ToastItem 
                            key={toast.id} 
                            toast={toast} 
                            onClose={() => removeToast(toast.id)} 
                        />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

const ToastItem = ({ toast, onClose }) => {
    const { id, message, type, duration } = toast;

    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const styles = {
        success: { 
            bg: 'bg-emerald-50 dark:bg-emerald-900/20', 
            border: 'border-emerald-200 dark:border-emerald-800', 
            text: 'text-emerald-800 dark:text-emerald-300', 
            icon: <CheckCircle2 className="text-emerald-500 dark:text-emerald-400" /> 
        },
        error: { 
            bg: 'bg-red-50 dark:bg-red-900/20', 
            border: 'border-red-200 dark:border-red-800', 
            text: 'text-red-800 dark:text-red-300', 
            icon: <AlertCircle className="text-red-500 dark:text-red-400" /> 
        },
        warning: { 
            bg: 'bg-amber-50 dark:bg-amber-900/20', 
            border: 'border-amber-200 dark:border-amber-800', 
            text: 'text-amber-800 dark:text-amber-300', 
            icon: <AlertTriangle className="text-amber-500 dark:text-amber-400" /> 
        },
        info: { 
            bg: 'bg-blue-50 dark:bg-blue-900/20', 
            border: 'border-blue-200 dark:border-blue-800', 
            text: 'text-blue-800 dark:text-blue-300', 
            icon: <Info className="text-blue-500 dark:text-blue-400" /> 
        }
    }[type];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl border shadow-xl shadow-slate-200/50 dark:shadow-none ${styles.bg} ${styles.border} ${styles.text}`}
        >
            <div className="flex-shrink-0">{styles.icon}</div>
            <p className="flex-1 text-sm font-bold tracking-tight">{message}</p>
            <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors">
                <X size={16} className="opacity-40" />
            </button>
        </motion.div>
    );
};
