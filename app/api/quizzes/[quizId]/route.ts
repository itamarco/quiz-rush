import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { Quiz, Question } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      logger.warn("Unauthorized access attempt to GET /api/quizzes/[quizId]", {
        url: request.url,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizId } = await params;

    logger.debug("Fetching quiz", { uid: auth.uid, quizId });

    const quizDoc = await adminDb.collection("quizzes").doc(quizId).get();
    if (!quizDoc.exists) {
      logger.warn("Quiz not found", { uid: auth.uid, quizId });
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const quiz = { id: quizDoc.id, ...quizDoc.data() } as Quiz;

    if (quiz.user_id !== auth.uid) {
      logger.warn("Forbidden access attempt to get quiz", {
        uid: auth.uid,
        quizId,
        quizOwnerId: quiz.user_id,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const questionsSnapshot = await adminDb
      .collection("quizzes")
      .doc(quizId)
      .collection("questions")
      .orderBy("order")
      .get();

    const questions = questionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Question[];

    logger.info("Successfully fetched quiz", {
      uid: auth.uid,
      quizId,
      questionsCount: questions.length,
    });

    return NextResponse.json({ quiz, questions });
  } catch (error) {
    logger.error("Error in GET /api/quizzes/[quizId]", error, {
      url: request.url,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
