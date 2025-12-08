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

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="text-center">
        <h2 className="mb-2 text-4xl font-black text-black">
          קוד PIN של המשחק
        </h2>
        <div className="brutal-card mb-4 inline-block bg-[#FFE66D] px-8 py-4">
          <div className="text-7xl font-black text-black font-mono">{pin}</div>
        </div>
        <p className="text-lg font-bold text-black">
          שתף את הקוד הזה עם השחקנים כדי שיצטרפו
        </p>
      </div>

      <div className="brutal-card bg-[#FFF9E6] p-6">
        <h3 className="mb-4 text-2xl font-black text-black">
          שחקנים ({players.length})
        </h3>
        {players.length === 0 ? (
          <p className="text-lg font-bold text-black">
            ממתין לשחקנים שיצטרפו...
          </p>
        ) : (
          <ul className="space-y-3">
            {players.map((player) => (
              <li
                key={player.id}
                className="brutal-border flex items-center justify-between bg-[#C7CEEA] p-4"
              >
                <span className="text-lg font-black text-black">
                  {player.nickname}
                </span>
                <span className="text-lg font-black text-black">
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
          className="brutal-button bg-[#FF6B9D] px-8 py-3 text-lg font-black text-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          התחל משחק
        </button>
      </div>
    </div>
  );
}
