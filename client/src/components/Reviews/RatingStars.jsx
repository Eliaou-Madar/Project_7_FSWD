// client/src/components/Reviews/RatingStars.jsx
import React from "react";

export default function RatingStars({ value = 0, size = 16 }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <div aria-label={`rating ${v}/5`} style={{ display: "inline-flex", gap: 2 }}>
      {[1,2,3,4,5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24" fill={n <= v ? "#f5b301" : "none"} stroke="#f5b301" strokeWidth="2">
          <polygon points="12,2 15,9 22,9 16.5,13.5 18.5,21 12,16.8 5.5,21 7.5,13.5 2,9 9,9" />
        </svg>
      ))}
    </div>
  );
}
