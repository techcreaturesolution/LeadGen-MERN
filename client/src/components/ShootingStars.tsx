import React from 'react';
import { motion } from 'framer-motion';

export const ShootingStars: React.FC = () => {
  const shootingStars = [
    { id: 1, top: '15%', left: '10%', delay: 0.2, duration: 2.2 },
    { id: 2, top: '35%', left: '40%', delay: 3.5, duration: 2.0 },
    { id: 3, top: '60%', left: '20%', delay: 6.8, duration: 2.5 },
    { id: 4, top: '80%', left: '55%', delay: 9.0, duration: 2.1 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {shootingStars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute h-[2px] w-[150px] bg-gradient-to-r from-transparent via-blue-200 to-white shadow-[0_0_12px_rgba(255,255,255,0.9)]"
          style={{
            top: star.top,
            left: star.left,
            transform: 'rotate(-35deg)',
          }}
          initial={{ opacity: 0, x: -200, y: -100 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: [0, 400],
            y: [0, 250],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            repeatDelay: 8,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};
