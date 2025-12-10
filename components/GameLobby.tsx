"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { Player } from "@/types";

interface GameLobbyProps {
  gameId: string;
  pin: string;
  onStartGame: () => void;
}

export default function GameLobby({
  gameId,
  pin,
  onStartGame,
}: GameLobbyProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const gameLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/play/${gameId}`
      : "";

  useEffect(() => {
    const playersRef = collection(db, "games", gameId, "players");
    const q = query(playersRef, orderBy("joined_at", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const playersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Player[];
      setPlayers(playersData);
    });

    return () => unsubscribe();
  }, [gameId]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(gameLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const shareWhatsApp = () => {
    const message = `הצטרף למשחק Quiz Rush!\nקוד PIN: ${pin}\nאו לחץ על הקישור: ${gameLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl sm:text-3xl md:text-4xl font-black text-black">
          קוד PIN של המשחק
        </h2>
        <div className="brutal-card mb-4 inline-block bg-[#FFE66D] px-4 sm:px-6 md:px-8 py-3 sm:py-4">
          <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-black font-mono">
            {pin}
          </div>
        </div>
        <p className="text-base sm:text-lg font-bold text-black px-4 mb-4">
          שתף את הקוד הזה עם השחקנים כדי שיצטרפו
        </p>

        <div className="brutal-card bg-[#FFF9E6] p-4 sm:p-6 mb-4">
          <h3 className="mb-3 text-lg sm:text-xl font-black text-black">
            או שתף קישור ישיר
          </h3>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
            <div className="flex-1 brutal-border bg-white p-2 sm:p-3 rounded">
              <p className="text-xs sm:text-sm font-bold text-black break-all text-center sm:text-left">
                {gameLink}
              </p>
            </div>
            <button
              onClick={copyLink}
              className="brutal-button bg-[#4ECDC4] px-4 py-2 sm:py-3 text-sm sm:text-base font-black text-black min-h-[44px] whitespace-nowrap"
            >
              {linkCopied ? "הועתק!" : "העתק קישור"}
            </button>
          </div>
          <button
            onClick={shareWhatsApp}
            className="brutal-button w-full mt-3 bg-[#25D366] px-4 py-3 text-base sm:text-lg font-black text-white min-h-[44px] flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 sm:w-6 sm:h-6"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            שתף ב-WhatsApp
          </button>
        </div>
      </div>

      <div className="brutal-card bg-[#FFF9E6] p-4 sm:p-6">
        <h3 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-black text-black">
          שחקנים ({players.length})
        </h3>
        {players.length === 0 ? (
          <p className="text-base sm:text-lg font-bold text-black">
            ממתין לשחקנים שיצטרפו...
          </p>
        ) : (
          <ul className="space-y-2 sm:space-y-3">
            {players.map((player) => (
              <li
                key={player.id}
                className="brutal-border flex items-center justify-between bg-[#C7CEEA] p-3 sm:p-4 gap-2 sm:gap-4"
              >
                <span className="text-base sm:text-lg font-black text-black truncate flex-1 min-w-0">
                  {player.nickname}
                </span>
                <span className="text-base sm:text-lg font-black text-black flex-shrink-0 whitespace-nowrap">
                  ניקוד: {player.score}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-center">
        <button
          onClick={onStartGame}
          disabled={players.length === 0}
          className="brutal-button bg-[#FF6B9D] px-6 sm:px-8 py-3 text-base sm:text-lg font-black text-black disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          התחל משחק
        </button>
      </div>
    </div>
  );
}
