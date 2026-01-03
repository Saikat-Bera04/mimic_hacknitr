'use client';

import React, { useEffect, useState } from 'react';

const NUM_DOTS = 15;

export function FloatingDots() {
  const [dots, setDots] = useState<
    {
      id: number;
      top: string;
      left: string;
      size: number;
      animationDuration: string;
      animationDelay: string;
    }[]
  >([]);

  useEffect(() => {
    const newDots = Array.from({ length: NUM_DOTS }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 4 + 2, // size between 2px and 6px
      animationDuration: `${Math.random() * 10 + 5}s`, // duration between 5s and 15s
      animationDelay: `${Math.random() * 5}s`,
    }));
    setDots(newDots);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map(dot => (
        <div
          key={dot.id}
          className="absolute rounded-full bg-red-500/80"
          style={{
            top: dot.top,
            left: dot.left,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            animation: `dot-float ${dot.animationDuration} ease-in-out infinite, dot-fade ${dot.animationDuration} linear infinite`,
            animationDelay: dot.animationDelay,
          }}
        />
      ))}
    </div>
  );
}
