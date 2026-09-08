"use client";

import { useEffect, useState, type CSSProperties } from "react";

type ConfettiStyle = CSSProperties & {
  "--confetti-color": string;
  "--confetti-width": string;
  "--confetti-height": string;
  "--confetti-radius": string;
  "--confetti-end-x": string;
  "--confetti-end-y": string;
  "--confetti-rotation": string;
  "--confetti-end-rotation": string;
  "--confetti-delay": string;
};

const colors = ["#3b624e", "#d7a950", "#b95342", "#617a9b", "#cabf9d"];

function noise(index: number, salt: number) {
  let value = Math.imul(index + 1, 1_664_525) + Math.imul(salt + 1, 1_013_904_223);
  value = Math.imul(value ^ (value >>> 16), 2_246_822_507);
  value ^= value >>> 13;
  return (value >>> 0) / 4_294_967_296;
}

const pieces = Array.from({ length: 240 }, (_, index) => {
  const shape = noise(index, 1);
  const isStrip = shape < 0.24;
  const isCircle = shape > 0.82;
  const rotation = 180 + Math.round(noise(index, 2) * 360);
  const style: ConfettiStyle = {
    left: `${Math.round(noise(index, 3) * 100)}vw`,
    top: `-${20 + Math.round(noise(index, 4) * 30)}vh`,
    "--confetti-color": colors[Math.floor(noise(index, 5) * colors.length)],
    "--confetti-width": `${isStrip ? 3 + Math.round(noise(index, 6) * 2) : 6 + Math.round(noise(index, 6) * 6)}px`,
    "--confetti-height": `${isStrip ? 16 + Math.round(noise(index, 7) * 12) : 8 + Math.round(noise(index, 7) * 7)}px`,
    "--confetti-radius": isCircle ? "999px" : "1px",
    "--confetti-end-x": `${Math.round(noise(index, 8) * 24) - 12}vw`,
    "--confetti-end-y": `${160 + Math.round(noise(index, 9) * 60)}vh`,
    "--confetti-rotation": `${rotation}deg`,
    "--confetti-end-rotation": `${rotation * 2}deg`,
    "--confetti-delay": `${Math.round(Math.pow(noise(index, 10), 2) * 1300)}ms`,
  };

  return { id: index, style };
});

export function CompletionConfetti() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 5300);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="completion-confetti" aria-hidden="true">
      {pieces.map((piece) => (
        <span key={piece.id} className="completion-confetti-piece" style={piece.style} />
      ))}
    </div>
  );
}
