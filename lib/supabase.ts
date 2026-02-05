
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MOCK_USER, MOCK_JOIN_REQUESTS, MOCK_CLUBS_DATA } from '../constants';
import { JoinRequest, RequestStatus, TrainingLog, UserProfile, UserRole, Club } from '../types';

// ------------------------------------------------------------------
// CONFIGURAÇÃO DE AMBIENTE
// ------------------------------------------------------------------
const getEnvVar = (key: string) => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) return import.meta.env[key];
  } catch { return undefined; }
  return undefined;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

// Verify if keys are present and look vaguely correct (not placeholders)
const isConfigured = supabaseUrl && supabaseUrl.startsWith('http') && 
                     supabaseKey && supabaseKey.length > 20 &&
                     !supabaseUrl.includes('sua_url');

export const isSupabaseConfigured = !!isConfigured;

export const supabase: SupabaseClient | null = isConfigured 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true, // Force session persistence
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined, // Explicitly use localStorage
        storageKey: 'padelpro-auth-token' // Custom key to avoid collisions
      }
    }) 
  : null;

if (!isConfigured) {
  console.warn("⚠️ PadelPro: Supabase keys missing or invalid. App running in DEMO MODE with mock data.");
}

// --- AUTH FUNCTIONS ---

export const signInWithEmail = async (email: string, password: string, rememberMe: boolean = true) => {
  if (!supabase) throw new Error("Supabase not configured (Demo Mode)");
  
  // NOTE: Supabase v2 client uses the storage defined in createClient by default.
  // We have configured it to use LocalStorage above, so 'Keep me signed in' is active by default.
  
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signUpWithEmail = async (email: string, password: string, name: string) => {
  if (!supabase) throw new Error("Supabase not configured (Demo Mode)");
  
  // 1. Sign Up in Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: name }, // Store name in metadata
      emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    }
  });
  if (error) throw error;

  return data;
};

export const resendConfirmationEmail = async (email: string) => {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
    options: {
      emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    }
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('padelpro-auth-token');
  }
};

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  if (!supabase) return MOCK_USER; // Fallback for dev without keys

  try {
    // ROBUST AUTH CHECK STRATEGY:
    // 1. First, check Local Storage (getSession). This is fast and works offline.
    // 2. Only if local session is missing, do we rely strictly on server check.
    // This prevents "logout" when network is slow or getUser() times out.
    
    const { data: sessionData } = await supabase.auth.getSession();
    let user = sessionData?.session?.user;

    // If no local session, try server verification as last resort with timeout
    if (!user) {
       // Wrap getUser in timeout to prevent infinite hanging
       const getUserPromise = supabase.auth.getUser();
       const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Auth check timeout')), 4000));
       
       try {
         const { data: authData } = await Promise.race([getUserPromise, timeoutPromise]) as any;
         user = authData?.user;
       } catch (err) {
         // If timeout or network error, we assume no user or offline
         return null;
       }
    }

    // If still no user, we are truly logged out
    if (!user) return null;

    // --- Profile Fetching ---
    // We have a user, now let's try to get their profile details.
    // We wrap this in a gentle timeout so we don't hang forever, 
    // but if it fails, we fall back to basic Auth Data instead of logging out.
    
    let profileData: any = null;
    try {
        const fetchProfile = supabase.from('profiles').select('*').eq('id', user.id).single();
        
        // 4-second timeout for DB fetch only
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 4000));
        
        const result = await Promise.race([fetchProfile, timeoutPromise]) as any;
        profileData = result.data;
    } catch(err) {
        console.warn("Could not fetch full profile (using basic auth info):", err);
    }

    if (profileData) {
        return {
            id: profileData.id,
            email: user.email,
            name: profileData.name || user.user_metadata?.name || 'Player',
            firstName: profileData.first_name,
            lastName: profileData.last_name,
            nickname: profileData.nickname,
            birthDate: profileData.birth_date,
            height: profileData.height,
            hand: profileData.hand,
            gender: profileData.gender,
            courtPosition: profileData.court_position,
            phone: profileData.phone,
            racketBrand: profileData.racket_brand,
            
            // New Fields Mapping
            country: profileData.country,
            city: profileData.city,
            state: profileData.state,
            homeClub: profileData.home_club,
            division: profileData.division,
            
            username: profileData.email?.split('@')[0] || 'user',
            avatar: profileData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
            skillLevel: profileData.skill_level || 3.5,
            role: (profileData.role as UserRole) || UserRole.PLAYER,
            location: profileData.location || '',
            stats: { 
              winRate: 0, 
              matchesPlayed: 0, 
              elo: 1200, 
              ytdImprovement: 0,
              rankingPoints: profileData.ranking_points || 0
            }
        };
    }

    // Fallback: construct the profile from Auth Metadata if DB fails
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || 'Player',
      username: user.email?.split('@')[0] || 'user',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
      skillLevel: 3.5,
      role: UserRole.PLAYER,
      location: '',
      stats: {
        winRate: 0,
        matchesPlayed: 0,
        elo: 1200,
        ytdImprovement: 0
      }
    };
  } catch (e) {
    console.warn("Critical Error in getCurrentUserProfile:", e);
    // Even on error, if we had a session earlier, we shouldn't return null if possible, 
    // but here we are in a catch-all.
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: true }; // Mock success

  try {
    // Convert CamelCase to snake_case for DB
    const dbUpdates = {
      id: userId, // Required for upsert
      name: updates.name,
      first_name: updates.firstName,
      last_name: updates.lastName,
      nickname: updates.nickname,
      birth_date: updates.birthDate === '' ? null : updates.birthDate,
      height: updates.height,
      hand: updates.hand,
      gender: updates.gender,
      court_position: updates.courtPosition,
      phone: updates.phone,
      racket_brand: updates.racketBrand,
      
      // New Fields
      country: updates.country,
      city: updates.city,
      state: updates.state,
      home_club: updates.homeClub,
      division: updates.division,
      
      location: updates.location, // Save specific location string
      
      updated_at: new Date().toISOString()
    };

    // Remove undefined values
    Object.keys(dbUpdates).forEach(key => (dbUpdates as any)[key] === undefined && delete (dbUpdates as any)[key]);

    // Use upsert instead of update to create the row if it doesn't exist
    const { error } = await supabase.from('profiles').upsert(dbUpdates);
    
    if (error) {
      console.error("Error updating profile:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.error("Exception updating profile:", e);
    return { success: false, error: e.message || "Unknown error" };
  }
};

// --- CLUB FUNCTIONS ---

export const getClubs = async (): Promise<Club[]> => {
  if (supabase) {
    try {
      // Try to fetch from DB
      const { data, error } = await supabase.from('clubs').select('*');
      if (!error && data && data.length > 0) {
        return data.map((c: any) => ({
          id: c.id,
          name: c.name,
          country: c.country,
          city: c.city,
          address: c.address,
          type: c.type,
          courtCount: c.court_count,
          hasParking: c.has_parking,
          hasShowers: c.has_showers,
          hasBar: c.has_bar,
          hasShop: c.has_shop,
          phone: c.phone,
          email: c.email,
          website: c.website,
          image: c.image_url || 'https://picsum.photos/seed/default/600/400'
        }));
      }
    } catch (e) {
      console.warn("Could not fetch clubs from DB, using mock data");
    }
  }
  return MOCK_CLUBS_DATA;
};


// --- EXISTING DATA FUNCTIONS (With Mock Fallback) ---
let localTrainingLogs: TrainingLog[] = [];
let localJoinRequests: JoinRequest[] = [...MOCK_JOIN_REQUESTS];

export const saveTrainingLog = async (log: Omit<TrainingLog, 'id' | 'completedAt'>): Promise<TrainingLog> => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('training_logs').insert([{
        user_id: log.userId,
        exercise_id: log.exerciseId,
        duration: log.duration,
        rpe: log.rpe,
        notes: log.notes
      }]).select().single();
      
      if (!error && data) return { ...data, userId: data.user_id, exerciseId: data.exercise_id, completedAt: data.completed_at };
    } catch (e) { console.warn("Table training_logs might not exist yet"); }
  }
  
  const newLog: TrainingLog = {
    id: Math.random().toString(36).substr(2, 9),
    completedAt: new Date().toISOString(),
    ...log
  };
  localTrainingLogs.push(newLog);
  return newLog;
};

export const getTrainingLogs = async (userId: string): Promise<TrainingLog[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('training_logs').select('*').eq('user_id', userId);
      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          exerciseId: d.exercise_id,
          duration: d.duration,
          rpe: d.rpe,
          notes: d.notes,
          completedAt: d.completed_at
        }));
      }
    } catch (e) {}
  }
  return localTrainingLogs.filter(l => l.userId === userId);
};

export const createJoinRequest = async (eventId: string, requesterId: string, message: string): Promise<JoinRequest> => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('join_requests').insert([{
        event_id: eventId,
        requester_id: requesterId,
        status: 'PENDING',
        message: message
      }]).select().single();
      if (!error && data) return {
        id: data.id, eventId: data.event_id, requesterId: data.requester_id, status: data.status, message: data.message, createdAt: data.created_at, requester: MOCK_USER
      };
    } catch (e) {}
  }
  const newReq: JoinRequest = {
    id: Math.random().toString(36).substr(2, 9),
    eventId, requesterId, status: 'PENDING', message, createdAt: new Date().toISOString(), requester: MOCK_USER
  };
  localJoinRequests.push(newReq);
  return newReq;
};

export const updateRequestStatus = async (requestId: string, status: RequestStatus): Promise<boolean> => {
  if (supabase) {
    try {
        const { error } = await supabase.from('join_requests').update({ status }).eq('id', requestId);
        if (!error) return true;
    } catch(e) {}
  }
  const req = localJoinRequests.find(r => r.id === requestId);
  if (req) { req.status = status; return true; }
  return false;
};

export const getJoinRequestsForEvent = async (eventId: string): Promise<JoinRequest[]> => {
  if (supabase) {
    try {
        const { data } = await supabase.from('join_requests').select('*').eq('event_id', eventId);
        if (data) return data.map((d: any) => ({
          id: d.id, eventId: d.event_id, requesterId: d.requester_id, status: d.status, message: d.message, createdAt: d.created_at, requester: MOCK_USER
        }));
    } catch(e) {}
  }
  return localJoinRequests.filter(r => r.eventId === eventId);
};
