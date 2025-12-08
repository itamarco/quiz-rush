import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    const { gameId } = await params
    const { nickname } = await request.json()

    if (!nickname || !nickname.trim()) {
      return NextResponse.json({ error: 'Nickname is required' }, { status: 400 })
    }

    const playersRef = adminDb.collection('games').doc(gameId).collection('players')
    const nicknameQuery = await playersRef.where('nickname', '==', nickname.trim()).get()

    if (!nicknameQuery.empty) {
      return NextResponse.json({ error: 'Nickname already taken' }, { status: 400 })
    }

    const playerRef = await playersRef.add({
      nickname: nickname.trim(),
      score: 0,
      joined_at: FieldValue.serverTimestamp(),
    })

    const playerDoc = await playerRef.get()
    const player = { id: playerDoc.id, ...playerDoc.data() }

    return NextResponse.json(player)
  } catch (error) {
    console.error('Error in POST /api/games/[gameId]/players:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

