import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export function CinematicBackground() {
  const { isDark, transitionState, clickCoords } = useTheme();

  return (
    <>
      {/* Expanding Circular Reveal Effect */}
      <AnimatePresence>
        {transitionState !== 'idle' && clickCoords && (
          <motion.div
            className={`fixed pointer-events-none z-[9999] rounded-full mix-blend-overlay ${
              isDark ? 'bg-black' : 'bg-white'
            }`}
            style={{
              right: '2rem',
              top: '2rem',
              width: '150vmax',
              height: '150vmax',
              marginRight: '-75vmax',
              marginTop: '-75vmax',
            }}
            initial={{ 
              scale: 0,
              opacity: 0.8
            }}
            animate={{ 
              scale: 3, 
              opacity: 0 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "circOut" }}
          />
        )}
      </AnimatePresence>

      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        {/* Sky Gradient */}
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{
            background: isDark
              ? 'linear-gradient(to bottom, #020817 0%, #0f172a 40%, #1e293b 100%)'
              : 'linear-gradient(to bottom, #050b1a 0%, #111827 40%, #1f2937 100%)',
          }}
          transition={{ duration: 1.2, ease: [0.4, 0.0, 0.2, 1] }}
        />
        
        {/* Stars */}
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{ opacity: isDark ? 1 : 0.5 }}
          transition={{ duration: 1, delay: isDark ? 0.2 : 0 }}
        >
           <div className="absolute top-10 left-[20%] w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white] animate-twinkle" />
           <div className="absolute top-24 left-[60%] w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white] animate-twinkle" style={{ animationDelay: '1s' }} />
           <div className="absolute top-40 left-[80%] w-1 h-1 bg-white rounded-full shadow-[0_0_6px_white] animate-twinkle" style={{ animationDelay: '2s' }} />
           <div className="absolute top-16 left-[40%] w-2 h-2 bg-white rounded-full shadow-[0_0_12px_white] animate-twinkle" style={{ animationDelay: '0.5s' }} />
           <div className="absolute top-32 left-[10%] w-1 h-1 bg-white rounded-full shadow-[0_0_5px_white] animate-twinkle" style={{ animationDelay: '1.5s' }} />
           <div className="absolute top-64 left-[70%] w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white] animate-twinkle" style={{ animationDelay: '0.8s' }} />
           <div className="absolute top-80 left-[30%] w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white] animate-twinkle" style={{ animationDelay: '2.5s' }} />
        </motion.div>

        {/* Aurora Animation */}
        <motion.div
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none mix-blend-screen"
          initial={false}
          animate={{ opacity: isDark ? 0.7 : 0.85 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          {/* Emerald */}
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[30vh] bg-[#10B981] rounded-full blur-[90px] animate-aurora-1"></div>
          {/* Blue */}
          <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[40vh] bg-[#2563EB] rounded-full blur-[100px] animate-aurora-2"></div>
          {/* Purple */}
          <div className="absolute top-[10%] left-[20%] w-[55vw] h-[35vh] bg-[#8B5CF6] rounded-full blur-[110px] animate-aurora-3"></div>
          {/* Cyan */}
          <div className="absolute top-[30%] left-[40%] w-[45vw] h-[30vh] bg-[#22D3EE] rounded-full blur-[90px] animate-aurora-4"></div>
        </motion.div>


      </div>
    </>
  );
}
