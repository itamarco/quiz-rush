# Quiz Rush

A real-time multiplayer quiz game alternative to Kahoot, built with Next.js 14 and Firebase/Firestore.

## Features

- **Quiz Builder**: Create and edit quizzes with multiple-choice questions
- **Game Hosting**: Host games with a 6-digit PIN for players to join
- **Real-time Gameplay**: Synchronized question display and answer submission using Firestore real-time listeners
- **Live Leaderboard**: See top players after each question
- **Scoring System**: Points based on correctness and speed (1000 max, 500 min for correct answers)
- **Mobile Responsive**: Works on both desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes + Firebase Admin SDK
- **Database**: Firebase Firestore (NoSQL)
- **Real-time**: Firestore real-time listeners (`onSnapshot`)
- **Hosting**: Vercel

## Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up Firebase:

   - Create a new Firebase project at https://console.firebase.google.com
   - Enable Firestore Database (start in test mode for development)
   - Enable Authentication:
     - Go to **Authentication** > **Sign-in method**
     - Enable **Email/Password** provider
     - Enable **Google** provider (optional, requires OAuth consent screen setup)
   - Go to Project Settings > General and copy your Firebase config
   - Go to Project Settings > Service Accounts and generate a new private key for Admin SDK
   - Set up Firestore Security Rules (see below)

4. Create `.env.local` file:

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

   FIREBASE_ADMIN_PROJECT_ID=your-project-id
   FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----\n"
   ```

5. Set up Firestore Security Rules:

   Go to Firebase Console > Firestore Database > Rules and paste:

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow reads for real-time listeners (all writes go through API routes)
       match /quizzes/{quizId} {
         allow read: if true;
         match /questions/{questionId} {
           allow read: if true;
         }
       }
       match /games/{gameId} {
         allow read: if true;
         match /players/{playerId} {
           allow read: if true;
         }
         match /answers/{answerId} {
           allow read: if true;
         }
         match /state/{stateId} {
           allow read: if true;
         }
       }
     }
   }
   ```

   **Important**: All writes (create, update, delete) go through API routes using Admin SDK, so we only need to allow reads in security rules for real-time listeners to work.

6. **Create Firestore Indexes** (Required):

   The app requires a composite index for querying quizzes by user. When you first run the app, Firebase will show an error with a link to create the index automatically. Alternatively, you can create it manually:

   Go to Firebase Console > Firestore Database > Indexes and create:

   - **Collection**: `quizzes`
   - **Fields**:
     - `user_id` (Ascending)
     - `created_at` (Descending)
   - **Query scope**: Collection

   Or click the link in the error message when it appears - Firebase will generate the exact index URL for you.

7. Run the development server:

   ```bash
   npm run dev
   ```

8. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Structure

Firestore collections:

- **quizzes/{quizId}**: Quiz definitions with global time limit (default 15 seconds)
  - **questions/{questionId}**: Subcollection with quiz questions
- **games/{gameId}**: Game sessions with PINs
  - **players/{playerId}**: Subcollection with players and scores
  - **answers/{answerId}**: Subcollection with player answers
  - **state/current**: Game state document for real-time broadcasting

## Usage

1. **Create a Quiz**: Go to "My Quizzes" and click "Create New Quiz"
2. **Host a Game**: Select a quiz and click "Host Game"
3. **Join as Player**: Enter the 6-digit PIN shown on the host screen
4. **Play**: Answer questions in real-time and compete on the leaderboard

## Deployment

Deploy to Vercel:

```bash
vercel
```

Make sure to add your Firebase environment variables in Vercel's project settings.

## Advantages of Firebase/Firestore

- No project pausing after inactivity (unlike Supabase free tier)
- Generous free tier (50K reads/day, 20K writes/day)
- Built-in real-time listeners
- Easy scaling
- Good Vercel integration
