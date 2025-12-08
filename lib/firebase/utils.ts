import { Timestamp } from 'firebase/firestore'

export async function generateUniquePin(adminDb: any): Promise<string> {
  let pin: string
  let attempts = 0
  const maxAttempts = 10

  do {
    pin = Math.floor(100000 + Math.random() * 900000).toString()
    
    const gamesRef = adminDb.collection('games')
    const snapshot = await gamesRef.where('pin', '==', pin).get()
    
    if (snapshot.empty) {
      return pin
    }
    
    attempts++
  } while (attempts < maxAttempts)

  throw new Error('Failed to generate unique PIN')
}

export function toFirestoreTimestamp(date: Date | string): Timestamp {
  if (typeof date === 'string') {
    return Timestamp.fromDate(new Date(date))
  }
  return Timestamp.fromDate(date)
}

export function fromFirestoreTimestamp(timestamp: Timestamp | { seconds: number; nanoseconds: number }): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate()
  }
  return new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate()
}

