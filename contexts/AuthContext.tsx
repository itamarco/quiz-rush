"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      if (!auth) {
        throw new Error("Firebase auth is not initialized");
      }

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === "auth/popup-closed-by-user") {
        throw new Error("ההתחברות בוטלה על ידי המשתמש");
      } else if (error.code === "auth/popup-blocked") {
        throw new Error("חלון ההתחברות נחסם. אנא אפשר חלונות קופצים בדפדפן.");
      } else if (error.code === "auth/unauthorized-domain") {
        throw new Error("הדומיין לא מורשה. אנא בדוק את הגדרות Firebase.");
      } else if (error.code === "auth/invalid-api-key") {
        throw new Error("מפתח API לא תקין. אנא בדוק את הגדרות Firebase.");
      } else if (error.message) {
        throw error;
      } else {
        throw new Error(
          "שגיאה לא ידועה בהתחברות: " + (error.code || "Unknown error")
        );
      }
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      if (!auth) {
        throw new Error("Firebase auth is not initialized");
      }

      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        throw new Error("משתמש לא נמצא. אנא בדוק את כתובת האימייל.");
      } else if (error.code === "auth/wrong-password") {
        throw new Error("סיסמה שגויה. אנא נסה שוב.");
      } else if (error.code === "auth/invalid-email") {
        throw new Error("כתובת אימייל לא תקינה.");
      } else if (error.code === "auth/user-disabled") {
        throw new Error("חשבון המשתמש הושבת.");
      } else if (error.code === "auth/too-many-requests") {
        throw new Error("יותר מדי ניסיונות כושלים. אנא נסה שוב מאוחר יותר.");
      } else if (error.message) {
        throw error;
      } else {
        throw new Error("שגיאה בהתחברות: " + (error.code || "Unknown error"));
      }
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      if (!auth) {
        throw new Error("Firebase auth is not initialized");
      }

      if (password.length < 6) {
        throw new Error("הסיסמה חייבת להכיל לפחות 6 תווים.");
      }

      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        throw new Error("כתובת האימייל כבר בשימוש. אנא התחבר במקום.");
      } else if (error.code === "auth/invalid-email") {
        throw new Error("כתובת אימייל לא תקינה.");
      } else if (error.code === "auth/weak-password") {
        throw new Error("הסיסמה חלשה מדי. אנא בחר סיסמה חזקה יותר.");
      } else if (error.message) {
        throw error;
      } else {
        throw new Error(
          "שגיאה ביצירת חשבון: " + (error.code || "Unknown error")
        );
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
