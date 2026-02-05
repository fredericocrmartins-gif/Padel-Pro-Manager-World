
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MOCK_USER, MOCK_JOIN_REQUESTS, MOCK_CLUBS_DATA, PADEL_RACKET_BRANDS } from '../constants';
import { JoinRequest, RequestStatus, TrainingLog, UserProfile, UserRole, Club, Partnership, Brand } from '../types';

// Helper to safely access environment variables
const getEnv = (key: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return import.meta.env[key];
  }
  return undefined;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

const promiseWithTimeout = <T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> => {
    let timeoutId: any;
    const timeoutPromise = new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`Operation timed out: ${label}`));
        }, ms);
    });

    return Promise.race([
        Promise.resolve(promise).then((res) => {
            clearTimeout(timeoutId);
            return res;
        }),
        timeoutPromise
    ]);
};

// --- AUTH FUNCTIONS ---

export const signInWithEmail = async (email: string, password: string, rememberMe: boolean = true) => {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signUpWithEmail = async (email: string, password: string, name: string) => {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        name: name,
      }
    }
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
  localStorage.clear();
};

export const resendConfirmationEmail = async (email: string) => {
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
    });
    if (error) throw error;
};

// --- CRITICAL PROFILE FETCHING LOGIC ---
export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
    // 1. If Mock Mode, return mock user
    if (!supabase) return MOCK_USER; 
    
    // 2. Check Session
    let session = null;
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) return null;
        session = data.session;
    } catch (e) {
        console.error("Session check failed", e);
        return null;
    }

    // 3. Construct Fallback Profile immediately from session data
    // This ensures we ALWAYS have an object to return if the DB fails
    const user = session.user;
    const email = user.email || '';
    const name = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0] || 'Player';
    const ADMIN_EMAILS = ['fredericocrmartins@gmail.com', 'admin@padelpro.com'];
    const isAdmin = ADMIN_EMAILS.includes(email) || email.startsWith('admin');

    const emergencyProfile: UserProfile = {
        id: user.id,
        email: email,
        name: name,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' '),
        nickname: '',
        role: isAdmin ? UserRole.ADMIN : UserRole.PLAYER,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
        avatarColor: '#25f4c0',
        skillLevel: 3.5,
        username: email.split('@')[0],
        location: 'Unknown',
        isVerified: false,
        stats: { winRate: 0, matchesPlayed: 0, elo: 1200, ytdImprovement: 0 },
        privacySettings: { email: 'PRIVATE', phone: 'PARTNERS', stats: 'PUBLIC', matchHistory: 'PUBLIC', activityLog: 'PRIVATE' }
    };

    // 4. Try to get Real Profile from DB
    try {
        const dbProfile = await getUserProfileById(user.id);
        if (dbProfile) {
            return dbProfile;
        }
    } catch (e) {
        console.warn("DB Profile fetch failed, using emergency profile", e);
    }

    // 5. If DB failed or returned null, Trigger Self-Healing and Return Emergency Profile
    console.warn("⚠️ Using Emergency Profile Fallback for user:", email);
    
    // Async self-healing: try to create the profile row for next time
    updateUserProfile(user.id, { name: emergencyProfile.name, email: emergencyProfile.email })
        .then(res => {
             if (res.success) console.log("✅ Profile auto-created/repaired in background.");
        });

    return emergencyProfile;
};

// --- DATA FUNCTIONS ---

export const getUserProfileById = async (userId: string): Promise<UserProfile | null> => {
    if (!supabase) return MOCK_USER;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
            
        if (error || !data) {
             return null;
        }

        // Determine Role
        const ADMIN_EMAILS = ['fredericocrmartins@gmail.com', 'admin@padelpro.com'];
        const email = data.email || '';
        const shouldBeAdmin = ADMIN_EMAILS.includes(email) || email.startsWith('admin');
        const role = shouldBeAdmin ? UserRole.ADMIN : (data.role as UserRole || UserRole.PLAYER);

        return {
            id: data.id,
            email: data.email,
            name: data.name || 'Player',
            firstName: data.first_name,
            lastName: data.last_name,
            nickname: data.nickname,
            birthDate: data.birth_date,
            height: data.height,
            hand: data.hand,
            gender: data.gender,
            courtPosition: data.court_position,
            phone: data.phone,
            racketBrand: data.racket_brand,
            country: data.country,
            city: data.city,
            state: data.state,
            homeClub: data.home_club,
            division: data.division,
            username: data.email?.split('@')[0] || 'user',
            avatar: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`,
            avatarColor: data.avatar_color || '#25f4c0',
            skillLevel: data.skill_level || 3.5,
            role: role,
            location: data.location || '',
            privacySettings: data.privacy_settings || { email: 'PRIVATE', phone: 'PARTNERS', stats: 'PUBLIC', matchHistory: 'PUBLIC', activityLog: 'PRIVATE' },
            isVerified: data.is_verified,
            stats: { 
                winRate: 0, matchesPlayed: 0, elo: 1200, ytdImprovement: 0,
                rankingPoints: data.ranking_points || 0
            }
        };
    } catch (err) {
        return null;
    }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: true }; 

  try {
    const dbUpdates: any = {
      id: userId,
      email: updates.email,
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
      role: updates.role,
      is_verified: updates.isVerified,
      privacy_settings: updates.privacySettings,
      updated_at: new Date().toISOString()
    };
    
    if (updates.avatar) dbUpdates.avatar_url = updates.avatar;

    // Remove undefined
    Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);
    
    const { error } = await supabase.from('profiles').upsert(dbUpdates);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const adminGetAllUsers = async (): Promise<UserProfile[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(100);
    if (error) throw error;
    return data.map((p: any) => ({
      id: p.id,
      email: p.email,
      name: p.name,
      role: p.role as UserRole,
      isVerified: p.is_verified,
      avatar: p.avatar_url,
      username: '',
      skillLevel: p.skill_level,
      stats: { winRate: 0, matchesPlayed: 0, elo: 0, ytdImprovement: 0 },
      location: '',
      avatarColor: p.avatar_color
    }));
  } catch (err) { return []; }
};

export const adminCreateClub = async (clubData: Partial<Club>): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: true };
  try {
    const { error } = await supabase.from('clubs').insert({
      name: clubData.name, country: clubData.country, city: clubData.city,
      address: clubData.address, type: clubData.type, court_count: clubData.courtCount
    });
    if (error) throw error;
    return { success: true };
  } catch (err: any) { return { success: false, error: err.message }; }
};

export const adminDeleteClub = async (clubId: string): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: true };
  try {
    const { error } = await supabase.from('clubs').delete().eq('id', clubId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) { return { success: false, error: err.message }; }
};

export const uploadAvatar = async (userId: string, file: File): Promise<{ url: string | null; error: string | null }> => {
  if (!supabase) return { url: URL.createObjectURL(file), error: null };
  try {
    const fileName = `${userId}/avatar.jpg`;
    const { error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    return { url: `${data.publicUrl}?t=${Date.now()}`, error: null };
  } catch (error: any) { return { url: null, error: error.message }; }
};

export const deleteAvatar = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: true };
  try {
    await supabase.storage.from('avatars').remove([`${userId}/avatar.jpg`]);
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', userId);
    return { success: true };
  } catch (error: any) { return { success: false, error: error.message }; }
};

export const uploadBrandLogo = async (brandId: string, file: File): Promise<{ url: string | null; error: string | null }> => {
  if (!supabase) return { url: null, error: "Supabase not configured" };
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${brandId}.${fileExt}`;
    const { error } = await supabase.storage.from('brand-logos').upload(fileName, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('brand-logos').getPublicUrl(fileName);
    if (data.publicUrl) await supabase.from('racket_brands').update({ logo_url: data.publicUrl }).eq('id', brandId);
    return { url: data.publicUrl, error: null };
  } catch (error: any) { return { url: null, error: error.message }; }
};

export const getBrands = async (): Promise<Brand[]> => {
  if (!supabase) return PADEL_RACKET_BRANDS;
  try {
    const { data } = await supabase.from('racket_brands').select('*');
    if (!data || data.length === 0) return PADEL_RACKET_BRANDS;
    return [...data.map((b: any) => ({ id: b.id, name: b.name, logo: b.logo_url })), 
            { id: 'other', name: 'Other / Not Listed', logo: 'https://ui-avatars.com/api/?name=?&background=25f4c0&color=10221e&size=64' }];
  } catch { return PADEL_RACKET_BRANDS; }
};

export const searchUsers = async (query: string, currentUserId: string): Promise<UserProfile[]> => {
  if (!supabase || query.length < 2) return [];
  try {
    const { data } = await supabase.from('profiles').select('*')
      .neq('id', currentUserId)
      .or(`name.ilike.%${query}%,nickname.ilike.%${query}%`)
      .limit(10);
    if (!data) return [];
    return data.map((d: any) => ({
      ...d, avatar: d.avatar_url, avatarColor: d.avatar_color, skillLevel: d.skill_level || 3.5, role: d.role,
      stats: { winRate: 0, matchesPlayed: 0, elo: 1200, ytdImprovement: 0 }
    }));
  } catch { return []; }
};

export const getPartners = async (userId: string): Promise<Partnership[]> => {
  if (!supabase) return [];
  try {
    const { data } = await supabase.from('partnerships')
      .select('*, requester:requester_id(id, name, avatar_url), receiver:receiver_id(id, name, avatar_url)')
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);
    if (!data) return [];
    return data.map((p: any) => {
      const isRequester = p.requester_id === userId;
      const partnerData = isRequester ? p.receiver : p.requester;
      return {
        id: p.id, requesterId: p.requester_id, receiverId: p.receiver_id, status: p.status, createdAt: p.created_at,
        partnerProfile: { id: partnerData.id, name: partnerData.name, avatar: partnerData.avatar_url, skillLevel: 3.5, role: UserRole.PLAYER, username: '', location: '', stats: { winRate:0, matchesPlayed:0, elo:0, ytdImprovement:0 } }
      };
    });
  } catch { return []; }
};

export const getPartnershipStatus = async (userA: string, userB: string): Promise<'NONE' | 'PENDING' | 'ACCEPTED'> => {
    if (!supabase) return 'NONE';
    try {
        const { data } = await supabase.from('partnerships').select('status')
            .or(`and(requester_id.eq.${userA},receiver_id.eq.${userB}),and(requester_id.eq.${userB},receiver_id.eq.${userA})`)
            .maybeSingle();
        return data ? data.status : 'NONE';
    } catch { return 'NONE'; }
};

export const sendPartnershipRequest = async (requesterId: string, receiverId: string): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: true };
  try {
    const { error } = await supabase.from('partnerships').insert({ requester_id: requesterId, receiver_id: receiverId, status: 'PENDING' });
    if (error) throw error;
    return { success: true };
  } catch (err: any) { return { success: false, error: err.message }; }
};

export const updatePartnershipStatus = async (partnershipId: string, status: 'ACCEPTED'): Promise<{ success: boolean }> => {
  if (!supabase) return { success: true };
  try { await supabase.from('partnerships').update({ status }).eq('id', partnershipId); return { success: true }; } catch { return { success: false }; }
};

export const removePartnership = async (partnershipId: string): Promise<{ success: boolean }> => {
  if (!supabase) return { success: true };
  try { await supabase.from('partnerships').delete().eq('id', partnershipId); return { success: true }; } catch { return { success: false }; }
};

export const getClubs = async (): Promise<Club[]> => {
  if (supabase) {
    try {
      const { data } = await supabase.from('clubs').select('*');
      if (data && data.length > 0) return data.map((c: any) => ({
          id: c.id, name: c.name, country: c.country, city: c.city, address: c.address, type: c.type, courtCount: c.court_count,
          hasParking: c.has_parking, hasShowers: c.has_showers, hasBar: c.has_bar, hasShop: c.has_shop, phone: c.phone, email: c.email, website: c.website, image: c.image_url || 'https://picsum.photos/seed/default/600/400'
      }));
    } catch (e) {}
  }
  return MOCK_CLUBS_DATA;
};

// Mock local implementations for logs/requests
let localTrainingLogs: TrainingLog[] = [];
let localJoinRequests: JoinRequest[] = [...MOCK_JOIN_REQUESTS];
export const saveTrainingLog = async (log: Omit<TrainingLog, 'id' | 'completedAt'>): Promise<TrainingLog> => {
  if (supabase) {
    try {
      const { data } = await supabase.from('training_logs').insert([{ user_id: log.userId, exercise_id: log.exerciseId, duration: log.duration, rpe: log.rpe, notes: log.notes }]).select().single();
      if (data) return { ...data, userId: data.user_id, exerciseId: data.exercise_id, completedAt: data.completed_at };
    } catch (e) {}
  }
  const newLog: TrainingLog = { id: Math.random().toString(36).substr(2, 9), completedAt: new Date().toISOString(), ...log };
  localTrainingLogs.push(newLog);
  return newLog;
};
export const getTrainingLogs = async (userId: string): Promise<TrainingLog[]> => {
  if (supabase) {
    try {
      const { data } = await supabase.from('training_logs').select('*').eq('user_id', userId);
      if (data) return data.map((d: any) => ({ id: d.id, userId: d.user_id, exerciseId: d.exercise_id, duration: d.duration, rpe: d.rpe, notes: d.notes, completedAt: d.completed_at }));
    } catch (e) {}
  }
  return localTrainingLogs.filter(l => l.userId === userId);
};
export const createJoinRequest = async (eventId: string, requesterId: string, message: string): Promise<JoinRequest> => {
  if (supabase) {
    try {
      const { data } = await supabase.from('join_requests').insert([{ event_id: eventId, requester_id: requesterId, status: 'PENDING', message: message }]).select().single();
      if (data) return { id: data.id, eventId: data.event_id, requesterId: data.requester_id, status: data.status, message: data.message, createdAt: data.created_at, requester: MOCK_USER };
    } catch (e) {}
  }
  const newReq: JoinRequest = { id: Math.random().toString(36).substr(2, 9), eventId, requesterId, status: 'PENDING', message, createdAt: new Date().toISOString(), requester: MOCK_USER };
  localJoinRequests.push(newReq);
  return newReq;
};
export const updateRequestStatus = async (requestId: string, status: RequestStatus): Promise<boolean> => {
  if (supabase) { try { await supabase.from('join_requests').update({ status }).eq('id', requestId); return true; } catch(e) {} }
  const req = localJoinRequests.find(r => r.id === requestId); if (req) { req.status = status; return true; } return false;
};
export const getJoinRequestsForEvent = async (eventId: string): Promise<JoinRequest[]> => {
  if (supabase) { try { const { data } = await supabase.from('join_requests').select('*').eq('event_id', eventId); if (data) return data.map((d: any) => ({ id: d.id, eventId: d.event_id, requesterId: d.requester_id, status: d.status, message: d.message, createdAt: d.created_at, requester: MOCK_USER })); } catch(e) {} }
  return localJoinRequests.filter(r => r.eventId === eventId);
};
