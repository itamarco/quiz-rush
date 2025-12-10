"use client";

import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FFF9E6] p-4">
      <div className="absolute top-4 right-4">
        <AuthButton />
      </div>
      <main className="w-full max-w-2xl text-center px-4">
        <h1
          className="mb-4 text-4xl sm:text-6xl md:text-7xl font-black text-black"
          style={{ textShadow: "6px 6px 0px #FFE66D" }}
        >
          Quiz Rush
        </h1>
        <p className="mb-8 sm:mb-12 text-lg sm:text-xl md:text-2xl font-bold text-black px-4">
          משחק חידונים מרובה משתתפים בזמן אמת
        </p>

        <div className="flex flex-col gap-4 sm:gap-6 sm:flex-row sm:justify-center px-4">
          {user ? (
            <Link
              href="/quizzes"
              className="brutal-button inline-block bg-[#FF6B9D] px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg text-black min-h-[44px] flex items-center justify-center"
            >
              החידונים שלי
            </Link>
          ) : (
            <div className="brutal-button inline-block bg-[#E0E0E0] px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg text-gray-600 cursor-not-allowed opacity-60 min-h-[44px] flex items-center justify-center">
              החידונים שלי (נדרשת התחברות)
            </div>
          )}
          <Link
            href="/play"
            className="brutal-button inline-block bg-[#4ECDC4] px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg text-black min-h-[44px] flex items-center justify-center"
          >
            הצטרף למשחק
          </Link>
        </div>
      </main>
    </div>
  );
}
