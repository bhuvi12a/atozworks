"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function WhatsAppWidget() {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Show tooltip after 3 seconds to attract attention
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 3000);
    
    // Auto-hide tooltip after 8 seconds
    const hideTimer = setTimeout(() => {
      setShowTooltip(false);
    }, 11000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  const handleClick = () => {
    const message = encodeURIComponent("Hi Praveen Billa, I'm interested in AtoZ Works services / franchise opportunities.");
    window.open(`https://wa.me/919360651833?text=${message}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex items-center gap-3 select-none">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-slate-900 text-white text-xs font-bold py-2.5 px-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-slate-800 flex flex-col items-start gap-0.5 relative"
          >
            <div className="text-[10px] text-emerald-400 font-extrabold tracking-wider uppercase">Contact CEO & Support</div>
            <div className="text-slate-100 flex items-center gap-1.5">
              <span>Chat with Us</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            {/* Tooltip arrow */}
            <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 border-y-6 border-y-transparent border-l-6 border-l-slate-900" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.9 }}
        className="relative w-14 h-14 bg-gradient-to-tr from-[#128C7E] to-[#25D366] rounded-full flex items-center justify-center text-white shadow-[0_10px_25px_-5px_rgba(37,211,102,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(37,211,102,0.6)] cursor-pointer group focus:outline-none transition-shadow duration-300"
        aria-label="Chat on WhatsApp with CEO Praveen Billa"
      >
        {/* Glow pulsing ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-35 animate-ping pointer-events-none scale-105" />
        
        {/* WhatsApp Icon */}
        <svg
          className="w-7 h-7 fill-current transition-transform duration-300 group-hover:rotate-12"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.852.002-2.63-1.023-5.101-2.885-6.963C16.53 1.928 14.06 1.01 11.43 1.01c-5.436 0-9.861 4.42-9.865 9.852-.001 1.77.478 3.49 1.38 5.02L1.93 20.48l4.717-1.326zM17.436 14.39c-.314-.157-1.858-.916-2.146-1.022-.289-.105-.499-.157-.709.157-.21.314-.813.996-.996 1.206-.184.21-.367.236-.68.078-1.564-.78-2.61-1.378-3.661-3.19-.277-.478.277-.444.792-1.474.087-.174.043-.327-.021-.458-.066-.13-.578-1.393-.792-1.906-.21-.505-.44-.436-.6-.444-.148-.007-.318-.008-.488-.008-.17 0-.446.064-.68.314-.233.25-1.07 1.045-1.07 2.548 0 1.502 1.092 2.955 1.243 3.155.152.2.215.328.675 1.03.713 1.086 1.55 1.636 2.514 2.05.618.266 1.176.248 1.62.182.493-.074 1.516-.618 1.728-1.216.21-.598.21-1.11.147-1.216-.063-.105-.23-.157-.544-.314z" />
        </svg>
      </motion.button>
    </div>
  );
}
