import { useCallback, useRef, useState, useEffect } from 'react';

export interface ToastState {
  message: string;
  visible: boolean;
  type: 'success' | 'warning';
}

export function useToast(defaultDurationMs = 2600) {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    visible: false,
    type: 'success',
  });
  const timerRef = useRef<number | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const showToast = useCallback(
    (message: string, type: 'success' | 'warning' = 'success', durationMs = defaultDurationMs) => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      setToast({ message, visible: true, type });
      timerRef.current = window.setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
        timerRef.current = null;
      }, durationMs);
    },
    [defaultDurationMs]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { toast, setToast, showToast, hideToast };
}
