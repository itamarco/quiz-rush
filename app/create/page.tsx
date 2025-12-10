"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import QuizBuilder from "@/components/QuizBuilder";
import { Quiz, Question } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/api";
import AuthButton from "@/components/AuthButton";
import { logger } from "@/lib/logger-client";

function CreateQuizContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingData, setLoadingData] = useState(!!editId);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        logger.warn(
          "Unauthenticated user attempted to access create quiz page"
        );
        router.push("/");
        return;
      }
      if (editId) {
        loadQuizData(editId);
      } else {
        setLoadingData(false);
      }
    }
  }, [user, authLoading, editId, router]);

  const loadQuizData = async (quizId: string) => {
    try {
      logger.debug("Loading quiz for editing", {
        userId: user?.uid,
        quizId,
      });
      const response = await fetchWithAuth(`/api/quizzes/${quizId}`);
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logger.warn("Forbidden access to edit quiz", {
            userId: user?.uid,
            quizId,
            status: response.status,
          });
          alert("אין לך הרשאה לערוך חידון זה");
          router.push("/quizzes");
          return;
        }
        throw new Error("חידון לא נמצא");
      }
      const data = await response.json();
      logger.info("Successfully loaded quiz for editing", {
        userId: user?.uid,
        quizId,
        questionsCount: data.questions?.length || 0,
      });
      setQuiz(data.quiz as Quiz);
      setQuestions(data.questions as Question[]);
    } catch (error) {
      logger.error("Error loading quiz for editing", error, {
        userId: user?.uid,
        quizId,
        action: "loadQuizData",
      });
      alert("נכשל בטעינת החידון");
      router.push("/quizzes");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSave = async (
    quizData: Omit<Quiz, "id" | "created_at" | "user_id">,
    questionsData: Omit<Question, "id" | "quiz_id" | "created_at">[]
  ) => {
    setLoading(true);
    try {
      if (editId && quiz) {
        logger.info("Updating quiz", {
          userId: user?.uid,
          quizId: editId,
          questionsCount: questionsData.length,
        });
        const response = await fetchWithAuth("/api/quizzes", {
          method: "PUT",
          body: JSON.stringify({
            quizId: editId,
            quizData,
            questionsData,
          }),
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            logger.warn("Forbidden quiz update attempt", {
              userId: user?.uid,
              quizId: editId,
              status: response.status,
            });
            alert("אין לך הרשאה לערוך חידון זה");
            return;
          }
          throw new Error("נכשל בעדכון החידון");
        }

        logger.info("Successfully updated quiz", {
          userId: user?.uid,
          quizId: editId,
        });
        router.push("/quizzes");
      } else {
        logger.info("Creating new quiz", {
          userId: user?.uid,
          questionsCount: questionsData.length,
        });
        const response = await fetchWithAuth("/api/quizzes", {
          method: "POST",
          body: JSON.stringify({
            quizData,
            questionsData,
          }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            logger.warn("Unauthorized quiz creation attempt", {
              userId: user?.uid,
              status: response.status,
            });
            alert("נדרשת התחברות ליצירת חידון");
            router.push("/");
            return;
          }
          throw new Error("נכשל ביצירת החידון");
        }

        const result = await response.json();
        logger.info("Successfully created quiz", {
          userId: user?.uid,
          quizId: result.id,
        });
        router.push("/quizzes");
      }
    } catch (error) {
      logger.error("Error saving quiz", error, {
        userId: user?.uid,
        editId,
        action: "handleSave",
      });
      alert("נכשל בשמירת החידון. אנא נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF9E6]">
        <div className="text-2xl font-black text-black">טוען חידון...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FFF9E6] py-4 sm:py-6 md:py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-black">
            {editId ? "ערוך חידון" : "צור חידון"}
          </h1>
          <AuthButton />
        </div>
        <QuizBuilder
          quiz={quiz || undefined}
          questions={questions.length > 0 ? questions : undefined}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}

export default function CreateQuizPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FFF9E6]">
          <div className="text-2xl font-black text-black">טוען...</div>
        </div>
      }
    >
      <CreateQuizContent />
    </Suspense>
  );
}
