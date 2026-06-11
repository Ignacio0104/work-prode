// 1. User Profile Structure
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  points: number; // Added to easily track and display rankings
}

// 2. Match Structure
export interface Match {
  id: string;
  match_number: number;
  stage?: string;
  group?: string;
  date: string; // Format: YYYY-MM-DD
  time_et?: string; // Format: HH:MM
  time_local?: string; // Format: HH:MM
  teamOne: string;
  teamTwo: string;
  venue?: string;
  city?: string;
  country?: string;
  status?: string;
  source?: string; // URL
  hasResult: boolean; // Tells the UI the match is finished
  result?: {
    teamOneScore: number; // Official final goals for Team 1
    teamTwoScore: number; // Official final goals for Team 2
  };
}

// 3. Bet Structure
export interface Bet {
  id: string; // Document ID (typically `userId_matchId`)
  matchId: string; // References the Match ID
  userMail: string; // ignacio.smirlian@gmail.com
  teamOneScore: number;
  teamTwoScore: number;
  timestamp: string; // Date stamp of submission
}

// 4. Ranking Structure (Optional helper for your leaderboard UI)
export interface LeaderboardEntry {
  displayName: string;
  email: string;
  points: number;
}
