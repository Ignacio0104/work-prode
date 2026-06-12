"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User, UserProfile } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Bet, Match } from "../types";
import { auth, db } from "../lib/firebase";
import { WORLD_CUP_CITY_TIMEZONES } from "../utils/match";
import { DateTime } from "luxon";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [bets, setBets] = useState<Record<string, Bet>>({});
  const [rankings, setRankings] = useState<UserProfile[]>([]);
  const [inputs, setInputs] = useState<
    Record<string, { t1: string; t2: string }>
  >({});

  // Navigation tab visibility controller (primarily for mobile viewports)
  const [activeTab, setActiveTab] = useState<"matches" | "ranking">("matches");

  // Track which match ID is currently saving a bet to Firestore
  const [submittingMatchId, setSubmittingMatchId] = useState<string | null>(
    null,
  );

  const router = useRouter();

  // Auth Guard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // Real-time Data Sync
  useEffect(() => {
    if (!user) return;

    const unsubMatches = onSnapshot(collection(db, "matches"), (snapshot) => {
      const matchData = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Match, // 👈 The country is now part of this explicit data mapping payload
      );
      setMatches(matchData);
    });

    const qRankings = query(collection(db, "users"), orderBy("points", "desc"));
    const unsubRankings = onSnapshot(qRankings, (snapshot) => {
      const rankData = snapshot.docs.map((doc) => doc.data() as UserProfile);
      setRankings(rankData);
    });

    const unsubBets = onSnapshot(collection(db, "bets"), (snapshot) => {
      const userBets: Record<string, Bet> = {};
      const localInputs: Record<string, { t1: string; t2: string }> = {};

      snapshot.docs.forEach((doc) => {
        const bet = doc.data() as Bet;
        if (bet.userMail === user.email) {
          userBets[bet.matchId] = bet;
          localInputs[bet.matchId] = {
            t1: bet.teamOneScore.toString(),
            t2: bet.teamTwoScore.toString(),
          };
        }
      });
      setBets(userBets);
      setInputs((prev) => ({ ...localInputs, ...prev }));
    });

    return () => {
      unsubMatches();
      unsubRankings();
      unsubBets();
    };
  }, [user]);

  // Handle Bet Submission with Async Loading State
  const handleSaveBet = async (matchId: string) => {
    if (!user?.email) return;

    const targetMatch = matches.find((m) => m.id === matchId);

    if (!targetMatch) {
      alert("Match data could not be found.");
      return;
    }

    // 1. Precise absolute global comparison (UTC Epoch Milliseconds)
    const matchStartTime = (
      DateTime.fromISO(targetMatch.date, {
        setZone: true,
      }).toISO() || ""
    ).slice(0, -5);

    const venueTimeZone =
      WORLD_CUP_CITY_TIMEZONES[targetMatch.city || "America/New_York"];

    const currentTime = (
      DateTime.now().setZone(venueTimeZone).toISO() || ""
    ).slice(0, -10);

    if (currentTime > matchStartTime) {
      // 2. Format the deadline to the user's local device browser timezone
      const userLocalTimeStr = DateTime.now();

      // 3. Fallback: Format the deadline to the match venue's local stadium time
      const venueTimeStr = currentTime;

      alert(
        `🛑 Kickoff has passed! Predictions for this fixture are closed.\n\n` +
          `📅 Kickoff was at: ${userLocalTimeStr} (Your Local Time)` +
          (venueTimeStr ? ` / ${venueTimeStr}` : ""),
      );
      return;
    }

    if (targetMatch.hasResult) {
      alert(
        "🔒 This match has already concluded. Prediction updates are disabled.",
      );
      return;
    }

    const matchInput = inputs[matchId];
    const score1 = parseInt(matchInput?.t1);
    const score2 = parseInt(matchInput?.t2);

    if (isNaN(score1) || isNaN(score2)) {
      alert("Please enter a valid score for both teams.");
      return;
    }

    try {
      setSubmittingMatchId(matchId);

      const betId = `${user.uid}_${matchId}`;
      const betData: Bet = {
        id: betId,
        matchId,
        userMail: user.email,
        teamOneScore: score1,
        teamTwoScore: score2,
        timestamp: new Date().toISOString(),
      };

      await setDoc(doc(db, "bets", betId), betData);
      alert("Prediction successfully locked in! ⚽");
    } catch (error) {
      console.error(error);
      alert("Failed to save bet. Match might already be locked.");
    } finally {
      setSubmittingMatchId(null);
    }
  };

  const handleInputChange = (
    matchId: string,
    team: "t1" | "t2",
    val: string,
  ) => {
    setInputs((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: val,
      },
    }));
  };

  if (loading)
    return (
      <div className="text-white text-center mt-[20%] font-sans">
        Loading Magic Kingdom...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c1033] to-[#050821] text-white font-sans px-5 py-10">
      <header className="flex justify-between items-center mb-6 border-b border-white/10 pb-5 max-w-6xl mx-auto">
        <h1 className="text-xl font-bold">🏆 Work Prode Dashboard</h1>
        {user && (
          <div className="flex items-center gap-[15px]">
            <span className="hidden sm:inline">
              Hi, <strong className="font-bold">{user.displayName}</strong>
            </span>
            <button
              onClick={() => auth.signOut()}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 transition-colors border-none rounded-md text-white cursor-pointer text-sm"
            >
              Logout
            </button>
          </div>
        )}
      </header>

      {/* SEGMENTED NAVIGATION TAB TOGGLE CONTROL */}
      <div className="max-w-6xl mx-auto mb-8 md:hidden">
        <div className="bg-white/[0.05] p-1 rounded-xl border border-white/10 flex">
          <button
            onClick={() => setActiveTab("matches")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg border-none transition-all cursor-pointer ${
              activeTab === "matches"
                ? "bg-[#ffd700] text-[#0c1033] shadow-md"
                : "bg-transparent text-gray-400 hover:text-white"
            }`}
          >
            Matches
          </button>
          <button
            onClick={() => setActiveTab("ranking")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg border-none transition-all cursor-pointer ${
              activeTab === "ranking"
                ? "bg-[#ffd700] text-[#0c1033] shadow-md"
                : "bg-transparent text-gray-400 hover:text-white"
            }`}
          >
            Ranking
          </button>
        </div>
      </div>

      {/* DASHBOARD GRID GRID SYSTEM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
        {/* MATCHES SECTION */}
        <div
          className={`${activeTab === "matches" ? "block" : "hidden"} md:block md:col-span-2`}
        >
          <h2 className="text-[#ffd700] font-semibold text-lg mb-5">
            ⭐ Upcoming Matches
          </h2>
          {matches.length === 0 ? (
            <p className="text-gray-400">
              No matches found in the database. Add some via Firebase Console!
            </p>
          ) : (
            matches.map((match) => {
              const hasBet = !!bets[match.id];
              const isLocked = match.hasResult;
              const isSavingThisMatch = submittingMatchId === match.id;

              return (
                <div
                  key={match.id}
                  className="bg-white/[0.05] border border-white/10 rounded-2xl p-5 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  {/* Match Info */}
                  <div className="flex-1">
                    <div className="text-lg font-bold">
                      {match.teamOne} vs {match.teamTwo}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(match.date).toLocaleDateString()}{" "}
                      {isLocked && "• 🔒 Locked"}
                    </div>
                    {isLocked && match.result && (
                      <div className="text-[#00ffcc] text-sm mt-1.5">
                        Official Result: {match.result.teamOneScore} -{" "}
                        {match.result.teamTwoScore}
                      </div>
                    )}
                  </div>

                  {/* Betting Inputs */}
                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                    <input
                      type="number"
                      placeholder="0"
                      min={0}
                      disabled={isLocked || isSavingThisMatch}
                      value={inputs[match.id]?.t1 || ""}
                      onChange={(e) =>
                        handleInputChange(match.id, "t1", e.target.value)
                      }
                      className="w-[45px] p-2 text-center rounded-md border border-zinc-800 bg-[#111] text-white disabled:opacity-40 no-spinner"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      placeholder="0"
                      min={0}
                      disabled={isLocked || isSavingThisMatch}
                      value={inputs[match.id]?.t2 || ""}
                      onChange={(e) =>
                        handleInputChange(match.id, "t2", e.target.value)
                      }
                      className="w-[45px] p-2 text-center rounded-md border border-zinc-800 bg-[#111] text-white disabled:opacity-40 no-spinner"
                    />

                    <button
                      disabled={isLocked || isSavingThisMatch}
                      onClick={() => handleSaveBet(match.id)}
                      className={`inline-flex items-center justify-center min-w-[84px] h-[38px] px-4 py-2 border-none rounded-lg font-bold transition-all ${
                        isLocked
                          ? "bg-slate-600 text-white cursor-not-allowed"
                          : isSavingThisMatch
                            ? "bg-zinc-700 text-zinc-400 cursor-wait"
                            : hasBet
                              ? "bg-[#00cc66] hover:bg-[#00b355] text-white cursor-pointer"
                              : "bg-[#ffd700] hover:bg-[#e6c200] text-[#0c1033] cursor-pointer"
                      }`}
                    >
                      {isSavingThisMatch ? (
                        <svg
                          className="animate-spin h-5 w-5 text-zinc-400"
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
                      ) : isLocked ? (
                        "Locked"
                      ) : hasBet ? (
                        "Update"
                      ) : (
                        "Bet"
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RANKINGS LEADERBOARD */}
        <div
          className={`${activeTab === "ranking" ? "block" : "hidden"} md:block md:col-span-1`}
        >
          <h2 className="text-[#ffd700] font-semibold text-lg mb-5">
            🏰 Leaderboard
          </h2>
          <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-5 division-y divide-white/10">
            {rankings.map((player, index) => (
              <div
                key={player.uid as string}
                className={`flex justify-between items-center py-3 text-sm ${
                  index !== rankings.length - 1
                    ? "border-b border-white/10"
                    : ""
                } ${player.email === user?.email ? "text-[#ffd700]" : "text-white"}`}
              >
                <div className="flex items-center">
                  <span className="mr-2.5 font-bold">#{index + 1}</span>
                  <span className="truncate max-w-[150px] sm:max-w-none">
                    {player.displayName as string}
                  </span>
                </div>
                <div className="font-bold whitespace-nowrap">
                  {(player.points as number) || 0} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
