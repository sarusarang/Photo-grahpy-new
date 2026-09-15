import React from 'react';
import { toast } from 'sonner';

export { toast };

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastContextType {
  showToast: (title: string, message?: string, type?: ToastType) => void;
}

/**
 * Sonner unified toast hook supporting title and description
 */
export const useToast = (): ToastContextType => {
  return {
    showToast: (title: string, message?: string, type: ToastType = 'success') => {
      if (type === 'error') {
        toast.error(title, { description: message });
      } else if (type === 'info') {
        toast.info(title, { description: message });
      } else if (type === 'warning') {
        toast.warning(title, { description: message });
      } else {
        toast.success(title, { description: message });
      }
    },
  };
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
