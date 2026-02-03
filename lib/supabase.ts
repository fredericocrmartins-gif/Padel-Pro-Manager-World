
import { createClient } from '@supabase/supabase-js';
import { MOCK_USER } from '../constants';
import { JoinRequest, RequestStatus, TrainingLog } from '../types';

// ------------------------------------------------------------------
// CONFIGURAÇÃO DO SUPABASE
// ------------------------------------------------------------------
// 1. Vá em Project Settings (ícone de engrenagem) -> API.
// 2. Copie a "Project URL" e cole na variável abaixo.
// 3. Copie a chave "anon public" e cole na variável abaixo.
// ------------------------------------------------------------------

const supabaseUrl = 'COLE_A_PROJECT_URL_AQUI'; // Ex: https://xyzxyzxyz.supabase.co
const supabaseKey = 'COLE_A_CHAVE_ANON_PUBLIC_AQUI'; // Ex: eyJhbGciOiJIUzI1NiIsIn...

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Saves a training log entry to the Supabase database.
 */
export const saveTrainingLog = async (log: Omit<TrainingLog, 'id' | 'completedAt'>): Promise<TrainingLog> => {
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
};

/**
 * Retrieves training logs for a specific user from Supabase.
 */
export const getTrainingLogs = async (userId: string): Promise<TrainingLog[]> => {
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
};

/**
 * Creates a new join request for a Padel event in Supabase.
 */
export const createJoinRequest = async (eventId: string, requesterId: string, message: string): Promise<JoinRequest> => {
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
};

/**
 * Updates the status (APPROVED/DECLINED) of an existing join request.
 */
export const updateRequestStatus = async (requestId: string, status: RequestStatus): Promise<boolean> => {
  const { error } = await supabase
    .from('join_requests')
    .update({ status })
    .eq('id', requestId);

  if (error) {
    console.error('Error updating status:', error);
    return false;
  }
  return true;
};

/**
 * Fetches all join requests associated with a specific event ID.
 */
export const getJoinRequestsForEvent = async (eventId: string): Promise<JoinRequest[]> => {
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
};

/**
 * Returns a mock avatar URL for a given user ID.
 */
export const getAvatarUrl = (userId: string) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
};
