"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Quiz } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/api";
import AuthButton from "@/components/AuthButton";
import { logger } from "@/lib/logger-client";

export default function QuizzesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        logger.warn("Unauthenticated user attempted to access quizzes page");
        router.push("/");
        return;
      }
      loadQuizzes();
    }
  }, [user, authLoading, router]);

  const loadQuizzes = async () => {
    try {
      logger.debug("Loading quizzes", { userId: user?.uid });
      const response = await fetchWithAuth("/api/quizzes");
      if (!response.ok) {
        if (response.status === 401) {
          logger.warn("Unauthorized access to quizzes", {
            userId: user?.uid,
            status: response.status,
          });
          router.push("/");
          return;
        }

        const errorData = await response.json().catch(() => ({}));
        logger.error(
          "Failed to load quizzes",
          new Error(errorData.error || "Unknown error"),
          {
            userId: user?.uid,
            status: response.status,
            errorData,
          }
        );

        const errorMessage = errorData.error || "נכשל בטעינת החידונים";
        if (errorMessage.includes("index") || errorMessage.includes("Index")) {
          const instructions =
            errorData.instructions ||
            "נדרש ליצור אינדקס ב-Firestore. אנא עקוב אחר ההוראות בקונסול.";
          const fullMessage = errorData.indexUrl
            ? `${instructions}\n\nקישור ליצירת האינדקס:\n${errorData.indexUrl}\n\nאו צור ידנית ב-Firebase Console > Firestore > Indexes`
            : instructions;
          alert(fullMessage);
          if (errorData.indexUrl) {
            console.log("Firestore Index Creation URL:", errorData.indexUrl);
          }
        } else {
          alert(errorMessage);
        }
        throw new Error(errorMessage);
      }
      const quizzesData = (await response.json()) as Quiz[];
      logger.info("Successfully loaded quizzes", {
        userId: user?.uid,
        count: quizzesData.length,
      });
      setQuizzes(quizzesData);
    } catch (error) {
      logger.error("Error loading quizzes", error, {
        userId: user?.uid,
        action: "loadQuizzes",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async (quizId: string) => {
    try {
      logger.info("Starting game", { userId: user?.uid, quizId });
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz_id: quizId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error(
          "Failed to start game",
          new Error(errorData.error || "Unknown error"),
          {
            userId: user?.uid,
            quizId,
            status: response.status,
          }
        );
        throw new Error("נכשל ביצירת המשחק");
      }

      const game = await response.json();
      logger.info("Successfully started game", {
        userId: user?.uid,
        quizId,
        gameId: game.id,
      });
      router.push(`/host/${game.id}`);
    } catch (error) {
      logger.error("Error starting game", error, {
        userId: user?.uid,
        quizId,
        action: "handleStartGame",
      });
      alert("נכשל בהתחלת המשחק. אנא נסה שוב.");
    }
  };

  const handleDelete = async (quizId: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את החידון הזה?")) return;

    try {
      logger.info("Deleting quiz", { userId: user?.uid, quizId });
      const response = await fetchWithAuth(`/api/quizzes?id=${quizId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logger.warn("Forbidden quiz deletion attempt", {
            userId: user?.uid,
            quizId,
            status: response.status,
          });
          alert("אין לך הרשאה למחוק חידון זה");
          return;
        }
        throw new Error("נכשל במחיקת החידון");
      }

      logger.info("Successfully deleted quiz", {
        userId: user?.uid,
        quizId,
      });
      loadQuizzes();
    } catch (error) {
      logger.error("Error deleting quiz", error, {
        userId: user?.uid,
        quizId,
        action: "handleDelete",
      });
      alert("נכשל במחיקת החידון");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF9E6]">
        <div className="text-2xl font-black text-black">טוען חידונים...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FFF9E6] py-4 sm:py-6 md:py-8">
      <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-black">
            החידונים שלי
          </h1>
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Link
              href="/create"
              className="brutal-button bg-[#FF6B9D] px-4 sm:px-6 py-2 text-sm sm:text-base font-black text-black min-h-[44px] flex items-center justify-center flex-1 sm:flex-none"
            >
              צור חידון חדש
            </Link>
            <AuthButton />
          </div>
        </div>

        {quizzes.length === 0 ? (
          <div className="brutal-card bg-[#FFE66D] p-6 sm:p-8 md:p-12 text-center">
            <p className="mb-4 text-lg sm:text-xl font-black text-black">
              אין חידונים עדיין. צור את החידון הראשון שלך!
            </p>
            <Link
              href="/create"
              className="brutal-button inline-block bg-[#4ECDC4] px-5 sm:px-6 py-2 text-sm sm:text-base font-black text-black min-h-[44px]"
            >
              צור חידון
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="brutal-card bg-[#FFF9E6] p-4 sm:p-6"
              >
                <h2 className="mb-2 text-xl sm:text-2xl font-black text-black break-words">
                  {quiz.title}
                </h2>
                {quiz.description && (
                  <p className="mb-3 sm:mb-4 text-xs sm:text-sm font-bold text-black break-words">
                    {quiz.description}
                  </p>
                )}
                <div className="mb-3 sm:mb-4 text-xs sm:text-sm font-bold text-black">
                  מגבלת זמן: {quiz.time_limit} שניות לשאלה
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleStartGame(quiz.id)}
                    className="brutal-button flex-1 bg-[#4ECDC4] px-3 sm:px-4 py-2 text-xs sm:text-sm font-black text-black min-h-[44px]"
                  >
                    ארח משחק
                  </button>
                  <Link
                    href={`/create?edit=${quiz.id}`}
                    className="brutal-button bg-[#FFE66D] px-3 sm:px-4 py-2 text-xs sm:text-sm font-black text-black min-h-[44px] flex items-center justify-center"
                  >
                    ערוך
                  </Link>
                  <button
                    onClick={() => handleDelete(quiz.id)}
                    className="brutal-button bg-[#FF6B6B] px-3 sm:px-4 py-2 text-xs sm:text-sm font-black text-black min-h-[44px]"
                  >
                    מחק
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
