import React from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  title: string;
  message: string;
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  type, 
  title, 
  message, 
  showCloseButton = true 
}) => {
  if (!isOpen) return null;

  const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50';
  const iconColor = type === 'success' ? 'text-green-500' : 'text-red-500';
  const titleColor = type === 'success' ? 'text-green-800' : 'text-red-800';
  const messageColor = type === 'success' ? 'text-green-700' : 'text-red-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 mx-4 max-w-md w-full transform transition-all scale-100">
        {/* Close button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Content */}
        <div className="text-center">
          {/* Icon */}
          <div className={`mx-auto w-16 h-16 ${bgColor} rounded-full flex items-center justify-center mb-4`}>
            {type === 'success' ? (
              <CheckCircle className={`h-8 w-8 ${iconColor}`} />
            ) : (
              <XCircle className={`h-8 w-8 ${iconColor}`} />
            )}
          </div>

          {/* Title */}
          <h3 className={`text-lg font-semibold ${titleColor} mb-2`}>
            {title}
          </h3>

          {/* Message */}
          <p className={`text-sm ${messageColor} mb-6`}>
            {message}
          </p>

          {/* Action button for error modal */}
          {type === 'error' && (
            <button
              onClick={onClose}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;