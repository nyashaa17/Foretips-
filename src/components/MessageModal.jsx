import React from 'react';

export default function MessageModal({ isOpen, onClose, onConfirm, title, message, isAlert = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full">
        <h2 className="text-lg font-bold text-slate-900 mb-2">{title}</h2>
        <p className="text-slate-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          {!isAlert && (
            <button 
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-bold hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
          )}
          <button 
            onClick={() => { if (onConfirm) onConfirm(); onClose(); }}
            className={`px-4 py-2 ${isAlert ? 'bg-green-600' : 'bg-red-600'} text-white font-bold rounded-lg ${isAlert ? 'hover:bg-green-700' : 'hover:bg-red-700'} transition-colors`}
          >
            {isAlert ? 'OK' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
