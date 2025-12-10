"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger-client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        logger.info("Attempting email sign-up", { email });
        await signUpWithEmail(email, password);
        logger.info("Successfully signed up with email");
        onClose();
        setEmail("");
        setPassword("");
      } else {
        logger.info("Attempting email sign-in", { email });
        await signInWithEmail(email, password);
        logger.info("Successfully signed in with email");
        onClose();
        setEmail("");
        setPassword("");
      }
    } catch (error: any) {
      logger.error("Error in email auth", error, {
        action: isSignUp ? "signUpWithEmail" : "signInWithEmail",
        email,
      });
      setError(error?.message || "נכשל בהתחברות. אנא נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="brutal-card w-full max-w-md bg-[#FFF9E6] p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-2xl sm:text-3xl font-black text-black">
            {isSignUp ? "הרשמה" : "התחברות"}
          </h2>
          <button
            onClick={onClose}
            className="brutal-button bg-[#FF6B6B] px-3 py-1 text-base sm:text-lg font-black text-black min-h-[36px] sm:min-h-[44px] flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {error && (
            <div className="brutal-border bg-[#FF6B6B] p-3 text-xs sm:text-sm font-bold text-black">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-bold text-black"
            >
              אימייל
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="brutal-input w-full bg-white px-3 py-2 text-right text-black min-h-[44px] text-base"
              placeholder="your@email.com"
              dir="ltr"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-bold text-black"
            >
              סיסמה
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isSignUp ? 6 : undefined}
              className="brutal-input w-full bg-white px-3 py-2 text-right text-black min-h-[44px] text-base"
              placeholder={isSignUp ? "לפחות 6 תווים" : ""}
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="brutal-button w-full bg-[#FF6B9D] px-4 py-2 font-black text-black disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] text-base sm:text-lg"
          >
            {loading ? "מעבד..." : isSignUp ? "הירשם" : "התחבר"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="text-xs sm:text-sm font-bold text-black underline min-h-[44px] flex items-center justify-center mx-auto"
          >
            {isSignUp ? "כבר יש לך חשבון? התחבר" : "אין לך חשבון? הירשם"}
          </button>
        </div>
      </div>
    </div>
  );
}
