"use client";

import { useEffect, useState } from "react";

interface TimerProps {
  timeLimit: number;
  onComplete: () => void;
  running: boolean;
}

export default function Timer({ timeLimit, onComplete, running }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    if (!running) {
      setTimeLeft(timeLimit);
      return;
    }

    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, running, timeLimit, onComplete]);

  const percentage = (timeLeft / timeLimit) * 100;
  const color =
    percentage > 50 ? "#95E1D3" : percentage > 25 ? "#FFE66D" : "#FF6B6B";

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-black text-black">זמן נותר</span>
        <span className="text-3xl font-black text-black">{timeLeft}ש'</span>
      </div>
      <div className="brutal-border h-8 w-full overflow-hidden bg-[#E0E0E0]">
        <div
          className="h-full transition-all duration-1000"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
