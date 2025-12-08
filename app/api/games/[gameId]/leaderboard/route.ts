import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export async function GET(request: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    const { gameId } = await params

    if (!gameId) {
      return NextResponse.json({ error: 'gameId is required' }, { status: 400 })
    }

    const playersSnapshot = await adminDb
      .collection('games')
      .doc(gameId)
      .collection('players')
      .orderBy('score', 'desc')
      .get()

    const entries = playersSnapshot.docs.map((doc, index) => ({
      player_id: doc.id,
      nickname: doc.data().nickname,
      score: doc.data().score || 0,
      rank: index + 1,
    }))

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Error in GET /api/games/[gameId]/leaderboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

