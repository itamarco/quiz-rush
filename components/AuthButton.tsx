"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger-client";
import AuthModal from "@/components/AuthModal";

export default function AuthButton() {
  const { user, loading, signInWithGoogle, logout } = useAuth();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLogin = async () => {
    try {
      logger.info("Attempting Google sign-in");
      await signInWithGoogle();
      logger.info("Successfully signed in with Google");
    } catch (error: any) {
      logger.error("Error signing in with Google", error, {
        action: "signInWithGoogle",
        errorCode: error?.code,
        errorMessage: error?.message,
      });

      const errorMessage = error?.message || "נכשל בהתחברות. אנא נסה שוב.";
      alert(errorMessage);
    }
  };

  const handleLogout = async () => {
    try {
      logger.info("Attempting logout", {
        userId: user?.uid,
      });
      await logout();
      logger.info("Successfully logged out");
      router.push("/");
    } catch (error) {
      logger.error("Error signing out", error, {
        action: "logout",
        userId: user?.uid,
      });
    }
  };

  if (loading) {
    return (
      <div className="h-10 w-24 animate-pulse brutal-border bg-[#E0E0E0]"></div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold text-black">
          {user.displayName || user.email}
        </span>
        <button
          onClick={handleLogout}
          className="brutal-button bg-[#FF6B6B] px-4 py-2 text-sm text-black"
        >
          התנתק
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowAuthModal(true)}
          className="brutal-button bg-[#FFE66D] px-4 py-2 text-sm text-black"
        >
          התחבר עם אימייל
        </button>
        <button
          onClick={handleLogin}
          className="brutal-button bg-[#4ECDC4] px-4 py-2 text-sm text-black"
        >
          התחבר עם Google
        </button>
      </div>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
