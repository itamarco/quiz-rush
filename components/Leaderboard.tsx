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
    <div className="brutal-card bg-[#FFF9E6] p-6">
      <h3 className="mb-4 text-2xl font-black text-black">לוח תוצאות</h3>
      {displayEntries.length === 0 ? (
        <p className="text-lg font-bold text-black">אין ניקוד עדיין</p>
      ) : (
        <ul className="space-y-3">
          {displayEntries.map((entry) => (
            <li
              key={entry.player_id}
              className="brutal-border flex items-center justify-between p-4"
              style={{ backgroundColor: getRankColor(entry.rank) }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl font-black">
                  {getRankIcon(entry.rank)}
                </span>
                <span className="text-lg font-black text-black">
                  {entry.nickname}
                </span>
              </div>
              <span className="text-lg font-black text-black">
                {entry.score} נקודות
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
