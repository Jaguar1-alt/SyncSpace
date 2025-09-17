// src/components/Modal.jsx

import React from 'react';
import { FiX } from 'react-icons/fi';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4 transform transition-all"
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-200">
          <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
          >
            <FiX size={22} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;