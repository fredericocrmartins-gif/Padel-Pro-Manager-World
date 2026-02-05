
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MOCK_USER, MOCK_JOIN_REQUESTS, MOCK_CLUBS_DATA, PADEL_RACKET_BRANDS } from '../constants';
import { JoinRequest, RequestStatus, TrainingLog, UserProfile, UserRole, Club, Partnership, PrivacySettings, Brand } from '../types';

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
};

export const resendConfirmationEmail = async (email: string) => {
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
    });
    if (error) throw error;
};

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
    if (!supabase) return null;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return null;
        return await getUserProfileById(session.user.id);
    } catch (e) {
        console.error("Error getting current user:", e);
        return null;
    }
};

// --- DATA FUNCTIONS ---

export const getUserProfileById = async (userId: string): Promise<UserProfile | null> => {
    if (!supabase) return MOCK_USER;

    try {
        let profileData: any = null;
        let dbError: any = null;

        // Try to fetch from DB with a tight timeout
        try {
            const result = await promiseWithTimeout(
                supabase.from('profiles').select('*').eq('id', userId).single(),
                2000, // 2s timeout
                'getProfileById'
            ) as any;
            profileData = result.data;
            dbError = result.error;
        } catch (e) {
            console.warn("DB Timeout or Connection Error:", e);
            dbError = e;
        }

        // --- SURVIVAL MODE LOGIC ---
        // If DB failed, we MUST NOT block the user. We construct a profile from the Session.
        if (dbError || !profileData) {
            console.warn("⚠️ Database profile missing/inaccessible. Entering Survival Mode.");
            
            const { data: { session } } = await supabase.auth.getSession();
            
            // Ensure the session matches the requested ID to avoid security issues
            if (session && session.user && session.user.id === userId) {
                const user = session.user;
                const email = user.email || '';
                
                // FORCE ADMIN Check in Survival Mode
                const ADMIN_EMAILS = ['fredericocrmartins@gmail.com', 'admin@padelpro.com'];
                const isAdmin = ADMIN_EMAILS.includes(email) || email.startsWith('admin');

                // Return a Constructed "In-Memory" Profile
                return {
                    id: user.id,
                    email: email,
                    name: user.user_metadata?.name || user.user_metadata?.full_name || email.split('@')[0],
                    firstName: '',
                    lastName: '',
                    nickname: '',
                    role: isAdmin ? UserRole.ADMIN : UserRole.PLAYER, // Force Admin here
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
                    avatarColor: '#25f4c0',
                    skillLevel: 3.5,
                    username: email.split('@')[0],
                    location: 'Online (No DB)',
                    isVerified: false,
                    stats: { winRate: 0, matchesPlayed: 0, elo: 1200, ytdImprovement: 0 },
                    privacySettings: {
                        email: 'PRIVATE', phone: 'PARTNERS', stats: 'PUBLIC', 
                        matchHistory: 'PUBLIC', activityLog: 'PRIVATE'
                    }
                };
            }
            return null;
        }

        // --- NORMAL MODE (DB SUCCESS) ---
        // --- AUTO-PROMOTE ADMIN LOGIC (DB Based) ---
        const ADMIN_EMAILS = ['fredericocrmartins@gmail.com', 'admin@padelpro.com'];
        const email = profileData.email || '';
        const shouldBeAdmin = ADMIN_EMAILS.includes(email) || email.startsWith('admin');

        if (shouldBeAdmin && profileData.role !== 'ADMIN') {
            console.log(`👑 Auto-promoting ${email} to ADMIN...`);
            // Fire and forget update
            supabase.from('profiles').update({ role: 'ADMIN' }).eq('id', userId).then();
            profileData.role = 'ADMIN';
        }
        
        const rawRole = profileData.role ? profileData.role.toUpperCase() : 'PLAYER';
        const role = Object.values(UserRole).includes(rawRole as UserRole) 
            ? (rawRole as UserRole) 
            : UserRole.PLAYER;

        return {
            id: profileData.id,
            email: profileData.email,
            name: profileData.name || 'Player',
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
            avatar: profileData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.id}`,
            avatarColor: profileData.avatar_color || '#25f4c0',
            skillLevel: profileData.skill_level || 3.5,
            role: role,
            location: profileData.location || '',
            privacySettings: profileData.privacy_settings || { email: 'PRIVATE', phone: 'PARTNERS', stats: 'PUBLIC', matchHistory: 'PUBLIC', activityLog: 'PRIVATE' },
            isVerified: profileData.is_verified,
            stats: { 
                winRate: 0, 
                matchesPlayed: 0, 
                elo: 1200, 
                ytdImprovement: 0,
                rankingPoints: profileData.ranking_points || 0
            }
        };
    } catch (err) {
        console.error("Critical Error fetching profile:", err);
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
      role: updates.role,
      is_verified: updates.isVerified,
      privacy_settings: updates.privacySettings,
      updated_at: new Date().toISOString()
    };
    
    if (updates.avatar) {
        dbUpdates.avatar_url = updates.avatar;
    }

    // Remove undefined
    Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);
    
    const { error } = await supabase.from('profiles').upsert(dbUpdates);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || "Unknown error" };
  }
};

export const adminGetAllUsers = async (): Promise<UserProfile[]> => {
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return data.map((profileData: any) => ({
      id: profileData.id,
      email: profileData.email,
      name: profileData.name || 'Player',
      role: (profileData.role as UserRole) || UserRole.PLAYER,
      isVerified: profileData.is_verified,
      avatar: profileData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.id}`,
      username: '',
      skillLevel: profileData.skill_level || 3.5,
      stats: { winRate: 0, matchesPlayed: 0, elo: 0, ytdImprovement: 0 },
      location: '',
      avatarColor: profileData.avatar_color
    }));
  } catch (err) {
    console.error("Admin fetch users error:", err);
    return [];
  }
};

export const adminCreateClub = async (clubData: Partial<Club>): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: true };
  
  try {
    const dbClub = {
      name: clubData.name,
      country: clubData.country,
      city: clubData.city,
      address: clubData.address,
      type: clubData.type,
      court_count: clubData.courtCount,
      has_parking: clubData.hasParking,
      has_showers: clubData.hasShowers,
      has_bar: clubData.hasBar,
      has_shop: clubData.hasShop,
      phone: clubData.phone,
      email: clubData.email,
      website: clubData.website,
      image_url: clubData.image
    };

    const { error } = await supabase.from('clubs').insert(dbClub);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const adminDeleteClub = async (clubId: string): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: true };
  try {
    const { error } = await supabase.from('clubs').delete().eq('id', clubId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const uploadAvatar = async (userId: string, file: File): Promise<{ url: string | null; error: string | null }> => {
  if (!supabase) {
    return { url: URL.createObjectURL(file), error: null };
  }

  try {
    const fileName = `${userId}/avatar.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { 
        upsert: true,
        contentType: 'image/jpeg',
        cacheControl: '0' 
      });

    if (uploadError) {
      if (uploadError.message.includes("Bucket not found") || uploadError.message.includes("row-level security")) {
        throw new Error("BUCKET ERROR: Please execute 'storage_setup.sql' in the Supabase SQL Editor.");
      }
      throw uploadError;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const publicUrlWithCacheBust = `${data.publicUrl}?t=${Date.now()}`;
    
    return { url: publicUrlWithCacheBust, error: null };
  } catch (error: any) {
    console.error("Upload error:", error);
    return { url: null, error: error.message };
  }
};

export const uploadBrandLogo = async (brandId: string, file: File): Promise<{ url: string | null; error: string | null }> => {
  if (!supabase) return { url: null, error: "Supabase not configured" };

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${brandId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('brand-logos')
      .upload(fileName, file, {
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('brand-logos').getPublicUrl(fileName);
    
    if (data.publicUrl) {
       await supabase.from('racket_brands').update({ logo_url: data.publicUrl }).eq('id', brandId);
    }

    return { url: data.publicUrl, error: null };
  } catch (error: any) {
    console.error("Brand logo upload error:", error);
    return { url: null, error: error.message };
  }
};

export const deleteAvatar = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: true };

  try {
    const fileName = `${userId}/avatar.jpg`;
    const { error: storageError } = await supabase.storage
      .from('avatars')
      .remove([fileName]);

    if (storageError) {
      console.warn("Storage remove warning:", storageError.message);
    }

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

export const getBrands = async (): Promise<Brand[]> => {
  if (!supabase) return PADEL_RACKET_BRANDS;

  try {
    const { data, error } = await supabase
      .from('racket_brands')
      .select('*')
      .order('name');

    if (error || !data || data.length === 0) {
      return PADEL_RACKET_BRANDS; 
    }

    const dbBrands: Brand[] = data.map((b: any) => ({
      id: b.id,
      name: b.name,
      logo: b.logo_url
    }));

    const otherOption: Brand = { id: 'other', name: 'Other / Not Listed', logo: 'https://ui-avatars.com/api/?name=?&background=25f4c0&color=10221e&size=64' };
    
    return [...dbBrands, otherOption];

  } catch (err) {
    console.warn("Failed to fetch brands from DB, using fallback:", err);
    return PADEL_RACKET_BRANDS;
  }
};

export const searchusers = async (query: string, currentUserId: string): Promise<UserProfile[]> => {
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

export const searchUsers = searchusers;

export const getPartners = async (userId: string): Promise<Partnership[]> => {
  if (!supabase) return [];

  try {
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

export const getPartnershipStatus = async (userA: string, userB: string): Promise<'NONE' | 'PENDING' | 'ACCEPTED'> => {
    if (!supabase) return 'NONE';
    
    try {
        const { data } = await supabase.from('partnerships')
            .select('status')
            .or(`and(requester_id.eq.${userA},receiver_id.eq.${userB}),and(requester_id.eq.${userB},receiver_id.eq.${userA})`)
            .maybeSingle();
            
        return data ? data.status : 'NONE';
    } catch {
        return 'NONE';
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

export const getClubs = async (): Promise<Club[]> => {
  if (supabase) {
    try {
      const { data } = await promiseWithTimeout(
          supabase.from('clubs').select('*'),
          3000,
          'getClubs'
      ).catch(() => ({ data: null })) as any;
      
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
