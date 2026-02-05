
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
export type Hand = 'RIGHT' | 'LEFT';
export type CourtPosition = 'LEFT' | 'RIGHT' | 'BOTH';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface Club {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  image?: string;
  
  // Location
  country: string;
  city: string;
  address: string;
  googleMapsUrl?: string;

  // Contacts
  phone?: string;
  email?: string;
  website?: string;

  // Facilities
  type: 'INDOOR' | 'OUTDOOR' | 'COVERED' | 'MIXED';
  courtCount: number;
  hasParking: boolean;
  hasShowers: boolean;
  hasBar: boolean;
  hasShop: boolean;

  // Operational
  openingHours?: {
    weekdays: string;
    weekends: string;
  };
}

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
  rankingPoints?: number; // Pontos oficiais para rankings
}

export interface UserProfile {
  id: string;
  email?: string;
  name: string; // Display Name (usually First + Last)
  firstName?: string;
  lastName?: string;
  nickname?: string; // Alcunha
  birthDate?: string;
  gender?: Gender;
  height?: number; // cm
  weight?: number; // kg (optional, but good for calories)
  hand?: Hand;
  courtPosition?: CourtPosition;
  phone?: string;
  racketBrand?: string;
  
  // New Location & Competitive Fields
  country?: string;
  city?: string;
  state?: string; // Distrito/Região
  homeClub?: string;
  division?: string; // ex: M1, M2, F3, Mixed

  username: string;
  avatar: string;
  avatarColor?: string; // Custom color for the default racket avatar
  skillLevel: number;
  role: UserRole;
  stats: UserStats;
  location: string; // General location string (display purpose)
  club?: string; // Legacy field, mapping to homeClub
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
