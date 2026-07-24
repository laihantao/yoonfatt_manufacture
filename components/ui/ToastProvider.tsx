'use client';

import { Toaster, toast as sonnerToast } from 'sonner';

// Thin wrapper around `sonner` so existing `useToast()` call sites keep the
// same API: toast(message, 'success' | 'error'). sonner handles the visuals,
// manual close (X button), swipe-to-dismiss, stacking, and mobile layout.
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        expand
        toastOptions={{ duration: 3500 }}
      />
    </>
  );
}

type ToastType = 'success' | 'error';

export function useToast() {
  return (message: string, type: ToastType = 'success') => {
    if (type === 'error') sonnerToast.error(message);
    else sonnerToast.success(message);
  };
}
