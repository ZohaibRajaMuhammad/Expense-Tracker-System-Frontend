// Modal.jsx
import React from 'react';
import { FaTimes } from 'react-icons/fa';

/**
 * Reusable Modal Component using Tailwind CSS.
 * @param {object} props
 * @param {function} props.onClose - Function to close the modal.
 * @param {React.ReactNode} props.children - The content to be displayed inside the modal.
 * @param {string} props.maxWidth - Maximum width of the modal (responsive classes).
 */
const Modal = ({ onClose, children, maxWidth = 'max-w-lg' }) => {
  
  // Handle click outside of the modal content
  const handleOutsideClick = (e) => {
    if (e.target.id === 'modal-backdrop') {
      onClose();
    }
  };

  // Handle escape key press
  React.useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [onClose]);

  return (
    // Modal Backdrop/Overlay
    <div 
      id="modal-backdrop"
      className="fixed h-full inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4 transition-opacity duration-300"
      onClick={handleOutsideClick}
    >
      
      {/* Modal Content */}
      <div 
        className={`
          bg-white rounded-xl shadow-2xl w-full 
          ${maxWidth}
          max-h-[90vh] overflow-y-auto
          transform transition-all duration-300 scale-100
          mx-2 sm:mx-4
        `}
        onClick={e => e.stopPropagation()} 
        role="dialog"
        aria-modal="true"
      >
        
        {/* Modal Header/Close Button */}
        <div className="flex justify-end sticky top-0 bg-white p-4 pb-0 sm:p-6 sm:pb-0 rounded-t-xl">
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-700 transition p-1 rounded-full hover:bg-gray-100"
            aria-label="Close Modal"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-4 sm:p-6 pt-2 sm:pt-2">
          {children}
        </div>

      </div>
    </div>
  );
};

export default Modal;