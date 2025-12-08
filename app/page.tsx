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
      <main className="w-full max-w-2xl text-center">
        <h1
          className="mb-4 text-7xl font-black text-black"
          style={{ textShadow: "6px 6px 0px #FFE66D" }}
        >
          Quiz Rush
        </h1>
        <p className="mb-12 text-2xl font-bold text-black">
          משחק חידונים מרובה משתתפים בזמן אמת
        </p>

        <div className="flex flex-col gap-6 sm:flex-row sm:justify-center">
          {user ? (
            <Link
              href="/quizzes"
              className="brutal-button inline-block bg-[#FF6B9D] px-8 py-4 text-lg text-black"
            >
              החידונים שלי
            </Link>
          ) : (
            <div className="brutal-button inline-block bg-[#E0E0E0] px-8 py-4 text-lg text-gray-600 cursor-not-allowed opacity-60">
              החידונים שלי (נדרשת התחברות)
            </div>
          )}
          <Link
            href="/play"
            className="brutal-button inline-block bg-[#4ECDC4] px-8 py-4 text-lg text-black"
          >
            הצטרף למשחק
          </Link>
        </div>
      </main>
    </div>
  );
}
