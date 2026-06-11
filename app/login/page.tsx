"use client";

import { useEffect, useState } from "react";
import { signInWithRedirect, getRedirectResult } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db, googleProvider } from "../lib/firebase";
import { UserProfile } from "../types"; // Adjust layout path to your local types definitions

export default function LoginPage() {
  const router = useRouter();
  const [checkingRedirect, setCheckingRedirect] = useState(true);

  // 1. Listen for the user returning back from the Google Redirect flow
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);

        if (result?.user && result.user.email) {
          const user = result.user;
          const userRef = doc(db, "users", user.uid);

          // Check if user already exists so we don't overwrite their points
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            const newUserData: UserProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || "Mickey Guest",
              photoURL: user.photoURL || "",
              createdAt: new Date().toISOString(),
              points: 0,
            };
            await setDoc(userRef, newUserData);
          }

          // 🔥 FIX: Force a hard reload navigation to the dashboard
          // This bypasses Next.js client-side routing lockups
          window.location.href = "/";
          return;
        }

        // If the user is already authenticated but just navigated here manually, send them away
        if (auth.currentUser) {
          window.location.href = "/";
          return;
        }
      } catch (error) {
        console.error("Redirect Sign-in Error:", error);
        alert(
          "The magic encountered a glitch returning from Google. Try again!",
        );
      } finally {
        // Turn off loading ONLY if we didn't find a user redirect payload
        setCheckingRedirect(false);
      }
    };

    handleRedirectResult();
  }, []);

  // 2. Button click handler simply kicks off the external redirect loop
  const handleGoogleLogin = async () => {
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error("Initiating Redirect Error:", error);
      alert("Could not open Google Login. Try again!");
    }
  };

  if (checkingRedirect) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0c1033] text-white font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffd700] mx-auto mb-4"></div>
          <p className="text-sm text-gray-400">
            Authenticating with the Magic Kingdom...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0c1033] via-[#1a276c] to-[#050821] text-white font-sans relative overflow-hidden">
      {/* Pixie Dust Floating Background Elements */}
      <div className="absolute top-[15%] left-[20%] w-1 h-1 bg-white rounded-full shadow-[0_0_10px_#fff,0_0_20px_#fff] animate-pulse" />
      <div className="absolute top-[75%] right-[15%] w-1.5 h-1.5 bg-[#ffd700] rounded-full shadow-[0_0_12px_#ffd700] animate-pulse [animation-duration:3s]" />
      <div className="absolute bottom-[20%] left-[10%] w-1.25 h-1.25 bg-[#e100ff] rounded-full shadow-[0_0_15px_#e100ff]" />

      {/* Main Glassmorphic Card */}
      <div className="bg-white/[0.07] backdrop-blur-xl border border-white/15 p-10 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.2)] text-center max-w-[400px] w-[90%] z-10">
        {/* Decorative Mickey Ears Logo Representation */}
        <div className="flex justify-center items-center mb-4 relative h-[70px]">
          <div className="w-10 h-10 bg-[#ffd700] rounded-full shadow-[0_0_20px_rgba(255,215,0,0.6)] z-10" />
          <div className="w-6 h-6 bg-[#ffd700] rounded-full absolute -top-1 left-[32%] sm:left-[35%] shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
          <div className="w-6 h-6 bg-[#ffd700] rounded-full absolute -top-1 right-[32%] sm:right-[35%] shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
        </div>

        <h1 className="text-3xl font-extrabold mb-2 tracking-wide bg-gradient-to-r from-white to-[#b9c7ff] bg-clip-text text-transparent">
          Work Prode 2026
        </h1>

        <p className="text-gray-400 text-sm mb-8">
          Unleash the magic. Place your world cup bets.
        </p>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-3.5 px-6 text-base font-semibold rounded-xl bg-white text-[#0c1033] border-none shadow-[0_4px_15px_rgba(255,255,255,0.2)] transition-all duration-200 ease-in-out hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,255,255,0.3)] active:translate-y-0 flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <svg
            className="w-[18px] h-[18px] mr-1 flex-shrink-0"
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
      </div>
    </div>
  );
}
