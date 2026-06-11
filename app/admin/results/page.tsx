"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { resolveMatchAndDistributePoints } from "@/app/lib/firebaseUtils";
import { auth, db } from "@/app/lib/firebase";
import { Match } from "@/app/types";

// 1. Array of allowed Admin Emails
const ADMIN_EMAILS = [
  "ignacio.smirlian@globant.com",
  "ignaciosmirlian@gmail.com",
];

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [score1, setScore1] = useState<number | "">("");
  const [score2, setScore2] = useState<number | "">("");

  // 2. Auth State Observer Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 3. Real-time fetch of unresolved matches for our dropdown
  useEffect(() => {
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) return;

    const unsubscribe = onSnapshot(collection(db, "matches"), (snapshot) => {
      const matchData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Match,
      );

      console.log(matchData);
      // Filter out matches that ALREADY have an official settled result
      setMatches(matchData.filter((m) => !m.hasResult));
    });

    return () => unsubscribe();
  }, [user]);

  // 4. Handle Submit Actions
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMatchId) return alert("Please select a match.");
    if (score1 === "" || score2 === "")
      return alert("Please type scores for both squads.");

    const confirmSubmit = window.confirm(
      "Are you sure you want to lock this result? This will recalculate the entire leaderboard points pool instantly!",
    );
    if (!confirmSubmit) return;

    try {
      setSubmitting(true);
      await resolveMatchAndDistributePoints(
        selectedMatchId,
        Number(score1),
        Number(score2),
      );

      alert(
        "🏆 Success! Match resolved, scores logged, and user pool updated.",
      );

      // Reset layout forms
      setSelectedMatchId("");
      setScore1("");
      setScore2("");
    } catch (error: any) {
      console.error(error);
      alert(`Error distributing points: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050821] flex items-center justify-center text-white font-sans">
        Verifying administrative credentials...
      </div>
    );
  }

  // 5. Array Security Validation
  if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
    return (
      <div className="min-h-screen bg-[#050821] flex items-center justify-center text-white font-sans p-6">
        <div className="bg-red-950/30 border border-red-500/30 rounded-2xl p-8 text-center max-w-md">
          <span className="text-4xl block mb-4">🔒</span>
          <h1 className="text-xl font-bold text-red-400 mb-2">Access Denied</h1>
          <p className="text-gray-400 text-sm">
            Your account ({user?.email || "Anonymous"}) does not have
            permissions to access this control module.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c1033] to-[#050821] text-white font-sans px-5 py-12">
      <div className="max-w-xl mx-auto">
        {/* Header Elements */}
        <div className="mb-10 text-center">
          <span className="bg-purple-500/10 text-purple-400 text-xs px-3 py-1 rounded-full font-mono uppercase tracking-wider border border-purple-500/20">
            Admin Console
          </span>
          <h1 className="text-3xl font-extrabold mt-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            Resolve Match Fixtures
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Logged in as:{" "}
            <span className="text-[#ffd700] font-semibold">{user.email}</span>
          </p>
        </div>

        {/* Central Configuration Card */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Field A: Match Selection Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Active Fixture
              </label>
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="w-full bg-[#111] border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-[#ffd700] transition-colors"
              >
                <option value="">-- Choose an Open Match --</option>
                {matches.map((match) => (
                  <option key={match.id} value={match.id}>
                    {match.teamOne} vs {match.teamTwo} (
                    {new Date(match.date).toLocaleDateString()})
                  </option>
                ))}
              </select>
              {matches.length === 0 && (
                <p className="text-xs text-[#00ffcc] mt-2">
                  ✓ All current matches in your database are fully settled.
                </p>
              )}
            </div>

            {/* Field B: Numeric Score Forms Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 truncate">
                  {selectedMatchId
                    ? `${matches.find((m) => m.id === selectedMatchId)?.teamOne} Score`
                    : "Home Score"}
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={score1}
                  onChange={(e) =>
                    setScore1(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="w-full bg-[#111] border border-zinc-800 rounded-xl p-3 text-center text-2xl font-bold text-white focus:outline-none focus:border-[#ffd700] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 truncate">
                  {selectedMatchId
                    ? `${matches.find((m) => m.id === selectedMatchId)?.teamTwo} Score`
                    : "Away Score"}
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={score2}
                  onChange={(e) =>
                    setScore2(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="w-full bg-[#111] border border-zinc-800 rounded-xl p-3 text-center text-2xl font-bold text-white focus:outline-none focus:border-[#ffd700] transition-colors"
                />
              </div>
            </div>

            {/* Action Action Trigger Button */}
            <button
              type="submit"
              disabled={submitting || !selectedMatchId}
              className={`w-full h-12 rounded-xl font-bold transition-all flex items-center justify-center ${
                submitting || !selectedMatchId
                  ? "bg-zinc-700 text-zinc-400 cursor-not-allowed opacity-50"
                  : "bg-[#ffd700] hover:bg-[#e6c200] text-[#0c1033] shadow-lg shadow-yellow-500/10 cursor-pointer"
              }`}
            >
              {submitting ? (
                <svg
                  className="animate-spin h-5 w-5 text-[#0c1033]"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                "Lock Score & Distribute Points"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
