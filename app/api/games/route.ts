import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { generateUniquePin } from "@/lib/firebase/utils";
import { FieldValue } from "firebase-admin/firestore";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { quiz_id } = await request.json();

    if (!quiz_id) {
      logger.warn("Missing quiz_id in POST /api/games", {
        url: request.url,
      });
      return NextResponse.json(
        { error: "quiz_id is required" },
        { status: 400 }
      );
    }

    logger.debug("Creating new game", { quiz_id });

    const pin = await generateUniquePin(adminDb);

    const gameData = {
      quiz_id,
      pin,
      status: "waiting",
      current_question: 0,
      created_at: FieldValue.serverTimestamp(),
    };

    const gameRef = await adminDb.collection("games").add(gameData);
    const gameDoc = await gameRef.get();
    const game = { id: gameDoc.id, ...gameDoc.data() };

    logger.info("Successfully created game", {
      gameId: game.id,
      quiz_id,
      pin,
    });

    return NextResponse.json(game);
  } catch (error) {
    logger.error("Error in POST /api/games", error, {
      url: request.url,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pin = searchParams.get("pin");

    if (!pin) {
      logger.warn("Missing pin in GET /api/games", {
        url: request.url,
      });
      return NextResponse.json({ error: "pin is required" }, { status: 400 });
    }

    logger.debug("Looking up game by PIN", { pin });

    const snapshot = await adminDb
      .collection("games")
      .where("pin", "==", pin)
      .get();

    if (snapshot.empty) {
      logger.warn("Game not found by PIN", { pin });
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const gameDoc = snapshot.docs[0];
    const game = { id: gameDoc.id, ...gameDoc.data() };

    const quizDoc = await adminDb.collection("quizzes").doc(game.quiz_id).get();
    const quiz = quizDoc.exists ? { id: quizDoc.id, ...quizDoc.data() } : null;

    if (!quiz) {
      logger.warn("Quiz not found for game", {
        gameId: game.id,
        quizId: game.quiz_id,
      });
    }

    logger.info("Successfully found game by PIN", {
      gameId: game.id,
      pin,
      hasQuiz: !!quiz,
    });

    return NextResponse.json({ ...game, quiz });
  } catch (error) {
    logger.error("Error in GET /api/games", error, {
      url: request.url,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { game_id, ...updates } = await request.json();

    if (!game_id) {
      logger.warn("Missing game_id in PATCH /api/games", {
        url: request.url,
      });
      return NextResponse.json(
        { error: "game_id is required" },
        { status: 400 }
      );
    }

    logger.debug("Updating game", {
      game_id,
      updates: Object.keys(updates),
    });

    const gameRef = adminDb.collection("games").doc(game_id);
    await gameRef.update(updates);

    const gameDoc = await gameRef.get();
    const game = { id: gameDoc.id, ...gameDoc.data() };

    logger.info("Successfully updated game", {
      game_id,
      updates: Object.keys(updates),
    });

    return NextResponse.json(game);
  } catch (error) {
    logger.error("Error in PATCH /api/games", error, {
      url: request.url,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
