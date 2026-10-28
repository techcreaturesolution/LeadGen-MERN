import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const SplashIntro = ({ onComplete }: { onComplete: () => void }) => {
  const [showText, setShowText] = useState(false);
  const [isZoomingOut, setIsZoomingOut] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const fullText = "LeadReach AI";

  useEffect(() => {
    // 1. Show text after sticks animation
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 450);

    // 2. Start zooming out
    const zoomTimer = setTimeout(() => {
      setIsZoomingOut(true);
    }, 1300);

    // 3. Complete splash and fade out smoothly
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1800);

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
      }, 40); // Classic smooth typewriter speed
    }
    return () => clearInterval(interval);
  }, [showText]);

  return (
    <motion.div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505] cursor-pointer"
      onClick={onComplete}
      title="Click anywhere to skip"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <motion.div
        className="flex items-center gap-3 select-none"
        initial={{ scale: 3 }}
        animate={{ scale: isZoomingOut ? 1 : 3 }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
      >
        {/* 3 Sticks */}
        <div className="flex gap-1 items-end h-10">
          <motion.div 
            className="w-2.5 bg-[#2563EB] rounded-sm"
            initial={{ height: "0%" }}
            animate={{ height: ["0%", "100%", "60%"] }}
            transition={{ duration: 0.25, delay: 0.05, ease: "easeInOut" }}
          />
          <motion.div 
            className="w-2.5 bg-[#2563EB] rounded-sm"
            initial={{ height: "0%" }}
            animate={{ height: ["0%", "100%", "100%"] }}
            transition={{ duration: 0.25, delay: 0.1, ease: "easeInOut" }}
          />
          <motion.div 
            className="w-2.5 bg-[#2563EB] rounded-sm"
            initial={{ height: "0%" }}
            animate={{ height: ["0%", "100%", "80%"] }}
            transition={{ duration: 0.25, delay: 0.15, ease: "easeInOut" }}
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
                transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}
              />
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
