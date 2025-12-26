import { useEffect } from 'react';
import './Toast.css';

interface ToastProps {
  message: string;
  type: 'correct' | 'incorrect';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-icon">
        {type === 'correct' ? '✓' : '✗'}
      </div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
}



