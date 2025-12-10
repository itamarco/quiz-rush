"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinGamePage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      setError("אנא הזן קוד PIN בן 4 ספרות תקין");
      return;
    }

    const response = await fetch(`/api/games?pin=${pin}`);
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "משחק לא נמצא");
      return;
    }

    router.push(`/play/${data.id}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFF9E6] p-4">
      <div className="brutal-card w-full max-w-md bg-[#FFE66D] p-4 sm:p-6 md:p-8">
        <h1 className="mb-4 sm:mb-6 text-center text-2xl sm:text-3xl md:text-4xl font-black text-black">
          הצטרף למשחק
        </h1>

        <form onSubmit={handleJoin} className="space-y-4 sm:space-y-6">
          <div>
            <label
              htmlFor="pin"
              className="block text-sm font-bold text-black mb-2"
            >
              הזן קוד PIN של המשחק
            </label>
            <input
              id="pin"
              type="text"
              value={pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                setPin(value);
                setError("");
              }}
              className="brutal-input w-full bg-white px-4 py-3 text-center text-2xl sm:text-3xl font-black tracking-widest text-black min-h-[60px]"
              placeholder="0000"
              maxLength={4}
              autoFocus
            />
          </div>

          {error && (
            <div className="brutal-border bg-[#FF6B6B] p-3 text-sm font-bold text-black">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="brutal-button w-full bg-[#4ECDC4] px-4 py-3 font-black text-black min-h-[44px] text-base sm:text-lg"
          >
            הצטרף למשחק
          </button>
        </form>
      </div>
    </div>
  );
}
