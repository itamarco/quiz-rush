"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase/client";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  getDocs,
} from "firebase/firestore";
import GameLobby from "@/components/GameLobby";
import QuestionDisplay from "@/components/QuestionDisplay";
import Timer from "@/components/Timer";
import Leaderboard from "@/components/Leaderboard";
import { Game, Question, LeaderboardEntry } from "@/types";
import { logger } from "@/lib/logger-client";
import { useSound } from "@/contexts/SoundContext";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";

type GameState = "lobby" | "question" | "results" | "finished";

export default function HostGamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const { playSound } = useSound();

  const [game, setGame] = useState<Game | null>(null);
  const [quiz, setQuiz] = useState<{ time_limit: number } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [gameState, setGameState] = useState<GameState>("lobby");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(
    null
  );

  const musicType =
    gameState === "lobby" || gameState === "finished"
      ? "lobby"
      : gameState === "question"
      ? "round"
      : null;
  useBackgroundMusic(musicType);

  useEffect(() => {
    const loadGame = async () => {
      try {
        logger.debug("Loading game for host", { gameId });
        const response = await fetch(`/api/games/${gameId}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          logger.error(
            "Failed to load game",
            new Error(errorData.error || "Unknown error"),
            {
              gameId,
              status: response.status,
              action: "loadGame",
            }
          );
          throw new Error(errorData.error || "נכשל בטעינת המשחק");
        }
        const data = await response.json();
        logger.info("Successfully loaded game for host", {
          gameId,
          quizId: data.game?.quiz_id,
          questionsCount: data.questions?.length || 0,
        });
        setGame(data.game as Game);
        setQuiz(data.quiz as { time_limit: number });
        setQuestions(data.questions as Question[]);
      } catch (error) {
        logger.error("Error loading game", error, {
          gameId,
          action: "loadGame",
        });
        alert("נכשל בטעינת המשחק. אנא נסה שוב.");
      }
    };

    loadGame();
  }, [gameId]);

  useEffect(() => {
    if (!game || gameState === "lobby") return;

    const playersRef = collection(db, "games", gameId, "players");
    const playersQuery = query(playersRef, orderBy("score", "desc"));

    const unsubscribePlayers = onSnapshot(playersQuery, (snapshot) => {
      const entries: LeaderboardEntry[] = snapshot.docs.map((doc, index) => ({
        player_id: doc.id,
        nickname: doc.data().nickname,
        score: doc.data().score || 0,
        rank: index + 1,
      }));
      setLeaderboard(entries);
    });

    return () => unsubscribePlayers();
  }, [game, gameState, gameId]);

  const updateLeaderboard = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}/leaderboard`);
      if (response.ok) {
        const entries = (await response.json()) as LeaderboardEntry[];
        setLeaderboard(entries);
      }
    } catch (error) {
      console.error("Error updating leaderboard:", error);
    }
  };

  const startGame = async () => {
    try {
      logger.info("Starting game", {
        gameId,
        questionsCount: questions.length,
      });
      const response = await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: {
            status: "playing",
            current_question: 0,
          },
          stateUpdate: {
            event: "question_start",
            questionIndex: 0,
            question: questions[0],
            timeLimit: quiz?.time_limit || 15,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error(
          "Failed to start game",
          new Error(errorData.error || "Unknown error"),
          {
            gameId,
            status: response.status,
            action: "startGame",
          }
        );
        throw new Error("נכשל בהתחלת המשחק");
      }

      logger.info("Successfully started game", { gameId });
      setGame((prev) =>
        prev ? { ...prev, status: "playing", current_question: 0 } : null
      );
      setGameState("question");
      setCurrentQuestionIndex(0);
      setQuestionStartTime(Date.now());
      playSound("gameStart");
    } catch (error) {
      logger.error("Error starting game", error, {
        gameId,
        action: "startGame",
      });
      alert("נכשל בהתחלת המשחק. אנא נסה שוב.");
    }
  };

  const broadcastQuestion = async (index: number) => {
    try {
      await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stateUpdate: {
            event: "question_start",
            questionIndex: index,
            question: questions[index],
            timeLimit: quiz?.time_limit || 15,
          },
        }),
      });
    } catch (error) {
      console.error("Error broadcasting question:", error);
    }
  };

  const handleTimerComplete = async () => {
    try {
      await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stateUpdate: {
            event: "question_end",
            questionIndex: currentQuestionIndex,
            correctAnswer: questions[currentQuestionIndex].correct_index,
          },
        }),
      });

      setGameState("results");
      updateLeaderboard();
      playSound("questionEnd");
    } catch (error) {
      console.error("Error completing question:", error);
    }
  };

  const goToNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      try {
        await fetch(`/api/games/${gameId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            updates: {
              current_question: nextIndex,
            },
            stateUpdate: {
              event: "question_start",
              questionIndex: nextIndex,
              question: questions[nextIndex],
              timeLimit: quiz?.time_limit || 15,
            },
          }),
        });
        setCurrentQuestionIndex(nextIndex);
        setGame((prev) =>
          prev ? { ...prev, current_question: nextIndex } : null
        );
        setGameState("question");
        setQuestionStartTime(Date.now());
      } catch (error) {
        console.error("Error moving to next question:", error);
      }
    } else {
      endGame();
    }
  };

  const endGame = async () => {
    try {
      await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: {
            status: "finished",
          },
          stateUpdate: {
            event: "game_end",
          },
        }),
      });

      setGameState("finished");
    } catch (error) {
      console.error("Error ending game:", error);
    }
  };

  useEffect(() => {
    if (gameState === "question") {
      playSound("questionStart");
    }
  }, [gameState, playSound]);

  if (!game || !quiz || questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF9E6]">
        <div className="text-2xl font-black text-black">טוען...</div>
      </div>
    );
  }

  if (gameState === "lobby") {
    return (
      <div className="min-h-screen bg-[#FFF9E6] py-4 sm:py-6 md:py-8">
        <div className="mb-4 sm:mb-6 px-4">
          <button
            onClick={() => router.push("/quizzes")}
            className="mb-4 flex items-center gap-2 text-base sm:text-lg font-black text-black hover:opacity-80"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 sm:w-6 sm:h-6"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            חזור
          </button>
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-black">
              ארח משחק
            </h1>
          </div>
        </div>
        <GameLobby gameId={gameId} pin={game.pin} onStartGame={startGame} />
      </div>
    );
  }

  if (gameState === "finished") {
    return (
      <div className="min-h-screen bg-[#FFF9E6] py-4 sm:py-6 md:py-8">
        <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6 p-4 sm:p-6">
          <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-black text-black">
            המשחק הסתיים!
          </h2>
          <Leaderboard entries={leaderboard} maxDisplay={10} isFinal={true} />
          <div className="flex justify-center">
            <button
              onClick={() => router.push("/")}
              className="brutal-button bg-[#FF6B9D] px-6 sm:px-8 py-3 text-base sm:text-lg font-black text-black min-h-[44px]"
            >
              חזור לדף הבית
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-[#FFF9E6] py-4 sm:py-6 md:py-8">
      <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6 p-4 sm:p-6">
        {gameState === "question" && (
          <>
            <Timer
              timeLimit={quiz.time_limit}
              onComplete={handleTimerComplete}
              running={true}
              startTime={questionStartTime}
            />
            <QuestionDisplay
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
            />
            <div className="flex justify-center">
              <button
                onClick={handleTimerComplete}
                className="brutal-button bg-[#FF6B6B] px-5 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-black text-black min-h-[44px]"
              >
                סיים שאלה מוקדם
              </button>
            </div>
          </>
        )}

        {gameState === "results" && (
          <>
            <div className="brutal-card bg-[#95E1D3] p-4 sm:p-6 text-center">
              <h3 className="mb-2 text-xl sm:text-2xl md:text-3xl font-black text-black">
                הזמן נגמר!
              </h3>
              <p className="text-base sm:text-lg md:text-xl font-black text-black break-words px-2">
                תשובה נכונה:{" "}
                {String.fromCharCode(65 + currentQuestion.correct_index)} -{" "}
                {currentQuestion.options[currentQuestion.correct_index]}
              </p>
            </div>
            <Leaderboard entries={leaderboard} isFinal={false} />
            <div className="flex justify-center">
              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={goToNextQuestion}
                  className="brutal-button bg-[#4ECDC4] px-6 sm:px-8 py-3 text-base sm:text-lg font-black text-black min-h-[44px]"
                >
                  המשך לשאלה הבאה
                </button>
              ) : (
                <button
                  onClick={endGame}
                  className="brutal-button bg-[#FF6B9D] px-6 sm:px-8 py-3 text-base sm:text-lg font-black text-black min-h-[44px]"
                >
                  סיים משחק
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
