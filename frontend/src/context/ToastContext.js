import { createContext, useContext } from 'react';

export const ToastContext = createContext({
  showToast: () => '',
  dismissToast: () => {},
});

export const useToast = () => useContext(ToastContext);
