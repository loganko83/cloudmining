import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`flex items-center p-4 rounded-lg shadow-lg border min-w-[300px] animate-fade-in-up transition-all ${
              toast.type === 'success' ? 'bg-slate-800 border-green-500 text-green-400' :
              toast.type === 'error' ? 'bg-slate-800 border-red-500 text-red-400' :
              'bg-slate-800 border-blue-500 text-blue-400'
            }`}
          >
            <div className="flex-shrink-0 mr-3">
              {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> :
               toast.type === 'error' ? <XCircle className="h-5 w-5" /> :
               <Info className="h-5 w-5" />}
            </div>
            <div className="flex-1 text-sm font-medium text-white">{toast.message}</div>
            <button onClick={() => removeToast(toast.id)} className="ml-3 text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};