
import { EventType, UserRole, UserProfile, RankingEntry, TrainingExercise, PadelEvent, JoinRequest } from './types';

// --- GEOGRAPHICAL DATA ---

export const PADEL_COUNTRIES = [
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'OTHER', name: 'Other / International', flag: '🌍' }
];

export const PADEL_REGIONS: Record<string, string[]> = {
  'PT': [
    'Lisboa', 'Porto', 'Setúbal', 'Braga', 'Aveiro', 'Faro (Algarve)', 'Leiria', 
    'Coimbra', 'Santarém', 'Viseu', 'Madeira', 'Açores', 'Viana do Castelo', 'Évora'
  ],
  'ES': [
    'Madrid', 'Cataluña (Barcelona)', 'Andalucía (Málaga/Sevilla)', 'Comunidad Valenciana', 
    'Islas Baleares', 'País Vasco', 'Galicia', 'Castilla y León', 'Canarias', 'Murcia'
  ],
  'AR': [
    'Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán', 'Entre Ríos', 'Salta'
  ],
  'BR': [
    'São Paulo', 'Rio de Janeiro', 'Santa Catarina', 'Rio Grande do Sul', 'Paraná', 'Minas Gerais', 'Bahia'
  ],
  'IT': [
    'Lombardia (Milano)', 'Lazio (Roma)', 'Sicilia', 'Veneto', 'Emilia-Romagna', 'Piemonte'
  ],
  'SE': [
    'Stockholm', 'Västra Götaland (Gothenburg)', 'Skåne (Malmö)', 'Uppsala'
  ],
  'FR': [
    'Île-de-France (Paris)', 'Occitanie', 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine'
  ],
  'US': [
    'Florida (Miami)', 'California', 'Texas', 'New York', 'Other'
  ],
  'OTHER': ['International']
};

// --- EXISTING MOCK DATA ---

export const MOCK_USER: UserProfile = {
  id: 'u1',
  name: 'Alex Rivera',
  username: '@alex_rivera',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  skillLevel: 4.5,
  role: UserRole.ORGANIZER,
  location: 'Miami, FL',
  club: 'Miami Padel Club',
  country: 'US',
  state: 'Florida (Miami)',
  isVerified: true,
  stats: {
    winRate: 68,
    matchesPlayed: 142,
    elo: 1450,
    ytdImprovement: 25
  }
};

export const MOCK_DRILLS: TrainingExercise[] = [
  { id: 'd1', title: 'Volley Precision', duration: 15, category: 'Technique', difficulty: 'Intermediate', thumbnail: 'https://picsum.photos/seed/d1/400/200', description: 'Focus on short backswing and contact in front of the body.' },
  { id: 'd2', title: 'Bandeja Mechanics', duration: 20, category: 'Technique', difficulty: 'Pro', thumbnail: 'https://picsum.photos/seed/d2/400/200', description: 'Mastering the tray shot to keep opponents at the back.' },
  { id: 'd3', title: 'Explosive Footwork', duration: 10, category: 'Fitness', difficulty: 'Beginner', thumbnail: 'https://picsum.photos/seed/d3/400/200', description: 'Lateral movements and split-step drills.' },
  { id: 'd4', title: 'Glass Defense 101', duration: 30, category: 'Tactical', difficulty: 'Intermediate', thumbnail: 'https://picsum.photos/seed/d4/400/200', description: 'Learning how to use the back wall to your advantage.' },
  { id: 'd5', title: 'Shoulder Mobility', duration: 5, category: 'Mobility', difficulty: 'Beginner', thumbnail: 'https://picsum.photos/seed/d5/400/200', description: 'Dynamic stretches to prevent rotator cuff injuries.' },
  { id: 'd6', title: 'Vibora Power', duration: 25, category: 'Technique', difficulty: 'Pro', thumbnail: 'https://picsum.photos/seed/d6/400/200', description: 'Aggressive overhead with heavy side-spin.' },
  { id: 'd7', title: 'Lobs & Positioning', duration: 15, category: 'Tactical', difficulty: 'Intermediate', thumbnail: 'https://picsum.photos/seed/d7/400/200', description: 'When to lob and how to transition to the net.' },
  { id: 'd8', title: 'Agility Ladder', duration: 12, category: 'Fitness', difficulty: 'Intermediate', thumbnail: 'https://picsum.photos/seed/d8/400/200', description: 'High-speed footwork patterns.' },
  { id: 'd9', title: 'Hip Openers', duration: 8, category: 'Mobility', difficulty: 'Beginner', thumbnail: 'https://picsum.photos/seed/d9/400/200', description: 'Essential stretches for deep padel lunges.' }
];

export const MOCK_RANKINGS: RankingEntry[] = [
  { rank: 1, name: 'Arturo Coello', points: 12050, trend: 'up', avatar: 'https://picsum.photos/seed/a1/100/100', country: 'ES' },
  { rank: 2, name: 'Agustin Tapia', points: 11920, trend: 'steady', avatar: 'https://picsum.photos/seed/a2/100/100', country: 'AR' },
  { rank: 3, name: 'Alejandro Galán', points: 10845, trend: 'up', avatar: 'https://picsum.photos/seed/a3/100/100', country: 'ES' },
  { rank: 4, name: 'Juan Lebron', points: 10600, trend: 'down', avatar: 'https://picsum.photos/seed/a4/100/100', country: 'ES' },
  { rank: 5, name: 'Martin Di Nenno', points: 9420, trend: 'steady', avatar: 'https://picsum.photos/seed/a5/100/100', country: 'AR' }
];

export const MOCK_EVENTS: PadelEvent[] = [
  {
    id: 'e1',
    organizerId: 'u1',
    title: 'Friday Night Smash',
    type: EventType.MATCH,
    date: '2024-05-24',
    time: '18:00 - 20:00',
    location: 'Central Padel Club',
    city: 'Miami',
    maxPlayers: 4,
    skillRange: { min: 3.5, max: 5.0 },
    players: [MOCK_USER],
    status: 'OPEN',
    rules: { sets: 3, goldenPoint: true, tieBreak: 'standard', teamFormation: 'fixed' }
  },
  {
    id: 'e2',
    organizerId: 'u2',
    title: 'Beginner Friendly Mix',
    type: EventType.MATCH,
    date: '2024-05-25',
    time: '10:00 - 12:00',
    location: 'Beachside Padel',
    city: 'Miami',
    maxPlayers: 4,
    skillRange: { min: 2.0, max: 3.5 },
    players: [],
    status: 'OPEN',
    rules: { sets: 3, goldenPoint: false, tieBreak: 'standard', teamFormation: 'americano' }
  }
];

export const MOCK_JOIN_REQUESTS: JoinRequest[] = [
  {
    id: 'jr1',
    eventId: 'e1',
    requesterId: 'u3',
    status: 'PENDING',
    message: 'Hey, I play regularly at level 4.0. Can I join?',
    createdAt: new Date().toISOString(),
    requester: {
      id: 'u3',
      name: 'Daniel Cruz',
      username: '@dcruz',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daniel',
      skillLevel: 4.0,
      role: UserRole.PLAYER,
      location: 'Miami, FL',
      stats: { winRate: 55, matchesPlayed: 40, elo: 1200, ytdImprovement: 10 }
    }
  }
];

export const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'discovery', label: 'Explore', icon: 'explore' },
  { id: 'training', label: 'Training', icon: 'fitness_center' },
  { id: 'rankings', label: 'Rankings', icon: 'trophy' },
  { id: 'profile', label: 'Profile', icon: 'person' }
];
