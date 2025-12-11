"use client";

import { useEffect, useRef } from "react";
import { LeaderboardEntry } from "@/types";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  maxDisplay?: number;
  isFinal?: boolean;
}

const RANK_COLORS: Record<number, string> = {
  1: "#FFE66D",
  2: "#C7CEEA",
  3: "#FFB347",
};

const RANK_ICONS: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

const stopAudio = (audio: HTMLAudioElement | null) => {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
};

const startLeaderboardMusic = (): HTMLAudioElement => {
  const audio = new Audio("/sounds/leaderboard.mp3");
  audio.loop = true;
  audio.volume = 0.6;
  audio.play().catch((error) => {
    console.warn("Failed to play leaderboard music:", error);
  });
  return audio;
};

export default function Leaderboard({
  entries,
  maxDisplay = 5,
  isFinal = false,
}: LeaderboardProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const displayEntries = entries.slice(0, maxDisplay);

  const getRankColor = (rank: number) => RANK_COLORS[rank] || "#FFF9E6";
  const getRankIcon = (rank: number) => RANK_ICONS[rank] || `${rank}.`;

  useEffect(() => {
    const shouldPlay = !isFinal && entries.length > 0;

    if (!shouldPlay) {
      stopAudio(audioRef.current);
      audioRef.current = null;
      return;
    }

    if (!audioRef.current) {
      audioRef.current = startLeaderboardMusic();
    }

    return () => {
      stopAudio(audioRef.current);
      audioRef.current = null;
    };
  }, [isFinal, entries.length]);

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
