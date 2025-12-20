"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase/client";
import { doc, collection, query, onSnapshot } from "firebase/firestore";
import AnswerButtons from "@/components/AnswerButtons";
import Timer from "@/components/Timer";
import Leaderboard from "@/components/Leaderboard";
import { Game, Question, LeaderboardEntry } from "@/types";
import { logger } from "@/lib/logger-client";
import { useSound } from "@/contexts/SoundContext";

type PlayerState = "nickname" | "lobby" | "question" | "results" | "finished";

export default function PlayerGamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const { playSound } = useSound();

  const [playerState, setPlayerState] = useState<PlayerState>("nickname");
  const [nickname, setNickname] = useState("");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLimit, setTimeLimit] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);
  const [correctIndex, setCorrectIndex] = useState<number | undefined>(
    undefined
  );
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(
    null
  );
  const lastStateEventRef = useRef<string | null>(null);

  useEffect(() => {
    const loadGame = async () => {
      try {
        logger.debug("Loading game for player", { gameId });
        const response = await fetch(`/api/games/${gameId}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          logger.error(
            "Failed to load game for player",
            new Error(errorData.error || "Unknown error"),
            {
              gameId,
              status: response.status,
              action: "loadGame",
            }
          );
          throw new Error("נכשל בטעינת המשחק");
        }
        const data = await response.json();
        logger.info("Successfully loaded game for player", {
          gameId,
          quizId: data.game?.quiz_id,
        });
        setGame(data.game as Game);
        if (data.quiz) {
          setTimeLimit(data.quiz.time_limit || 15);
        }
      } catch (error) {
        logger.error("Error loading game for player", error, {
          gameId,
          action: "loadGame",
        });
      }
    };

    loadGame();
  }, [gameId]);

  useEffect(() => {
    if (!game || playerState === "nickname") return;

    const stateRef = doc(db, "games", gameId, "state", "current");

    const unsubscribe = onSnapshot(stateRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const state = snapshot.data();
      const eventKey =
        state.event === "question_start" || state.event === "question_end"
          ? `${state.event}-${state.questionIndex}`
          : state.event;
      const isNewEvent = lastStateEventRef.current !== eventKey;

      if (state.event === "question_start") {
        const { questionIndex: idx, question, timeLimit: limit } = state;
        setCurrentQuestion(question);
        setQuestionIndex(idx);
        setTimeLimit(limit);
        setSelectedAnswer(null);
        setAnswerSubmitted(false);
        setShowCorrect(false);
        setCorrectIndex(undefined);
        setTimerRunning(true);
        setQuestionStartTime(Date.now());
        setPlayerState("question");
        if (isNewEvent) {
          playSound("questionStart");
        }
      } else if (state.event === "question_end") {
        const { correctAnswer } = state;
        setCorrectIndex(correctAnswer);
        setShowCorrect(true);
        setTimerRunning(false);
        setPlayerState("results");
        updateLeaderboard();
        if (isNewEvent) {
          playSound("questionEnd");
        }
      } else if (state.event === "game_end") {
        setPlayerState("finished");
        updateLeaderboard();
        if (isNewEvent) {
          playSound("questionEnd");
        }
      }

      lastStateEventRef.current = eventKey;
    });

    return () => unsubscribe();
  }, [game, playerState, gameId]);

  const updateLeaderboard = async () => {
    if (!gameId) return;

    try {
      logger.debug("Updating leaderboard", { gameId });
      const response = await fetch(`/api/games/${gameId}/leaderboard`);
      if (response.ok) {
        const entries = (await response.json()) as LeaderboardEntry[];
        logger.debug("Successfully updated leaderboard", {
          gameId,
          entriesCount: entries.length,
        });
        setLeaderboard(entries);
      } else {
        logger.warn("Failed to update leaderboard", {
          gameId,
          status: response.status,
        });
      }
    } catch (error) {
      logger.error("Error updating leaderboard", error, {
        gameId,
        action: "updateLeaderboard",
      });
    }
  };

  const handleNicknameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      alert("אנא הזן כינוי");
      return;
    }

    if (!gameId) return;

    try {
      const response = await fetch(`/api/games/${gameId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.error === "Nickname already taken") {
          alert("הכינוי כבר תפוס. אנא בחר אחר.");
        } else {
          throw new Error("נכשל בהצטרפות למשחק");
        }
        return;
      }

      const player = await response.json();
      logger.info("Successfully joined game", {
        gameId,
        playerId: player.id,
        nickname: nickname.trim(),
      });
      setPlayerId(player.id);
      setPlayerState("lobby");
      updateLeaderboard();
    } catch (error) {
      logger.error("Error joining game", error, {
        gameId,
        nickname: nickname.trim(),
        action: "handleNicknameSubmit",
      });
      alert("נכשל בהצטרפות למשחק");
    }
  };

  const handleAnswer = async (index: number) => {
    if (
      answerSubmitted ||
      !currentQuestion ||
      !playerId ||
      !gameId ||
      !questionStartTime
    )
      return;

    setSelectedAnswer(index);
    setAnswerSubmitted(true);

    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);

    try {
      const response = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: gameId,
          player_id: playerId,
          question_index: questionIndex,
          answer_index: index,
          time_taken: timeTaken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error(
          "Failed to submit answer",
          new Error(errorData.error || "Unknown error"),
          {
            gameId,
            playerId,
            questionIndex,
            answerIndex: index,
            timeTaken,
            status: response.status,
            action: "handleAnswer",
          }
        );
      } else {
        logger.info("Successfully submitted answer", {
          gameId,
          playerId,
          questionIndex,
          answerIndex: index,
          timeTaken,
        });
      }
    } catch (error) {
      logger.error("Error submitting answer", error, {
        gameId,
        playerId,
        questionIndex,
        answerIndex: index,
        action: "handleAnswer",
      });
    }
  };

  useEffect(() => {
    if (
      playerState !== "results" ||
      !showCorrect ||
      selectedAnswer === null ||
      correctIndex === undefined
    ) {
      return;
    }

    const correct = selectedAnswer === correctIndex;
    playSound(correct ? "correctAnswer" : "incorrectAnswer");
  }, [playerState, showCorrect, selectedAnswer, correctIndex, playSound]);

  if (playerState === "nickname") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF9E6] p-4">
        <div className="brutal-card w-full max-w-md bg-[#FFE66D] p-4 sm:p-6 md:p-8">
          <h1 className="mb-4 sm:mb-6 text-center text-2xl sm:text-3xl md:text-4xl font-black text-black">
            הזן את הכינוי שלך
          </h1>

          <form
            onSubmit={handleNicknameSubmit}
            className="space-y-4 sm:space-y-6"
          >
            <div>
              <label
                htmlFor="nickname"
                className="block text-sm font-bold text-black mb-2"
              >
                כינוי
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="brutal-input w-full bg-white px-4 py-3 text-black min-h-[44px] text-base"
                placeholder="הזן את הכינוי שלך"
                maxLength={20}
                autoFocus
              />
            </div>

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

  if (playerState === "lobby") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF9E6] p-4">
        <div className="brutal-card w-full max-w-md bg-[#95E1D3] p-4 sm:p-6 md:p-8 text-center">
          <h2 className="mb-4 text-xl sm:text-2xl md:text-3xl font-black text-black">
            ממתין שהמשחק יתחיל...
          </h2>
          <p className="text-base sm:text-lg font-bold text-black">
            המארח יתחיל את החידון בקרוב
          </p>
        </div>
      </div>
    );
  }

  if (playerState === "finished") {
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

  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF9E6]">
        <div className="text-2xl font-black text-black">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9E6] py-4 sm:py-6 md:py-8">
      <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6 p-4 sm:p-6">
        {playerState === "question" && (
          <>
            <Timer
              timeLimit={timeLimit}
              onComplete={() => {
                setTimerRunning(false);
                if (!answerSubmitted && selectedAnswer !== null) {
                  handleAnswer(selectedAnswer);
                }
              }}
              running={timerRunning}
              startTime={questionStartTime}
            />

            <div className="brutal-card bg-[#FFF9E6] p-4 sm:p-6">
              <div className="mb-4 text-center">
                <div className="mb-2 text-sm font-bold text-black">
                  שאלה {questionIndex + 1}
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-black px-2">
                  {currentQuestion.text}
                </h2>
              </div>

              <AnswerButtons
                options={currentQuestion.options}
                onAnswer={handleAnswer}
                disabled={answerSubmitted}
                selectedAnswer={selectedAnswer}
              />
            </div>

            {answerSubmitted && (
              <div className="brutal-border bg-[#95E1D3] p-3 sm:p-4 text-center text-base sm:text-lg font-black text-black">
                התשובה נשלחה!
              </div>
            )}
          </>
        )}

        {playerState === "results" && (
          <>
            <Leaderboard
              entries={leaderboard}
              isFinal={false}
              correctAnswerLabel={
                currentQuestion &&
                typeof correctIndex === "number" &&
                correctIndex >= 0 &&
                correctIndex < currentQuestion.options.length
                  ? `תשובה נכונה: ${String.fromCharCode(65 + correctIndex)} - ${
                      currentQuestion.options[correctIndex]
                    }`
                  : undefined
              }
              participantAnswerLabel={
                currentQuestion &&
                selectedAnswer !== null &&
                typeof selectedAnswer === "number" &&
                selectedAnswer !== correctIndex &&
                selectedAnswer >= 0 &&
                selectedAnswer < currentQuestion.options.length
                  ? `התשובה שלך: ${String.fromCharCode(
                      65 + selectedAnswer
                    )} - ${currentQuestion.options[selectedAnswer]}`
                  : undefined
              }
            />
          </>
        )}
      </div>
    </div>
  );
}
