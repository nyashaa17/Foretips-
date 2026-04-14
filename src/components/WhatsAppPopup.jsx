import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function WhatsAppPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has dismissed it before
    const hasDismissed = localStorage.getItem('whatsapp_popup_dismissed');
    if (!hasDismissed) {
      // Show after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('whatsapp_popup_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[420px] z-[100]"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden relative flex items-center p-4 pr-12 gap-4">
            {/* Green accent line on the left */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#25D366]"></div>
            
            {/* WhatsApp Logo */}
            <div className="shrink-0">
              <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center shadow-sm">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
                  alt="WhatsApp" 
                  className="w-7 h-7" 
                />
              </div>
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-slate-900 font-bold text-sm sm:text-base truncate">
                Join our WhatsApp Channel
              </h4>
              <p className="text-slate-500 text-xs sm:text-sm line-clamp-2">
                Get daily AI football predictions instantly
              </p>
            </div>

            {/* Join Button */}
            <div className="shrink-0">
              <a 
                href="https://whatsapp.com/channel/0029Vb7MXnXKLaHohHn7do3q"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClose}
                className="bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold py-2 px-4 rounded-xl transition-colors inline-block"
              >
                Join
              </a>
            </div>

            {/* Close Button */}
            <button 
              onClick={handleClose}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
