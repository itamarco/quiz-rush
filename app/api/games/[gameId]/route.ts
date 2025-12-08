import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function GET(request: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    const { gameId } = await params

    if (!gameId) {
      return NextResponse.json({ error: 'gameId is required' }, { status: 400 })
    }

    const gameDoc = await adminDb.collection('games').doc(gameId).get()
    if (!gameDoc.exists) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const game = { id: gameDoc.id, ...gameDoc.data() }

    if (!game.quiz_id) {
      return NextResponse.json({ error: 'Game has no quiz_id' }, { status: 400 })
    }

    const quizDoc = await adminDb.collection('quizzes').doc(game.quiz_id).get()
    const quiz = quizDoc.exists ? { id: quizDoc.id, ...quizDoc.data() } : null

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    const questionsSnapshot = await adminDb
      .collection('quizzes')
      .doc(game.quiz_id)
      .collection('questions')
      .orderBy('order')
      .get()

    const questions = questionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ game, quiz, questions })
  } catch (error) {
    console.error('Error in GET /api/games/[gameId]:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    const { gameId } = await params
    const body = await request.json()
    const { updates, stateUpdate } = body

    if (updates) {
      await adminDb.collection('games').doc(gameId).update(updates)
    }

    if (stateUpdate) {
      const stateRef = adminDb.collection('games').doc(gameId).collection('state').doc('current')
      await stateRef.set({
        ...stateUpdate,
        timestamp: FieldValue.serverTimestamp(),
      }, { merge: true })
    }

    const gameDoc = await adminDb.collection('games').doc(gameId).get()
    const game = { id: gameDoc.id, ...gameDoc.data() }

    return NextResponse.json(game)
  } catch (error) {
    console.error('Error in PATCH /api/games/[gameId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
