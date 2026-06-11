import {
  collection,
  getDocs,
  doc,
  writeBatch,
  increment,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Match, Bet } from "../types";
import { calculateBetPoints } from "../utils/match";
import { User } from "firebase/auth";

export async function resolveMatchAndDistributePoints(
  matchId: string,
  finalScore1: number,
  finalScore2: number,
) {
  const batch = writeBatch(db);

  // 1. Update the Match document with its official scores
  const matchRef = doc(db, "matches", matchId);
  batch.update(matchRef, {
    hasResult: true,
    result: {
      teamOneScore: finalScore1,
      teamTwoScore: finalScore2,
    },
  });

  const updatedMatchMock: Partial<Match> = {
    id: matchId,
    teamOne: "",
    teamTwo: "",
    date: "",
    status: "",
    hasResult: true,
    result: { teamOneScore: finalScore1, teamTwoScore: finalScore2 },
  };

  // 2. Fetch all user bets submitted for this specific match
  const betsSnapshot = await getDocs(collection(db, "bets"));
  const matchBets = betsSnapshot.docs
    .map((doc) => doc.data() as Bet)
    .filter((bet) => bet.matchId === matchId);

  if (matchBets.length === 0) {
    console.log("No bets found for this match.");
    await batch.commit();
    return;
  }

  // 3. Look up users by email query instead of direct document path ID
  const usersRef = collection(db, "users");

  for (const bet of matchBets) {
    const pointsEarned = calculateBetPoints(bet, updatedMatchMock as Match);

    if (pointsEarned > 0) {
      // Query the users collection where the email field matches the bet email
      const q = query(usersRef, where("email", "==", bet.userMail));
      const userQuerySnapshot = await getDocs(q);

      if (!userQuerySnapshot.empty) {
        // Get the actual document ID (which is their Auth UID)
        const userDocId = userQuerySnapshot.docs[0].id;
        const userDocRef = doc(db, "users", userDocId);

        // Queue the atomic points increment inside our batch update
        batch.update(userDocRef, {
          points: increment(pointsEarned),
        });
      } else {
        console.warn(`⚠️ User document not found for email: ${bet.userMail}`);
      }
    }
  }

  // 4. Commit all updates cleanly at once
  await batch.commit();
  console.log("🏆 Leaderboard successfully recalculated!");
}
