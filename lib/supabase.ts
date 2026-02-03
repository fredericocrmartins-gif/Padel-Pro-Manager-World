
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MOCK_USER, MOCK_JOIN_REQUESTS } from '../constants';
import { JoinRequest, RequestStatus, TrainingLog } from '../types';

// ------------------------------------------------------------------
// CONFIGURAÇÃO DE AMBIENTE (VERCEL / PROD)
// ------------------------------------------------------------------
// O código agora busca as chaves diretamente das Variáveis de Ambiente.
// No Vercel: Settings -> Environment Variables
//
// Nomes de variáveis suportados:
// 1. VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (Padrão Vite)
// 2. REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY (Padrão CRA)
// 3. NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (Padrão Next.js)
// ------------------------------------------------------------------

const getEnvVar = (key: string) => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch {
    return undefined;
  }
  return undefined;
};

// Tenta resolver a URL e a KEY usando os prefixos mais comuns
const supabaseUrl = 
  getEnvVar('VITE_SUPABASE_URL') || 
  getEnvVar('REACT_APP_SUPABASE_URL') || 
  getEnvVar('NEXT_PUBLIC_SUPABASE_URL');

const supabaseKey = 
  getEnvVar('VITE_SUPABASE_ANON_KEY') || 
  getEnvVar('REACT_APP_SUPABASE_ANON_KEY') || 
  getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

// Verifica se foi configurado corretamente
const isConfigured = supabaseUrl && supabaseUrl.startsWith('http') && supabaseKey;

if (!isConfigured) {
  console.warn('⚠️ SUPABASE: Variáveis de ambiente não encontradas. O app está rodando em modo MOCK (Demonstração). Configure as variáveis no painel da Vercel para persistir dados.');
}

export const supabase: SupabaseClient | null = isConfigured 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// --- MOCK STORAGE (Fallback quando não há Supabase ou erro de conexão) ---
let localTrainingLogs: TrainingLog[] = [];
let localJoinRequests: JoinRequest[] = [...MOCK_JOIN_REQUESTS];

/**
 * Saves a training log entry to the Supabase database (or local mock).
 */
export const saveTrainingLog = async (log: Omit<TrainingLog, 'id' | 'completedAt'>): Promise<TrainingLog> => {
  if (supabase) {
    const { data, error } = await supabase
      .from('training_logs')
      .insert([{
        user_id: log.userId,
        exercise_id: log.exerciseId,
        duration: log.duration,
        rpe: log.rpe,
        notes: log.notes
      }])
      .select()
      .single();

    if (error) {
      console.error('Error saving log:', error);
      throw error;
    }
    
    return {
      ...data,
      userId: data.user_id,
      exerciseId: data.exercise_id,
      completedAt: data.completed_at
    } as TrainingLog;
  } else {
    // Fallback Mock
    const newLog: TrainingLog = {
      id: Math.random().toString(36).substr(2, 9),
      completedAt: new Date().toISOString(),
      ...log
    };
    localTrainingLogs.push(newLog);
    return newLog;
  }
};

/**
 * Retrieves training logs for a specific user from Supabase (or local mock).
 */
export const getTrainingLogs = async (userId: string): Promise<TrainingLog[]> => {
  if (supabase) {
    const { data, error } = await supabase
      .from('training_logs')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching logs:', error);
      return [];
    }

    return data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      exerciseId: d.exercise_id,
      duration: d.duration,
      rpe: d.rpe,
      notes: d.notes,
      completedAt: d.completed_at
    }));
  } else {
    // Fallback Mock
    return localTrainingLogs.filter(l => l.userId === userId);
  }
};

/**
 * Creates a new join request for a Padel event.
 */
export const createJoinRequest = async (eventId: string, requesterId: string, message: string): Promise<JoinRequest> => {
  if (supabase) {
    const { data, error } = await supabase
      .from('join_requests')
      .insert([{
        event_id: eventId,
        requester_id: requesterId,
        status: 'PENDING',
        message: message
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating join request:', error);
      throw error;
    }

    return {
      id: data.id,
      eventId: data.event_id,
      requesterId: data.requester_id,
      status: data.status,
      message: data.message,
      createdAt: data.created_at,
      requester: MOCK_USER 
    };
  } else {
    // Fallback Mock
    const newReq: JoinRequest = {
      id: Math.random().toString(36).substr(2, 9),
      eventId,
      requesterId,
      status: 'PENDING',
      message,
      createdAt: new Date().toISOString(),
      requester: MOCK_USER
    };
    localJoinRequests.push(newReq);
    return newReq;
  }
};

/**
 * Updates the status (APPROVED/DECLINED) of an existing join request.
 */
export const updateRequestStatus = async (requestId: string, status: RequestStatus): Promise<boolean> => {
  if (supabase) {
    const { error } = await supabase
      .from('join_requests')
      .update({ status })
      .eq('id', requestId);

    if (error) {
      console.error('Error updating status:', error);
      return false;
    }
    return true;
  } else {
    // Fallback Mock
    const req = localJoinRequests.find(r => r.id === requestId);
    if (req) {
      req.status = status;
      return true;
    }
    return false;
  }
};

/**
 * Fetches all join requests associated with a specific event ID.
 */
export const getJoinRequestsForEvent = async (eventId: string): Promise<JoinRequest[]> => {
  if (supabase) {
    const { data, error } = await supabase
      .from('join_requests')
      .select(`
        *,
        requester_id
      `)
      .eq('event_id', eventId);

    if (error) {
      console.error('Error fetching requests:', error);
      return [];
    }

    return data.map((d: any) => ({
      id: d.id,
      eventId: d.event_id,
      requesterId: d.requester_id,
      status: d.status as RequestStatus,
      message: d.message,
      createdAt: d.created_at,
      requester: d.requester_id === MOCK_USER.id 
        ? MOCK_USER 
        : { ...MOCK_USER, id: d.requester_id, name: 'Unknown User' }
    }));
  } else {
    // Fallback Mock
    return localJoinRequests.filter(r => r.eventId === eventId);
  }
};

/**
 * Returns a mock avatar URL for a given user ID.
 */
export const getAvatarUrl = (userId: string) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
};
