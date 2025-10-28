'use client';

import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  left: string;
  backgroundColor: string;
  animationDelay: string;
  animationDuration: string;
}

export default function Confetti({ show }: { show: boolean }) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (show) {
      const pieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        backgroundColor: ['#ffd700', '#ff0080', '#00ff88', '#ff6b35', '#4facfe', '#f093fb'][Math.floor(Math.random() * 6)],
        animationDelay: `${Math.random() * 0.5}s`,
        animationDuration: `${2 + Math.random() * 2}s`,
      }));
      setConfetti(pieces);

      const timer = setTimeout(() => setConfetti([]), 4000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!confetti.length) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0 w-3 h-3 rounded-sm"
          style={{
            left: piece.left,
            backgroundColor: piece.backgroundColor,
            animation: `confetti ${piece.animationDuration} linear forwards`,
            animationDelay: piece.animationDelay,
          }}
        />
      ))}
    </div>
  );
}
