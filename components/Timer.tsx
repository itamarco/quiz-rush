"use client";

import { useEffect, useState } from "react";

interface TimerProps {
  timeLimit: number;
  onComplete: () => void;
  running: boolean;
  startTime?: number | null;
}

export default function Timer({
  timeLimit,
  onComplete,
  running,
  startTime,
}: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    if (!running) {
      setTimeLeft(timeLimit);
      return;
    }

    if (!startTime) {
      return;
    }

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, timeLimit - elapsed);

      if (remaining <= 0) {
        setTimeLeft(0);
        onComplete();
        return;
      }

      setTimeLeft(remaining);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 100);

    return () => clearInterval(timer);
  }, [running, timeLimit, onComplete, startTime]);

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
