import React, { useMemo } from 'react';

export const StarryBackground: React.FC = () => {
  // Generate a deterministic list of stars to prevent re-render shifts
  const stars = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => {
      const top = ((i * 37 + 13) % 100);
      const left = ((i * 61 + 23) % 100);
      const size = (i % 3 === 0 ? 2 : i % 2 === 0 ? 1.5 : 1);
      const duration = 2.5 + (i % 5) * 0.8;
      const delay = (i % 7) * 0.5;
      const opacity = 0.3 + (i % 5) * 0.15;

      return {
        id: i,
        top: `${top}%`,
        left: `${left}%`,
        width: `${size}px`,
        height: `${size}px`,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        opacity,
      };
    });
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {stars.map((star) => (
        <span
          key={star.id}
          className="absolute rounded-full bg-white animate-twinkle shadow-[0_0_6px_rgba(255,255,255,0.8)]"
          style={{
            top: star.top,
            left: star.left,
            width: star.width,
            height: star.height,
            opacity: star.opacity,
            animationDuration: star.animationDuration,
            animationDelay: star.animationDelay,
          }}
        />
      ))}
    </div>
  );
};
