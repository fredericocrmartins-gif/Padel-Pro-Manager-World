
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MOCK_USER, MOCK_JOIN_REQUESTS } from '../constants';
import { JoinRequest, RequestStatus, TrainingLog } from '../types';

// ------------------------------------------------------------------
// CONFIGURAÇÃO DO SUPABASE
// ------------------------------------------------------------------
// 1. Vá em Project Settings (ícone de engrenagem) -> API.
// 2. Copie a "Project URL" e cole na variável abaixo.
// 3. Copie a chave "anon public" e cole na variável abaixo.
// ------------------------------------------------------------------

// VALORES PADRÃO (PLACEHOLDERS)
const DEFAULT_URL = 'COLE_A_PROJECT_URL_AQUI';
const DEFAULT_KEY = 'COLE_A_CHAVE_ANON_PUBLIC_AQUI';

const supabaseUrl = DEFAULT_URL; // Substitua pelo seu se já tiver
const supabaseKey = DEFAULT_KEY; // Substitua pelo seu se já tiver

// Verifica se as credenciais são válidas (não são os placeholders e parecem URLs reais)
const isConfigured = (supabaseUrl as string) !== DEFAULT_URL && (supabaseUrl as string).startsWith('http');

if (!isConfigured) {
  console.warn('⚠️ SUPABASE NÃO CONFIGURADO: Rodando em modo MOCK (Dados locais). Configure lib/supabase.ts para persistência real.');
}

// Inicializa condicionalmente para evitar crash
export const supabase: SupabaseClient | null = isConfigured 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// --- MOCK STORAGE (Fallback quando não há Supabase) ---
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
