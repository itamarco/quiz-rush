import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (typeof window !== "undefined") {
  if (!getApps().length) {
    if (
      !firebaseConfig.apiKey ||
      !firebaseConfig.authDomain ||
      !firebaseConfig.projectId
    ) {
      console.error("Firebase configuration is missing required fields:", {
        hasApiKey: !!firebaseConfig.apiKey,
        hasAuthDomain: !!firebaseConfig.authDomain,
        hasProjectId: !!firebaseConfig.projectId,
      });
      throw new Error(
        "Firebase configuration is incomplete. Please check your environment variables."
      );
    }
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  db = getFirestore(app);
  auth = getAuth(app);
}

export { db, auth };
