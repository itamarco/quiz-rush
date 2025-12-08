import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { verifyAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      logger.warn("Unauthorized access attempt to GET /api/quizzes", {
        url: request.url,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.debug("Fetching quizzes for user", { uid: auth.uid });

    const snapshot = await adminDb
      .collection("quizzes")
      .where("user_id", "==", auth.uid)
      .orderBy("created_at", "desc")
      .get();

    const quizzes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    logger.info("Successfully fetched quizzes", {
      uid: auth.uid,
      count: quizzes.length,
    });

    return NextResponse.json(quizzes);
  } catch (error: any) {
    logger.error("Error in GET /api/quizzes", error, {
      url: request.url,
      errorCode: error?.code,
      errorMessage: error?.message,
    });

    if (
      error?.code === "failed-precondition" ||
      error?.message?.includes("index")
    ) {
      const indexUrlMatch = error?.message?.match(
        /https:\/\/console\.firebase\.google\.com[^\s]+/
      );
      const indexUrl = indexUrlMatch ? indexUrlMatch[0] : null;

      return NextResponse.json(
        {
          error:
            "Firestore index required. Please create a composite index for 'quizzes' collection with fields: user_id (Ascending) and created_at (Descending).",
          indexUrl: indexUrl,
          instructions: indexUrl
            ? "Click the link in the server console to create the index automatically, or create it manually in Firebase Console > Firestore > Indexes."
            : "Go to Firebase Console > Firestore Database > Indexes and create a composite index for 'quizzes' collection with fields: user_id (Ascending) and created_at (Descending).",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      logger.warn("Unauthorized access attempt to POST /api/quizzes", {
        url: request.url,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizData, questionsData } = await request.json();

    if (!quizData || !questionsData) {
      logger.warn("Missing quiz data or questions in POST /api/quizzes", {
        uid: auth.uid,
        hasQuizData: !!quizData,
        hasQuestionsData: !!questionsData,
      });
      return NextResponse.json(
        { error: "Missing quiz data or questions" },
        { status: 400 }
      );
    }

    logger.debug("Creating new quiz", {
      uid: auth.uid,
      title: quizData.title,
      questionsCount: questionsData.length,
    });

    const quizRef = await adminDb.collection("quizzes").add({
      title: quizData.title,
      description: quizData.description,
      time_limit: quizData.time_limit,
      user_id: auth.uid,
      created_at: FieldValue.serverTimestamp(),
    });

    const addPromises = questionsData.map((q: any) =>
      adminDb
        .collection("quizzes")
        .doc(quizRef.id)
        .collection("questions")
        .add({
          text: q.text,
          options: q.options,
          correct_index: q.correct_index,
          order: q.order,
        })
    );
    await Promise.all(addPromises);

    logger.info("Successfully created quiz", {
      uid: auth.uid,
      quizId: quizRef.id,
      questionsCount: questionsData.length,
    });

    return NextResponse.json({ id: quizRef.id });
  } catch (error) {
    logger.error("Error in POST /api/quizzes", error, {
      url: request.url,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      logger.warn("Unauthorized access attempt to PUT /api/quizzes", {
        url: request.url,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizId, quizData, questionsData } = await request.json();

    if (!quizId || !quizData || !questionsData) {
      logger.warn("Missing required data in PUT /api/quizzes", {
        uid: auth.uid,
        hasQuizId: !!quizId,
        hasQuizData: !!quizData,
        hasQuestionsData: !!questionsData,
      });
      return NextResponse.json(
        { error: "Missing required data" },
        { status: 400 }
      );
    }

    const quizDoc = await adminDb.collection("quizzes").doc(quizId).get();
    if (!quizDoc.exists) {
      logger.warn("Quiz not found in PUT /api/quizzes", {
        uid: auth.uid,
        quizId,
      });
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const quiz = quizDoc.data();
    if (quiz?.user_id !== auth.uid) {
      logger.warn("Forbidden access attempt to update quiz", {
        uid: auth.uid,
        quizId,
        quizOwnerId: quiz?.user_id,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    logger.debug("Updating quiz", {
      uid: auth.uid,
      quizId,
      questionsCount: questionsData.length,
    });

    await adminDb.collection("quizzes").doc(quizId).update({
      title: quizData.title,
      description: quizData.description,
      time_limit: quizData.time_limit,
    });

    const existingQuestionsSnapshot = await adminDb
      .collection("quizzes")
      .doc(quizId)
      .collection("questions")
      .get();

    const deletePromises = existingQuestionsSnapshot.docs.map((doc) =>
      doc.ref.delete()
    );
    await Promise.all(deletePromises);

    const addPromises = questionsData.map((q: any) =>
      adminDb.collection("quizzes").doc(quizId).collection("questions").add({
        text: q.text,
        options: q.options,
        correct_index: q.correct_index,
        order: q.order,
      })
    );
    await Promise.all(addPromises);

    logger.info("Successfully updated quiz", {
      uid: auth.uid,
      quizId,
      questionsCount: questionsData.length,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in PUT /api/quizzes", error, {
      url: request.url,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      logger.warn("Unauthorized access attempt to DELETE /api/quizzes", {
        url: request.url,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("id");

    if (!quizId) {
      logger.warn("Missing quiz_id in DELETE /api/quizzes", {
        uid: auth.uid,
      });
      return NextResponse.json(
        { error: "quiz_id is required" },
        { status: 400 }
      );
    }

    const quizDoc = await adminDb.collection("quizzes").doc(quizId).get();
    if (!quizDoc.exists) {
      logger.warn("Quiz not found in DELETE /api/quizzes", {
        uid: auth.uid,
        quizId,
      });
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const quiz = quizDoc.data();
    if (quiz?.user_id !== auth.uid) {
      logger.warn("Forbidden access attempt to delete quiz", {
        uid: auth.uid,
        quizId,
        quizOwnerId: quiz?.user_id,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    logger.debug("Deleting quiz", {
      uid: auth.uid,
      quizId,
    });

    const questionsSnapshot = await adminDb
      .collection("quizzes")
      .doc(quizId)
      .collection("questions")
      .get();

    const deleteQuestionsPromises = questionsSnapshot.docs.map((doc) =>
      doc.ref.delete()
    );
    await Promise.all(deleteQuestionsPromises);

    await adminDb.collection("quizzes").doc(quizId).delete();

    logger.info("Successfully deleted quiz", {
      uid: auth.uid,
      quizId,
      questionsDeleted: questionsSnapshot.docs.length,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error in DELETE /api/quizzes", error, {
      url: request.url,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
