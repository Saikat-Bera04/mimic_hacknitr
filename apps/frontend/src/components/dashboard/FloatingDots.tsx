'use client';

import React, { useEffect, useState } from 'react';

const NUM_PARTICLES = 25;

interface Particle {
  id: number;
  top: string;
  left: string;
  size: number;
  animationDuration: string;
  animationDelay: string;
  color: string;
  blur: number;
  zDepth: number;
  orbitRadius: number;
}

const PARTICLE_COLORS = [
  'rgba(0, 102, 255, 0.6)',
  'rgba(139, 92, 246, 0.5)',
  'rgba(6, 182, 212, 0.5)',
  'rgba(16, 185, 129, 0.4)',
  'rgba(245, 158, 11, 0.3)',
];

export function FloatingDots() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: NUM_PARTICLES }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 6 + 2,
      animationDuration: `${Math.random() * 12 + 6}s`,
      animationDelay: `${Math.random() * 5}s`,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      blur: Math.random() * 3,
      zDepth: Math.floor(Math.random() * 3),
      orbitRadius: Math.random() * 40 + 20,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: '800px' }}>
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            top: p.top,
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            filter: `blur(${p.blur}px)`,
            animation: `dot-float ${p.animationDuration} ease-in-out infinite, dot-fade ${p.animationDuration} linear infinite`,
            animationDelay: p.animationDelay,
            transform: `translateZ(${p.zDepth * 30}px)`,
          }}
        />
      ))}
      {/* Ambient light orbs */}
      <div
        className="absolute w-72 h-72 rounded-full opacity-10"
        style={{
          top: '20%',
          left: '10%',
          background: 'radial-gradient(circle, rgba(0, 102, 255, 0.3), transparent 70%)',
          animation: 'float-3d 10s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-96 h-96 rounded-full opacity-10"
        style={{
          bottom: '10%',
          right: '5%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3), transparent 70%)',
          animation: 'float-3d 14s ease-in-out infinite reverse',
        }}
      />
      <div
        className="absolute w-48 h-48 rounded-full opacity-5"
        style={{
          top: '60%',
          left: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.4), transparent 70%)',
          animation: 'float-3d 8s ease-in-out infinite 2s',
        }}
      />
    </div>
  );
}
