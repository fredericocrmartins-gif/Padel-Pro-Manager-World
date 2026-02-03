
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MOCK_USER, MOCK_JOIN_REQUESTS } from '../constants';
import { JoinRequest, RequestStatus, TrainingLog, UserProfile, UserRole } from '../types';

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
const isConfigured = supabaseUrl && supabaseUrl.startsWith('http') && supabaseKey;

export const supabase: SupabaseClient | null = isConfigured 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// --- AUTH FUNCTIONS ---

export const signInWithEmail = async (email: string, password: string) => {
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
      data: { name: name }, // Store name in metadata
      emailRedirectTo: 'http://localhost:3000' // Explicitly set redirect
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
      emailRedirectTo: 'http://localhost:3000'
    }
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
};

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  if (!supabase) return MOCK_USER; // Fallback for dev without keys

  try {
    // Safe check for user session
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      // If error is just 'missing session', it's fine, return null to show login
      console.log("Auth check info:", error.message);
      return null;
    }

    const user = data?.user;
    if (!user) return null;

    // In a real app, we would fetch extra details from a 'profiles' table.
    // For this test environment, we construct the profile from Auth Metadata.
    return {
      id: user.id,
      name: user.user_metadata?.name || 'Player',
      username: user.email?.split('@')[0] || 'user',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
      skillLevel: 3.5, // Default for new users
      role: UserRole.PLAYER,
      location: 'Unknown',
      stats: {
        winRate: 0,
        matchesPlayed: 0,
        elo: 1200,
        ytdImprovement: 0
      }
    };
  } catch (e) {
    console.error("Unexpected error in getCurrentUserProfile:", e);
    return null;
  }
};


// --- EXISTING DATA FUNCTIONS (With Mock Fallback) ---
let localTrainingLogs: TrainingLog[] = [];
let localJoinRequests: JoinRequest[] = [...MOCK_JOIN_REQUESTS];

export const saveTrainingLog = async (log: Omit<TrainingLog, 'id' | 'completedAt'>): Promise<TrainingLog> => {
  if (supabase) {
    // Try to save to DB, if table doesn't exist, it might fail, but that's expected in this test phase
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
  
  // Fallback
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
    const { error } = await supabase.from('join_requests').update({ status }).eq('id', requestId);
    if (!error) return true;
  }
  const req = localJoinRequests.find(r => r.id === requestId);
  if (req) { req.status = status; return true; }
  return false;
};

export const getJoinRequestsForEvent = async (eventId: string): Promise<JoinRequest[]> => {
  if (supabase) {
    const { data } = await supabase.from('join_requests').select('*').eq('event_id', eventId);
    if (data) return data.map((d: any) => ({
      id: d.id, eventId: d.event_id, requesterId: d.requester_id, status: d.status, message: d.message, createdAt: d.created_at, requester: MOCK_USER
    }));
  }
  return localJoinRequests.filter(r => r.eventId === eventId);
};
