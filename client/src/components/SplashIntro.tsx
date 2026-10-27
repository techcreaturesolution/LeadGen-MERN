import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const SplashIntro = ({ onComplete }: { onComplete: () => void }) => {
  const [showText, setShowText] = useState(false);
  const [isZoomingOut, setIsZoomingOut] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const fullText = "LeadReach AI";

  useEffect(() => {
    // 1. Show text after sticks animation
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 500);

    // 2. Start zooming out
    const zoomTimer = setTimeout(() => {
      setIsZoomingOut(true);
    }, 1100);

    // 3. Complete splash and fade out
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1500);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(zoomTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (showText) {
      let i = 0;
      interval = setInterval(() => {
        setDisplayedText(fullText.slice(0, i + 1));
        i++;
        if (i >= fullText.length) {
          clearInterval(interval);
        }
      }, 40); // Faster Typewriter speed
    }
    return () => clearInterval(interval);
  }, [showText]);

  return (
    <motion.div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <motion.div
        className="flex items-center gap-3"
        initial={{ scale: 3 }}
        animate={{ scale: isZoomingOut ? 1 : 3 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      >
        {/* 3 Sticks */}
        <div className="flex gap-1 items-end h-10">
          <motion.div 
            className="w-2.5 bg-[#2563EB] rounded-sm"
            initial={{ height: "0%" }}
            animate={{ height: ["0%", "100%", "60%"] }}
            transition={{ duration: 0.3, delay: 0.1, ease: "easeInOut" }}
          />
          <motion.div 
            className="w-2.5 bg-[#2563EB] rounded-sm"
            initial={{ height: "0%" }}
            animate={{ height: ["0%", "100%", "100%"] }}
            transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
          />
          <motion.div 
            className="w-2.5 bg-[#2563EB] rounded-sm"
            initial={{ height: "0%" }}
            animate={{ height: ["0%", "100%", "80%"] }}
            transition={{ duration: 0.3, delay: 0.3, ease: "easeInOut" }}
          />
        </div>

        {/* Text with Typewriter Effect */}
        <div className="overflow-hidden flex items-center h-12">
          {showText && (
            <div className="text-4xl font-bold text-white whitespace-nowrap flex items-center">
              <span>{displayedText}</span>
              <motion.span
                className="w-[3px] h-9 bg-blue-500 ml-1 inline-block"
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              />
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
