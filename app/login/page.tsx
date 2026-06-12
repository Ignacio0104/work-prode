"use client";

import { useState } from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../lib/firebase";
import { UserProfile } from "../types";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  // Tab/View Toggle States
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Form input capture variables
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);

  // Corporate validation filter step
  const isValidGlobantEmail = (emailStr: string): boolean => {
    return emailStr.trim().toLowerCase().endsWith("@globant.com");
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (user && user.email) {
        if (!isValidGlobantEmail(user.email)) {
          alert(
            "🛑 Access restricted. You must log in using a @globant.com account.",
          );
          await auth.signOut();
          return;
        }

        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);

        // Only provision defaults if the database entry doesn't exist yet
        if (!docSnap.exists()) {
          const userData: UserProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "Mickey Guest",
            photoURL: user.photoURL || "",
            createdAt: new Date().toISOString(),
            points: 0,
          };
          await setDoc(userRef, userData);
        }

        router.push("/");
      }
    } catch (error) {
      console.error(error);
      alert("The magic encountered a glitch. Try again!");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    if (!isValidGlobantEmail(email)) {
      alert(
        "🛑 Registration / Sign In is restricted to valid @globant.com corporate emails.",
      );
      return;
    }

    try {
      setLoading(true);

      if (isSignUp) {
        // --- 1. Sign Up Routine ---
        if (!firstName || !lastName) {
          alert("Please fill out your complete name variables.");
          setLoading(false);
          return;
        }

        const credential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        const user = credential.user;

        const userData: UserProfile = {
          uid: user.uid,
          email: user.email!,
          displayName: `${firstName.trim()} ${lastName.trim()}`,
          photoURL: "",
          createdAt: new Date().toISOString(),
          points: 0,
        };

        await setDoc(doc(db, "users", user.uid), userData);
      } else {
        // --- 2. Login Routine ---
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }

      router.push("/");
    } catch (error: any) {
      console.error(error);
      alert(`Authentication failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0c1033] via-[#1a276c] to-[#050821] text-white font-sans relative overflow-hidden py-10">
      {/* Background Pixie Elements */}
      <div className="absolute top-[15%] left-[20%] w-1 h-1 bg-white rounded-full shadow-[0_0_10px_#fff,0_0_20px_#fff] animate-pulse" />
      <div className="absolute top-[75%] right-[15%] w-1.5 h-1.5 bg-[#ffd700] rounded-full shadow-[0_0_12px_#ffd700] animate-pulse [animation-duration:3s]" />

      {/* Main Glassmorphic Card container */}
      <div className="bg-white/[0.07] backdrop-blur-xl border border-white/15 p-8 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.4)] text-center max-w-[420px] w-[90%] z-10 transition-all duration-300">
        {/* Mickey Ears Logo Representation */}
        <div className="flex justify-center items-center mb-4 relative h-[60px]">
          <div className="w-10 h-10 bg-[#ffd700] rounded-full shadow-[0_0_20px_rgba(255,215,0,0.6)] z-10" />
          <div className="w-6 h-6 bg-[#ffd700] rounded-full absolute -top-1 left-[34%] shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
          <div className="w-6 h-6 bg-[#ffd700] rounded-full absolute -top-1 right-[34%] shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
        </div>

        <h1 className="text-3xl font-extrabold mb-1 tracking-wide bg-gradient-to-r from-white to-[#b9c7ff] bg-clip-text text-transparent">
          Work Prode 2026
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          Unleash the magic. Place your world cup bets.
        </p>

        {!isEmailMode ? (
          /* --- GOOGLE PASS SYSTEM INITIAL GATE VIEW --- */
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full py-3.5 px-6 text-base font-semibold rounded-xl bg-white text-[#0c1033] shadow-[0_4px_15px_rgba(255,255,255,0.2)] transition-all duration-200 hover:bg-gray-50 hover:-translate-y-0.5 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg
                className="w-[18px] h-[18px] flex-shrink-0"
                viewBox="0 0 24 24"
              >
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.65-5.17 3.65-8.58z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.11-6.68-4.96H1.32v3.15C3.29 22.18 7.39 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.32 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.61H1.32C.48 8.28 0 10.09 0 12s.48 3.72 1.32 5.39l4-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.39 0 3.29 1.82 1.32 5.61l4 3.15c.94-2.85 3.57-4.96 6.68-4.96z"
                />
              </svg>
              Enter the Magic Kingdom
            </button>

            <button
              onClick={() => setIsEmailMode(true)}
              className="w-full py-2.5 px-4 text-xs font-medium rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer bg-white/5 hover:bg-white/10"
            >
              Alternative: Sign In / Up with Email
            </button>
          </div>
        ) : (
          /* --- MANUAL EMAIL / REGISTRATION FORM VIEW --- */
          <form onSubmit={handleEmailAuth} className="text-left space-y-4">
            <h3 className="text-md font-semibold text-center text-[#b9c7ff] mb-2">
              {isSignUp ? "Create Globant Account" : "Sign In with Email"}
            </h3>

            {isSignUp && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700]"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700]"
                    placeholder="Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Globant Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700]"
                placeholder="username@globant.com"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-[#ffd700] to-[#ffa500] text-[#0c1033] font-bold rounded-xl transition-transform active:scale-95 disabled:opacity-50 mt-2 cursor-pointer flex justify-center items-center"
            >
              {loading
                ? "Processing..."
                : isSignUp
                  ? "Create Workspace Account"
                  : "Access Tournament"}
            </button>

            <div className="flex flex-col gap-2 pt-2 border-t border-white/10 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-[#b9c7ff] hover:underline cursor-pointer"
              >
                {isSignUp
                  ? "Already have an account? Log In"
                  : "Need an account? Sign Up instead"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsEmailMode(false);
                  setIsSignUp(false);
                }}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
              >
                ← Back to Google Access Method
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
