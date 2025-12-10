"use client";

import { useEffect, useRef } from "react";
import { LeaderboardEntry } from "@/types";
import { useSound } from "@/contexts/SoundContext";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  maxDisplay?: number;
}

export default function Leaderboard({
  entries,
  maxDisplay = 5,
}: LeaderboardProps) {
  const { playSound } = useSound();
  const previousCountRef = useRef(0);
  const displayEntries = entries.slice(0, maxDisplay);

  const getRankColor = (rank: number) => {
    if (rank === 1) return "#FFE66D";
    if (rank === 2) return "#C7CEEA";
    if (rank === 3) return "#FFB347";
    return "#FFF9E6";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `${rank}.`;
  };

  useEffect(() => {
    if (entries.length === 0) return;
    if (previousCountRef.current !== entries.length) {
      playSound("leaderboard");
    }
    previousCountRef.current = entries.length;
  }, [entries.length, playSound]);

  return (
    <div className="brutal-card bg-[#FFF9E6] p-4 sm:p-6">
      <h3 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-black text-black">
        לוח תוצאות
      </h3>
      {displayEntries.length === 0 ? (
        <p className="text-base sm:text-lg font-bold text-black">
          אין ניקוד עדיין
        </p>
      ) : (
        <ul className="space-y-2 sm:space-y-3">
          {displayEntries.map((entry) => (
            <li
              key={entry.player_id}
              className="brutal-border flex items-center justify-between p-3 sm:p-4 gap-2 sm:gap-4"
              style={{ backgroundColor: getRankColor(entry.rank) }}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <span className="text-lg sm:text-xl font-black flex-shrink-0">
                  {getRankIcon(entry.rank)}
                </span>
                <span className="text-base sm:text-lg font-black text-black truncate">
                  {entry.nickname}
                </span>
              </div>
              <span className="text-base sm:text-lg font-black text-black flex-shrink-0 whitespace-nowrap">
                {entry.score} נקודות
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
