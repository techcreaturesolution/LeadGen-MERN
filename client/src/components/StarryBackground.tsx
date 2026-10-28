import React, { useMemo } from 'react';

export const StarryBackground: React.FC = () => {
  // Generate deterministic stars optimized for GPU compositor layers
  const stars = useMemo(() => {
    return Array.from({ length: 36 }).map((_, i) => {
      const top = ((i * 47 + 13) % 100);
      const left = ((i * 59 + 23) % 100);
      const size = (i % 3 === 0 ? 2 : 1.5);
      const duration = 2.5 + (i % 4) * 0.8;
      const delay = (i % 5) * 0.4;
      const opacity = 0.35 + (i % 4) * 0.15;

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
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 transform-gpu">
      {stars.map((star) => (
        <span
          key={star.id}
          className="absolute rounded-full bg-white animate-twinkle will-change-[opacity]"
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
