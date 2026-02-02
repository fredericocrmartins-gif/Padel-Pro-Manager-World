
export enum UserRole {
  PLAYER = 'PLAYER',
  ORGANIZER = 'ORGANIZER',
  CLUB_ADMIN = 'CLUB_ADMIN'
}

export enum EventType {
  MATCH = 'MATCH',
  MINI_TOURNEY = 'MINI_TOURNEY',
  TOURNAMENT = 'TOURNAMENT',
  LEAGUE = 'LEAGUE'
}

export type RequestStatus = 'PENDING' | 'APPROVED' | 'DECLINED';

export interface JoinRequest {
  id: string;
  eventId: string;
  requesterId: string;
  status: RequestStatus;
  message?: string;
  createdAt: string;
  requester?: UserProfile;
}

export interface UserStats {
  winRate: number;
  matchesPlayed: number;
  elo: number;
  ytdImprovement: number;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatar: string;
  skillLevel: number;
  role: UserRole;
  stats: UserStats;
  location: string;
  club?: string;
  isVerified?: boolean;
}

export interface MatchResult {
  scoreA: number;
  scoreB: number;
  isGoldenPoint: boolean;
  winner: 'teamA' | 'teamB';
}

export interface TournamentPair {
  id: string;
  name: string; 
  players: UserProfile[];
}

export interface TournamentMatch {
  id: string;
  round: number;
  court: number;
  teamA: TournamentPair;
  teamB: TournamentPair;
  result?: MatchResult;
}

export interface TournamentStanding {
  pairId: string;
  pairName: string;
  wins: number;
  pointsFor: number;
  pointsAgainst: number;
  diff: number;
}

export interface PadelEvent {
  id: string;
  organizerId: string;
  title: string;
  type: EventType;
  date: string;
  time: string;
  location: string;
  city: string;
  players: UserProfile[];
  maxPlayers: number;
  skillRange: { min: number; max: number };
  rules: {
    sets: 1 | 3 | 5;
    goldenPoint: boolean;
    tieBreak: 'standard' | 'super';
    teamFormation: 'fixed' | 'americano';
  };
  status: 'OPEN' | 'LIVE' | 'FINISHED';
}

export interface RankingEntry {
  rank: number;
  name: string;
  points: number;
  trend: 'up' | 'down' | 'steady';
  avatar: string;
  country: string;
}

export interface TrainingExercise {
  id: string;
  title: string;
  duration: number;
  category: 'Technique' | 'Fitness' | 'Mobility' | 'Tactical';
  difficulty: 'Beginner' | 'Intermediate' | 'Pro';
  thumbnail: string;
  description?: string;
}

export interface TrainingLog {
  id: string;
  exerciseId: string;
  userId: string;
  duration: number;
  rpe: number; // 1-10 intensity
  notes: string;
  completedAt: string;
}

export interface AIPersonalPlan {
  day: string;
  activity: string;
  drills: string[];
  focus: string;
}
