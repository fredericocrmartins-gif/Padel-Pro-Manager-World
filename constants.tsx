
import { EventType, UserRole, UserProfile, RankingEntry, TrainingExercise, PadelEvent, JoinRequest, Club } from './types';

// --- GEOGRAPHICAL DATA (ISO 3166 STANDARDS) ---

export const PADEL_COUNTRIES = [
  // --- PRIORITY PADEL NATIONS ---
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', dialCode: '+46' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', dialCode: '+32' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', dialCode: '+974' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971' },
  
  // --- SEPARATOR ---
  { code: 'sep', name: '──────────────', flag: '', dialCode: '' },

  // --- ALL COUNTRIES (A-Z) ---
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', dialCode: '+93' },
  { code: 'AL', name: 'Albania', flag: '🇦🇱', dialCode: '+355' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿', dialCode: '+213' },
  { code: 'AD', name: 'Andorra', flag: '🇦🇩', dialCode: '+376' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴', dialCode: '+244' },
  { code: 'AG', name: 'Antigua & Barbuda', flag: '🇦🇬', dialCode: '+1-268' },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲', dialCode: '+374' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', dialCode: '+43' },
  { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿', dialCode: '+994' },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸', dialCode: '+1-242' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭', dialCode: '+973' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', dialCode: '+880' },
  { code: 'BB', name: 'Barbados', flag: '🇧🇧', dialCode: '+1-246' },
  { code: 'BY', name: 'Belarus', flag: '🇧🇾', dialCode: '+375' },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿', dialCode: '+501' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯', dialCode: '+229' },
  { code: 'BT', name: 'Bhutan', flag: '🇧🇹', dialCode: '+975' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴', dialCode: '+591' },
  { code: 'BA', name: 'Bosnia & Herzegovina', flag: '🇧🇦', dialCode: '+387' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼', dialCode: '+267' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', dialCode: '+359' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', dialCode: '+226' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮', dialCode: '+257' },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭', dialCode: '+855' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲', dialCode: '+237' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: 'CV', name: 'Cape Verde', flag: '🇨🇻', dialCode: '+238' },
  { code: 'CF', name: 'Central African Rep.', flag: '🇨🇫', dialCode: '+236' },
  { code: 'TD', name: 'Chad', flag: '🇹🇩', dialCode: '+235' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', dialCode: '+56' },
  { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', dialCode: '+57' },
  { code: 'KM', name: 'Comoros', flag: '🇰🇲', dialCode: '+269' },
  { code: 'CG', name: 'Congo', flag: '🇨🇬', dialCode: '+242' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', dialCode: '+506' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', dialCode: '+385' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺', dialCode: '+53' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾', dialCode: '+357' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', dialCode: '+420' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', dialCode: '+45' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯', dialCode: '+253' },
  { code: 'DM', name: 'Dominica', flag: '🇩🇲', dialCode: '+1-767' },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴', dialCode: '+1-809' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', dialCode: '+593' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻', dialCode: '+503' },
  { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶', dialCode: '+240' },
  { code: 'ER', name: 'Eritrea', flag: '🇪🇷', dialCode: '+291' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪', dialCode: '+372' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', dialCode: '+251' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯', dialCode: '+679' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', dialCode: '+358' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦', dialCode: '+241' },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲', dialCode: '+220' },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪', dialCode: '+995' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', dialCode: '+30' },
  { code: 'GD', name: 'Grenada', flag: '🇬🇩', dialCode: '+1-473' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹', dialCode: '+502' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳', dialCode: '+224' },
  { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼', dialCode: '+245' },
  { code: 'GY', name: 'Guyana', flag: '🇬🇾', dialCode: '+592' },
  { code: 'HT', name: 'Haiti', flag: '🇭🇹', dialCode: '+509' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳', dialCode: '+504' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', dialCode: '+36' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸', dialCode: '+354' },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', dialCode: '+62' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷', dialCode: '+98' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶', dialCode: '+964' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', dialCode: '+353' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', dialCode: '+972' },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲', dialCode: '+1-876' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴', dialCode: '+962' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', dialCode: '+7' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', dialCode: '+965' },
  { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬', dialCode: '+996' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦', dialCode: '+856' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻', dialCode: '+371' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧', dialCode: '+961' },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸', dialCode: '+266' },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷', dialCode: '+231' },
  { code: 'LY', name: 'Libya', flag: '🇱🇾', dialCode: '+218' },
  { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮', dialCode: '+423' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹', dialCode: '+370' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', dialCode: '+352' },
  { code: 'MK', name: 'North Macedonia', flag: '🇲🇰', dialCode: '+389' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬', dialCode: '+261' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼', dialCode: '+265' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', dialCode: '+60' },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻', dialCode: '+960' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', dialCode: '+223' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹', dialCode: '+356' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52' },
  { code: 'MD', name: 'Moldova', flag: '🇲🇩', dialCode: '+373' },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨', dialCode: '+377' },
  { code: 'MN', name: 'Mongolia', flag: '🇲🇳', dialCode: '+976' },
  { code: 'ME', name: 'Montenegro', flag: '🇲🇪', dialCode: '+382' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', dialCode: '+212' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', dialCode: '+258' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲', dialCode: '+95' },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦', dialCode: '+264' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', dialCode: '+977' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', dialCode: '+64' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮', dialCode: '+505' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪', dialCode: '+227' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234' },
  { code: 'KP', name: 'North Korea', flag: '🇰🇵', dialCode: '+850' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', dialCode: '+47' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', dialCode: '+968' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', dialCode: '+92' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦', dialCode: '+507' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾', dialCode: '+595' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', dialCode: '+51' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', dialCode: '+63' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', dialCode: '+48' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', dialCode: '+974' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', dialCode: '+40' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', dialCode: '+7' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', dialCode: '+250' },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸', dialCode: '+685' },
  { code: 'SM', name: 'San Marino', flag: '🇸🇲', dialCode: '+378' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', dialCode: '+221' },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸', dialCode: '+381' },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨', dialCode: '+248' },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱', dialCode: '+232' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰', dialCode: '+421' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮', dialCode: '+386' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴', dialCode: '+252' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', dialCode: '+82' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', dialCode: '+94' },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩', dialCode: '+249' },
  { code: 'SR', name: 'Suriname', flag: '🇸🇷', dialCode: '+597' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', dialCode: '+41' },
  { code: 'SY', name: 'Syria', flag: '🇸🇾', dialCode: '+963' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', dialCode: '+886' },
  { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯', dialCode: '+992' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', dialCode: '+255' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', dialCode: '+66' },
  { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱', dialCode: '+670' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', dialCode: '+228' },
  { code: 'TO', name: 'Tonga', flag: '🇹🇴', dialCode: '+676' },
  { code: 'TT', name: 'Trinidad & Tobago', flag: '🇹🇹', dialCode: '+1-868' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳', dialCode: '+216' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', dialCode: '+90' },
  { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲', dialCode: '+993' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', dialCode: '+256' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', dialCode: '+380' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾', dialCode: '+598' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', dialCode: '+998' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', dialCode: '+58' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', dialCode: '+84' },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪', dialCode: '+967' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲', dialCode: '+260' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', dialCode: '+263' }
];

// Map Country Code (ISO 3166-1) -> List of Region Objects {code: ISO 3166-2, name: Display Name}
export const PADEL_REGIONS: Record<string, { code: string; name: string }[]> = {
  'PT': [
    { code: 'PT-11', name: 'Lisboa' },
    { code: 'PT-13', name: 'Porto' },
    { code: 'PT-15', name: 'Setúbal' },
    { code: 'PT-03', name: 'Braga' },
    { code: 'PT-01', name: 'Aveiro' },
    { code: 'PT-08', name: 'Faro (Algarve)' },
    { code: 'PT-10', name: 'Leiria' },
    { code: 'PT-06', name: 'Coimbra' },
    { code: 'PT-14', name: 'Santarém' },
    { code: 'PT-18', name: 'Viseu' },
    { code: 'PT-30', name: 'Madeira' },
    { code: 'PT-20', name: 'Açores' },
    { code: 'PT-16', name: 'Viana do Castelo' },
    { code: 'PT-07', name: 'Évora' },
    { code: 'PT-17', name: 'Vila Real' },
    { code: 'PT-05', name: 'Castelo Branco' },
    { code: 'PT-09', name: 'Guarda' },
    { code: 'PT-02', name: 'Beja' },
    { code: 'PT-12', name: 'Portalegre' },
    { code: 'PT-04', name: 'Bragança' }
  ],
  'ES': [
    { code: 'ES-MD', name: 'Madrid' },
    { code: 'ES-CT', name: 'Cataluña (Barcelona)' },
    { code: 'ES-AN', name: 'Andalucía (Málaga/Sevilla)' },
    { code: 'ES-VC', name: 'Comunidad Valenciana' },
    { code: 'ES-IB', name: 'Islas Baleares' },
    { code: 'ES-PV', name: 'País Vasco' },
    { code: 'ES-GA', name: 'Galicia' },
    { code: 'ES-CL', name: 'Castilla y León' },
    { code: 'ES-CN', name: 'Canarias' },
    { code: 'ES-MC', name: 'Murcia' },
    { code: 'ES-AR', name: 'Aragón' },
    { code: 'ES-CM', name: 'Castilla-La Mancha' },
    { code: 'ES-EX', name: 'Extremadura' },
    { code: 'ES-AS', name: 'Asturias' },
    { code: 'ES-NC', name: 'Navarra' },
    { code: 'ES-CB', name: 'Cantabria' },
    { code: 'ES-RI', name: 'La Rioja' }
  ],
  'BR': [
    { code: 'BR-SP', name: 'São Paulo' },
    { code: 'BR-RJ', name: 'Rio de Janeiro' },
    { code: 'BR-SC', name: 'Santa Catarina' },
    { code: 'BR-RS', name: 'Rio Grande do Sul' },
    { code: 'BR-PR', name: 'Paraná' },
    { code: 'BR-MG', name: 'Minas Gerais' },
    { code: 'BR-BA', name: 'Bahia' },
    { code: 'BR-DF', name: 'Brasília' },
    { code: 'BR-CE', name: 'Ceará' },
    { code: 'BR-PE', name: 'Pernambuco' }
  ],
  'IT': [
    { code: 'IT-25', name: 'Lombardia (Milano)' },
    { code: 'IT-62', name: 'Lazio (Roma)' },
    { code: 'IT-82', name: 'Sicilia' },
    { code: 'IT-34', name: 'Veneto' },
    { code: 'IT-45', name: 'Emilia-Romagna' },
    { code: 'IT-21', name: 'Piemonte' },
    { code: 'IT-72', name: 'Campania' },
    { code: 'IT-52', name: 'Toscana' },
    { code: 'IT-75', name: 'Puglia' }
  ],
  'SE': [
    { code: 'SE-AB', name: 'Stockholm' },
    { code: 'SE-O',  name: 'Västra Götaland (Gothenburg)' },
    { code: 'SE-M',  name: 'Skåne (Malmö)' },
    { code: 'SE-C',  name: 'Uppsala' }
  ]
};

// Map Region Code (ISO 3166-2) -> List of Standardized Municipalities/Cities
export const PADEL_CITIES: Record<string, string[]> = {
  // PORTUGAL - Lisboa (PT-11)
  'PT-11': [
    'Lisboa', 'Cascais', 'Sintra', 'Oeiras', 'Amadora', 'Loures', 
    'Odivelas', 'Vila Franca de Xira', 'Mafra', 'Torres Vedras', 'Azambuja', 'Alenquer'
  ],
  // PORTUGAL - Porto (PT-13)
  'PT-13': [
    'Porto', 'Vila Nova de Gaia', 'Matosinhos', 'Maia', 'Gondomar', 
    'Valongo', 'Póvoa de Varzim', 'Vila do Conde', 'Santo Tirso', 'Trofa'
  ],
  // PORTUGAL - Setúbal (PT-15)
  'PT-15': [
    'Setúbal', 'Almada', 'Seixal', 'Barreiro', 'Montijo', 
    'Palmela', 'Sesimbra', 'Moita', 'Alcochete', 'Grândola', 'Sines'
  ],
  // PORTUGAL - Faro (PT-08)
  'PT-08': [
    'Faro', 'Loulé', 'Portimão', 'Olhão', 'Silves', 'Albufeira', 
    'Lagos', 'Tavira', 'Vila Real de Santo António', 'Lagoa'
  ],
  
  // SPAIN - Madrid (ES-MD)
  'ES-MD': [
    'Madrid', 'Alcobendas', 'Pozuelo de Alarcón', 'Las Rozas', 'Majadahonda', 
    'Móstoles', 'Fuenlabrada', 'Leganés', 'Getafe', 'Alcorcón', 'Torrejón de Ardoz'
  ],
  // SPAIN - Barcelona (ES-CT)
  'ES-CT': [
    'Barcelona', 'L\'Hospitalet de Llobregat', 'Badalona', 'Terrassa', 'Sabadell', 
    'Mataró', 'Santa Coloma de Gramenet', 'Sant Cugat del Vallès', 'Cornellà de Llobregat'
  ]
};

// --- MOCK CLUBS DATABASE (LEGACY STRING ARRAY) ---
export const PADEL_CLUBS: string[] = [
  'Padel Center Lisboa',
  'Airfut Padel',
  'Clube de Padel',
  'Rackets Pro EUL',
  'Padel Campo Grande',
  'LX Indoor Padel',
  'Quinta da Marinha Racket Club',
  'Padel Factory',
  'Top Padel Industrial',
  'Indoor Padel Center',
  'Vilamoura Tennis & Padel Academy',
  'Padel Club de Portugal',
  'W Padel Country Club',
  'My Padel Center',
  'Star Padel'
];

// --- RICH CLUB DATA FOR CLUBS PAGE ---
export const MOCK_CLUBS_DATA: Club[] = [
  {
    id: 'c1',
    name: 'Padel Center Lisboa',
    country: 'PT',
    city: 'Lisboa',
    address: 'Av. Ceuta Norte, 1300-125 Lisboa',
    image: 'https://picsum.photos/seed/c1/600/400',
    type: 'INDOOR',
    courtCount: 12,
    hasParking: true,
    hasShowers: true,
    hasBar: true,
    hasShop: true,
    phone: '+351 21 364 0000',
    website: 'https://padelcenter.pt',
    email: 'info@padelcenter.pt',
    openingHours: { weekDays: '08:00 - 00:00', weekends: '09:00 - 22:00' }
  } as any, // casting to avoid strict type checks on optional fields during mock
  {
    id: 'c2',
    name: 'Airfut Padel',
    country: 'PT',
    city: 'Loures',
    address: 'Rua do Prior Velho, Loures',
    image: 'https://picsum.photos/seed/c2/600/400',
    type: 'INDOOR',
    courtCount: 8,
    hasParking: true,
    hasShowers: true,
    hasBar: true,
    hasShop: false,
    phone: '+351 91 111 2222',
  } as any,
  {
    id: 'c3',
    name: 'Quinta da Marinha Racket Club',
    country: 'PT',
    city: 'Cascais',
    address: 'Rua das Palmeiras, Cascais',
    image: 'https://picsum.photos/seed/c3/600/400',
    type: 'OUTDOOR',
    courtCount: 10,
    hasParking: true,
    hasShowers: true,
    hasBar: true,
    hasShop: true,
    phone: '+351 21 486 0000',
    website: 'https://qmracketclub.pt'
  } as any,
  {
    id: 'c4',
    name: 'LX Indoor Padel',
    country: 'PT',
    city: 'Lisboa',
    address: 'Rua da Fábrica, Lisboa',
    image: 'https://picsum.photos/seed/c4/600/400',
    type: 'INDOOR',
    courtCount: 6,
    hasParking: false,
    hasShowers: true,
    hasBar: false,
    hasShop: true,
  } as any,
  {
    id: 'c5',
    name: 'Vilamoura Tennis & Padel Academy',
    country: 'PT',
    city: 'Faro',
    address: 'Vilamoura Resort, Algarve',
    image: 'https://picsum.photos/seed/c5/600/400',
    type: 'OUTDOOR',
    courtCount: 14,
    hasParking: true,
    hasShowers: true,
    hasBar: true,
    hasShop: true,
  } as any
];

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
  { id: 'clubs', label: 'Clubs', icon: 'domain' },
  { id: 'training', label: 'Training', icon: 'fitness_center' },
  { id: 'rankings', label: 'Rankings', icon: 'trophy' },
  { id: 'profile', label: 'Profile', icon: 'person' }
];
