
import { EventType, UserRole, UserProfile, RankingEntry, TrainingExercise, PadelEvent, JoinRequest } from './types';

// --- GEOGRAPHICAL DATA ---

export const PADEL_COUNTRIES = [
  // --- TOP PADEL NATIONS (Priority) ---
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  
  // --- SEPARATOR ---
  { code: 'sep', name: '──────────────', flag: '' },

  // --- REST OF THE WORLD (Alphabetical) ---
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫' },
  { code: 'AL', name: 'Albania', flag: '🇦🇱' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
  { code: 'AD', name: 'Andorra', flag: '🇦🇩' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴' },
  { code: 'AI', name: 'Anguilla', flag: '🇦🇮' },
  { code: 'AG', name: 'Antigua & Barbuda', flag: '🇦🇬' },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲' },
  { code: 'AW', name: 'Aruba', flag: '🇦🇼' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿' },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'BB', name: 'Barbados', flag: '🇧🇧' },
  { code: 'BY', name: 'Belarus', flag: '🇧🇾' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯' },
  { code: 'BM', name: 'Bermuda', flag: '🇧🇲' },
  { code: 'BT', name: 'Bhutan', flag: '🇧🇹' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'BA', name: 'Bosnia & Herzegovina', flag: '🇧🇦' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼' },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮' },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'CV', name: 'Cape Verde', flag: '🇨🇻' },
  { code: 'KY', name: 'Cayman Islands', flag: '🇰🇾' },
  { code: 'CF', name: 'Central African Rep.', flag: '🇨🇫' },
  { code: 'TD', name: 'Chad', flag: '🇹🇩' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'KM', name: 'Comoros', flag: '🇰🇲' },
  { code: 'CG', name: 'Congo', flag: '🇨🇬' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
  { code: 'DM', name: 'Dominica', flag: '🇩🇲' },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲' },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'GD', name: 'Grenada', flag: '🇬🇩' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳' },
  { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: 'GY', name: 'Guyana', flag: '🇬🇾' },
  { code: 'HT', name: 'Haiti', flag: '🇭🇹' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'CI', name: 'Ivory Coast', flag: '🇨🇮' },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧' },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸' },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷' },
  { code: 'LY', name: 'Libya', flag: '🇱🇾' },
  { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'MO', name: 'Macau', flag: '🇲🇴' },
  { code: 'MK', name: 'Macedonia', flag: '🇲🇰' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹' },
  { code: 'MR', name: 'Mauritania', flag: '🇲🇷' },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'MD', name: 'Moldova', flag: '🇲🇩' },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨' },
  { code: 'MN', name: 'Mongolia', flag: '🇲🇳' },
  { code: 'ME', name: 'Montenegro', flag: '🇲🇪' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'KP', name: 'North Korea', flag: '🇰🇵' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸' },
  { code: 'SM', name: 'San Marino', flag: '🇸🇲' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸' },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨' },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩' },
  { code: 'SR', name: 'Suriname', flag: '🇸🇷' },
  { code: 'SZ', name: 'Swaziland', flag: '🇸🇿' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'SY', name: 'Syria', flag: '🇸🇾' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
  { code: 'TO', name: 'Tonga', flag: '🇹🇴' },
  { code: 'TT', name: 'Trinidad & Tobago', flag: '🇹🇹' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' }
];

export const PADEL_REGIONS: Record<string, string[]> = {
  'PT': [
    'Lisboa', 'Porto', 'Setúbal', 'Braga', 'Aveiro', 'Faro (Algarve)', 'Leiria', 
    'Coimbra', 'Santarém', 'Viseu', 'Madeira', 'Açores', 'Viana do Castelo', 'Évora', 
    'Vila Real', 'Castelo Branco', 'Guarda', 'Beja', 'Portalegre', 'Bragança'
  ],
  'ES': [
    'Madrid', 'Cataluña (Barcelona)', 'Andalucía (Málaga/Sevilla)', 'Comunidad Valenciana', 
    'Islas Baleares', 'País Vasco', 'Galicia', 'Castilla y León', 'Canarias', 'Murcia',
    'Aragón', 'Castilla-La Mancha', 'Extremadura', 'Asturias', 'Navarra', 'Cantabria', 'La Rioja'
  ],
  'AR': [
    'Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán', 'Entre Ríos', 'Salta', 'Misiones', 'Chaco', 'Corrientes'
  ],
  'BR': [
    'São Paulo', 'Rio de Janeiro', 'Santa Catarina', 'Rio Grande do Sul', 'Paraná', 'Minas Gerais', 'Bahia', 'Brasília', 'Ceará', 'Pernambuco'
  ],
  'IT': [
    'Lombardia (Milano)', 'Lazio (Roma)', 'Sicilia', 'Veneto', 'Emilia-Romagna', 'Piemonte', 'Campania', 'Toscana', 'Puglia'
  ],
  'SE': [
    'Stockholm', 'Västra Götaland (Gothenburg)', 'Skåne (Malmö)', 'Uppsala', 'Östergötland'
  ],
  'FR': [
    'Île-de-France (Paris)', 'Occitanie', 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine', 'Hauts-de-France'
  ],
  'US': [
    'Florida (Miami)', 'California', 'Texas', 'New York', 'Other'
  ],
  'GB': [
    'London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 'Bristol'
  ],
  'DE': [
    'Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf'
  ]
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
