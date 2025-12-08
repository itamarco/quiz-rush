import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { calculatePoints } from "@/lib/scoring";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { game_id, player_id, question_index, answer_index, time_taken } =
      await request.json();

    if (
      !game_id ||
      !player_id ||
      question_index === undefined ||
      answer_index === undefined ||
      !time_taken
    ) {
      logger.warn("Missing required fields in POST /api/answers", {
        url: request.url,
        hasGameId: !!game_id,
        hasPlayerId: !!player_id,
        questionIndex: question_index,
        answerIndex: answer_index,
        timeTaken: time_taken,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    logger.debug("Processing answer submission", {
      game_id,
      player_id,
      question_index,
      answer_index,
      time_taken,
    });

    const gameDoc = await adminDb.collection("games").doc(game_id).get();

    if (!gameDoc.exists) {
      logger.warn("Game not found for answer submission", {
        game_id,
        player_id,
      });
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const game = gameDoc.data();
    const quizDoc = await adminDb
      .collection("quizzes")
      .doc(game!.quiz_id)
      .get();

    if (!quizDoc.exists) {
      logger.error("Quiz not found for game", {
        game_id,
        quiz_id: game!.quiz_id,
        player_id,
      });
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const quiz = quizDoc.data();

    const questionsSnapshot = await adminDb
      .collection("quizzes")
      .doc(game!.quiz_id)
      .collection("questions")
      .orderBy("order")
      .get();

    const questions = questionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (questions.length <= question_index) {
      logger.warn("Question index out of bounds", {
        game_id,
        player_id,
        question_index,
        questionsCount: questions.length,
      });
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    const question = questions[question_index];
    const isCorrect = question.correct_index === answer_index;
    const timeLimit = quiz!.time_limit || 15;
    const points = calculatePoints(isCorrect, time_taken, timeLimit);

    const existingAnswerSnapshot = await adminDb
      .collection("games")
      .doc(game_id)
      .collection("answers")
      .where("player_id", "==", player_id)
      .where("question_index", "==", question_index)
      .get();

    if (!existingAnswerSnapshot.empty) {
      logger.warn("Duplicate answer submission attempt", {
        game_id,
        player_id,
        question_index,
      });
      return NextResponse.json(
        { error: "Answer already submitted" },
        { status: 400 }
      );
    }

    const answerData = {
      player_id,
      question_index,
      answer_index,
      time_taken,
      points,
      created_at: FieldValue.serverTimestamp(),
    };

    const answerRef = await adminDb
      .collection("games")
      .doc(game_id)
      .collection("answers")
      .add(answerData);

    const answerDoc = await answerRef.get();
    const answer = { id: answerDoc.id, ...answerDoc.data() };

    const playerRef = adminDb
      .collection("games")
      .doc(game_id)
      .collection("players")
      .doc(player_id);
    const playerDoc = await playerRef.get();

    if (playerDoc.exists) {
      const currentScore = playerDoc.data()!.score || 0;
      await playerRef.update({ score: currentScore + points });
    }

    logger.info("Successfully processed answer", {
      game_id,
      player_id,
      question_index,
      isCorrect,
      points,
      time_taken,
    });

    return NextResponse.json({ ...answer, isCorrect });
  } catch (error) {
    logger.error("Error in POST /api/answers", error, {
      url: request.url,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
