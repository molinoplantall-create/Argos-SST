'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ConfirmConfig {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface FeedbackContextType {
  showToast: (message: string, type?: ToastType) => void;
  showConfirm: (config: ConfirmConfig) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const FeedbackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const showConfirm = (config: ConfirmConfig) => {
    setConfirmConfig(config);
  };

  const handleConfirm = () => {
    if (confirmConfig) {
      confirmConfig.onConfirm();
      setConfirmConfig(null);
    }
  };

  const handleCancel = () => {
    if (confirmConfig) {
      if (confirmConfig.onCancel) confirmConfig.onCancel();
      setConfirmConfig(null);
    }
  };

  return (
    <FeedbackContext.Provider value={{ showToast, showConfirm }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "flex items-center gap-3 p-4 rounded-lg shadow-lg border-l-4 min-w-[300px] animate-in slide-in-from-right-full duration-300",
              toast.type === 'success' && "bg-white border-green-500 text-green-800",
              toast.type === 'error' && "bg-white border-red-500 text-red-800",
              toast.type === 'info' && "bg-white border-[#1E93AB] text-[#1E93AB]"
            )}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-500" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-[#1E93AB]" />}
            
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            
            <button 
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {confirmConfig && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">{confirmConfig.title}</h3>
              <p className="text-gray-600 text-sm mb-6">{confirmConfig.message}</p>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium border border-[#DCDCDC] rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirm}
                  className="px-4 py-2 text-sm font-medium bg-[#1E93AB] text-white rounded-lg hover:bg-[#167082] transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};
