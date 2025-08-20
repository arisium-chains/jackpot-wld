'use client';

import { toast } from 'sonner';
import { CheckCircle, XCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { createElement } from 'react';

export interface ToastOptions {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

export const useToast = () => {
  const success = (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      icon: createElement(CheckCircle),
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 4000,
    });
  };

  const errorToast = (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      icon: createElement(XCircle),
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 6000,
    });
  };

  const warning = (message: string, options?: ToastOptions) => {
    return toast.warning(message, {
      icon: createElement(AlertCircle),
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 5000,
    });
  };

  const info = (message: string, options?: ToastOptions) => {
    return toast.info(message, {
      icon: createElement(Info),
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 4000,
    });
  };

  const loading = (message: string, options?: Omit<ToastOptions, 'action'>) => {
    return toast.loading(message, {
      icon: createElement(Loader2),
      description: options?.description,
      duration: options?.duration || Infinity,
    });
  };

  const promise = <T,>(
    promise: Promise<T>,
    {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
    });
  };

  const dismiss = (toastId?: string | number) => {
    toast.dismiss(toastId);
  };

  const dismissAll = () => {
    toast.dismiss();
  };

  return {
    success,
    error: errorToast,
    warning,
    info,
    loading,
    promise,
    dismiss,
    dismissAll,
  };
};

// Transaction-specific toast helpers
export const useTransactionToast = () => {
  const { success, error: errorToast, loading, dismiss } = useToast();

  const transactionSubmitted = (hash: string) => {
    return loading('Transaction submitted...', {
      description: `Hash: ${hash.slice(0, 10)}...${hash.slice(-8)}`,
    });
  };

  const transactionConfirmed = (hash: string, toastId?: string | number) => {
    if (toastId) dismiss(toastId);
    return success('Transaction confirmed!', {
      description: `Hash: ${hash.slice(0, 10)}...${hash.slice(-8)}`,
      action: {
        label: 'View',
        onClick: () => {
          window.open(`https://worldscan.org/tx/${hash}`, '_blank');
        },
      },
    });
  };

  const transactionFailed = (errorMsg: string, toastId?: string | number) => {
    if (toastId) dismiss(toastId);
    return errorToast('Transaction failed', {
      description: errorMsg,
    });
  };

  return {
    transactionSubmitted,
    transactionConfirmed,
    transactionFailed,
  };
};