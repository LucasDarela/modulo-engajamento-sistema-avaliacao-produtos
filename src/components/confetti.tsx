"use client";

import { useEffect, useState } from "react";

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#fbbf24"];
const PIECES = 64;

type Piece = {
  left: number;
  width: number;
  height: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
  spin: number;
};

function createPieces(): Piece[] {
  return Array.from({ length: PIECES }, (_, index) => ({
    left: Math.random() * 100,
    width: 6 + Math.random() * 6,
    height: 8 + Math.random() * 10,
    color: COLORS[index % COLORS.length],
    delay: Math.random() * 0.6,
    duration: 2.2 + Math.random() * 1.6,
    drift: (Math.random() - 0.5) * 240,
    spin: 360 + Math.random() * 720,
  }));
}

export function Confetti() {
  // Gerado só no cliente: valores aleatórios no SSR quebrariam a hidratação
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    setPieces(createPieces());
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden motion-reduce:hidden"
    >
      {pieces.map((piece, index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: lista gerada uma única vez
          key={index}
          className="absolute top-0 block animate-confetti rounded-[2px]"
          style={
            {
              left: `${piece.left}%`,
              width: piece.width,
              height: piece.height,
              backgroundColor: piece.color,
              "--confetti-delay": `${piece.delay}s`,
              "--confetti-duration": `${piece.duration}s`,
              "--confetti-drift": `${piece.drift}px`,
              "--confetti-spin": `${piece.spin}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
