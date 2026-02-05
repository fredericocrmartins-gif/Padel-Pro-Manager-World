
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MOCK_USER, MOCK_JOIN_REQUESTS, MOCK_CLUBS_DATA } from '../constants';
import { JoinRequest, RequestStatus, TrainingLog, UserProfile, UserRole, Club, Partnership, PrivacySettings } from '../types';

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

const isConfigured = supabaseUrl && supabaseUrl.startsWith('http') && 
                     supabaseKey && supabaseKey.length > 20 &&
                     !supabaseUrl.includes('sua_url');

export const isSupabaseConfigured = !!isConfigured;

export const supabase: SupabaseClient | null = isConfigured 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'padelpro-auth-token'
      }
    }) 
  : null;

if (!isConfigured) {
  console.warn("⚠️ PadelPro: Supabase keys missing or invalid. App running in DEMO MODE with mock data.");
}

// --- HELPER FOR TIMEOUTS ---
const promiseWithTimeout = <T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> => {
    const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout: ${label}`)), ms);
    });
    return Promise.race([promise, timeout]);
};

// --- AUTH FUNCTIONS ---

export const signInWithEmail = async (email: string, password: string, rememberMe: boolean = true) => {
  if (!supabase) throw new Error("Supabase not configured (Demo Mode)");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signUpWithEmail = async (email: string, password: string, name: string) => {
  if (!supabase) throw new Error("Supabase not configured (Demo Mode)");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: name },
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
  if (!supabase) return MOCK_USER; 

  try {
    // 1. Get Session with Timeout
    // LocalStorage check usually fast, but wrap it anyway just in case storage is blocked
    const { data: sessionData } = await promiseWithTimeout(
        supabase.auth.getSession(), 
        2000, 
        'getSession'
    ).catch(() => ({ data: { session: null } }));
    
    let user = sessionData?.session?.user;

    // 2. If no session, try getUser with Timeout (Server Verification)
    if (!user) {
       const { data: authData } = await promiseWithTimeout(
           supabase.auth.getUser(),
           3000,
           'getUser'
       ).catch(() => ({ data: { user: null } }));
       
       user = authData?.user;
    }

    if (!user) return null;

    // 3. Get Profile with Timeout
    let profileData: any = null;
    try {
        const { data } = await promiseWithTimeout(
            supabase.from('profiles').select('*').eq('id', user.id).single(),
            3000,
            'getProfile'
        );
        profileData = data;
    } catch(err) {
        console.warn("Could not fetch full profile (using basic auth info):", err);
    }

    // DEFAULT PRIVACY
    const defaultPrivacy: PrivacySettings = {
      email: 'PRIVATE',
      phone: 'PARTNERS',
      stats: 'PUBLIC',
      matchHistory: 'PUBLIC',
      activityLog: 'PRIVATE'
    };

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
            country: profileData.country,
            city: profileData.city,
            state: profileData.state,
            homeClub: profileData.home_club,
            division: profileData.division,
            username: profileData.email?.split('@')[0] || 'user',
            avatar: profileData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
            avatarColor: profileData.avatar_color || '#25f4c0', // Default Primary Color
            skillLevel: profileData.skill_level || 3.5,
            role: (profileData.role as UserRole) || UserRole.PLAYER,
            location: profileData.location || '',
            privacySettings: profileData.privacy_settings || defaultPrivacy,
            stats: { 
              winRate: 0, 
              matchesPlayed: 0, 
              elo: 1200, 
              ytdImprovement: 0,
              rankingPoints: profileData.ranking_points || 0
            }
        };
    }

    // Fallback: construct profile from Auth Metadata
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || 'Player',
      username: user.email?.split('@')[0] || 'user',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
      skillLevel: 3.5,
      role: UserRole.PLAYER,
      location: '',
      privacySettings: defaultPrivacy,
      stats: { winRate: 0, matchesPlayed: 0, elo: 1200, ytdImprovement: 0 }
    };
  } catch (e) {
    console.warn("Critical Error in getCurrentUserProfile:", e);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: true }; 

  try {
    const dbUpdates: any = {
      id: userId,
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
      country: updates.country,
      city: updates.city,
      state: updates.state,
      home_club: updates.homeClub,
      division: updates.division,
      location: updates.location,
      avatar_color: updates.avatarColor,
      privacy_settings: updates.privacySettings,
      updated_at: new Date().toISOString()
    };
    
    // Only add avatar_url if specifically updated (e.g. upload)
    if (updates.avatar) {
        dbUpdates.avatar_url = updates.avatar;
    }

    Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);
    
    const { error } = await supabase.from('profiles').upsert(dbUpdates);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || "Unknown error" };
  }
};

export const uploadAvatar = async (userId: string, file: File): Promise<{ url: string | null; error: string | null }> => {
  if (!supabase) {
    // Mock upload for demo
    return { url: URL.createObjectURL(file), error: null };
  }

  try {
    // SPACE SAVING: Always use 'avatar.jpg' to overwrite previous image
    const fileName = `${userId}/avatar.jpg`;

    // Upload to 'avatars' bucket with UPSERT (overwrite)
    // CACHE CONTROL = 0 prevents CDN from serving old images after update
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { 
        upsert: true,
        contentType: 'image/jpeg',
        cacheControl: '0' 
      });

    if (uploadError) {
      if (uploadError.message.includes("Bucket not found") || uploadError.message.includes("row-level security")) {
        throw new Error("BUCKET ERROR: Please execute 'storage_setup.sql' in the Supabase SQL Editor to create the 'avatars' bucket and fix permissions.");
      }
      throw uploadError;
    }

    // Get Public URL (Force a timestamp query param to bust cache immediately after upload)
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const publicUrlWithCacheBust = `${data.publicUrl}?t=${Date.now()}`;
    
    return { url: publicUrlWithCacheBust, error: null };
  } catch (error: any) {
    console.error("Upload error:", error);
    return { url: null, error: error.message };
  }
};

export const deleteAvatar = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: true };

  try {
    const fileName = `${userId}/avatar.jpg`;

    // 1. Remove from Storage
    const { error: storageError } = await supabase.storage
      .from('avatars')
      .remove([fileName]);

    if (storageError) {
      // Ignore "not found" errors, just proceed to update profile
      console.warn("Storage remove warning:", storageError.message);
    }

    // 2. Update Profile to remove URL (set to null)
    const { error: dbError } = await supabase
      .from('profiles')
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (dbError) throw dbError;

    return { success: true };
  } catch (error: any) {
    console.error("Delete avatar error:", error);
    return { success: false, error: error.message };
  }
};

// --- PARTNERSHIP FUNCTIONS ---

export const searchUsers = async (query: string, currentUserId: string): Promise<UserProfile[]> => {
  if (!supabase) return [];
  if (!query || query.length < 2) return [];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUserId)
      .or(`name.ilike.%${query}%,nickname.ilike.%${query}%`)
      .limit(10);
      
    if (error) throw error;
    
    return data.map((d: any) => ({
      ...d,
      avatar: d.avatar_url,
      avatarColor: d.avatar_color,
      skillLevel: d.skill_level || 3.5,
      role: d.role,
      stats: { winRate: 0, matchesPlayed: 0, elo: 1200, ytdImprovement: 0 }
    }));
  } catch (err) {
    console.error("Search users error:", err);
    return [];
  }
};

export const getPartners = async (userId: string): Promise<Partnership[]> => {
  if (!supabase) return [];

  try {
    // Fetch partnerships where user is requester OR receiver
    const { data, error } = await supabase
      .from('partnerships')
      .select(`
        *,
        requester:requester_id(id, name, avatar_url, nickname, skill_level, avatar_color),
        receiver:receiver_id(id, name, avatar_url, nickname, skill_level, avatar_color)
      `)
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error) throw error;

    return data.map((p: any) => {
      // Determine which profile is the "other" person
      const isRequester = p.requester_id === userId;
      const partnerData = isRequester ? p.receiver : p.requester;
      
      const partnerProfile: UserProfile = {
        id: partnerData.id,
        name: partnerData.name,
        nickname: partnerData.nickname,
        avatar: partnerData.avatar_url,
        avatarColor: partnerData.avatar_color,
        skillLevel: partnerData.skill_level,
        role: UserRole.PLAYER,
        username: '',
        location: '',
        stats: { winRate: 0, matchesPlayed: 0, elo: 0, ytdImprovement: 0 }
      };

      return {
        id: p.id,
        requesterId: p.requester_id,
        receiverId: p.receiver_id,
        status: p.status,
        createdAt: p.created_at,
        partnerProfile: partnerProfile
      };
    });
  } catch (err) {
    console.error("Get partners error:", err);
    return [];
  }
};

export const sendPartnershipRequest = async (requesterId: string, receiverId: string): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: true };
  
  try {
    const { error } = await supabase.from('partnerships').insert({
      requester_id: requesterId,
      receiver_id: receiverId,
      status: 'PENDING'
    });
    
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const updatePartnershipStatus = async (partnershipId: string, status: 'ACCEPTED'): Promise<{ success: boolean }> => {
  if (!supabase) return { success: true };

  try {
    const { error } = await supabase.from('partnerships').update({ status }).eq('id', partnershipId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};

export const removePartnership = async (partnershipId: string): Promise<{ success: boolean }> => {
  if (!supabase) return { success: true };

  try {
    const { error } = await supabase.from('partnerships').delete().eq('id', partnershipId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};


// --- CLUB FUNCTIONS ---
export const getClubs = async (): Promise<Club[]> => {
  if (supabase) {
    try {
      const { data } = await promiseWithTimeout(
          supabase.from('clubs').select('*'),
          3000,
          'getClubs'
      ).catch(() => ({ data: null }));
      
      if (data && data.length > 0) {
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
    } catch (e) {}
  }
  return MOCK_CLUBS_DATA;
};

// --- EXISTING DATA FUNCTIONS ---
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
    } catch (e) {}
  }
  const newLog: TrainingLog = { id: Math.random().toString(36).substr(2, 9), completedAt: new Date().toISOString(), ...log };
  localTrainingLogs.push(newLog);
  return newLog;
};

export const getTrainingLogs = async (userId: string): Promise<TrainingLog[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('training_logs').select('*').eq('user_id', userId);
      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id, userId: d.user_id, exerciseId: d.exercise_id, duration: d.duration, rpe: d.rpe, notes: d.notes, completedAt: d.completed_at
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
        event_id: eventId, requester_id: requesterId, status: 'PENDING', message: message
      }]).select().single();
      if (!error && data) return {
        id: data.id, eventId: data.event_id, requesterId: data.requester_id, status: data.status, message: data.message, createdAt: data.created_at, requester: MOCK_USER
      };
    } catch (e) {}
  }
  const newReq: JoinRequest = { id: Math.random().toString(36).substr(2, 9), eventId, requesterId, status: 'PENDING', message, createdAt: new Date().toISOString(), requester: MOCK_USER };
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
