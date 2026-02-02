
import { MOCK_JOIN_REQUESTS, MOCK_EVENTS, MOCK_USER } from '../constants';
import { JoinRequest, RequestStatus, TrainingLog, AIPersonalPlan } from '../types';

const MOCK_LOGS: TrainingLog[] = [];
const MOCK_PLANS: AIPersonalPlan[] = [];

// Track join requests locally to simulate backend persistence during the session
let localJoinRequests: JoinRequest[] = [...MOCK_JOIN_REQUESTS];

export const supabase = {
  auth: {
    getUser: () => ({ data: { user: { id: 'u1' } }, error: null }),
    signOut: () => Promise.resolve({ error: null })
  },
  from: (table: string) => ({
    select: (query?: string) => ({
      eq: (col: string, val: any) => ({
        single: () => Promise.resolve({ data: null, error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
      }),
      order: (col: string, options: any) => Promise.resolve({ data: [], error: null })
    }),
    insert: (data: any) => ({
      select: () => ({ single: () => Promise.resolve({ data, error: null }) })
    })
  }),
  storage: {
    from: (bucket: string) => ({
      upload: (path: string, file: File) => Promise.resolve({ data: { path }, error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: `https://mock-storage.com/${path}` } })
    })
  }
};

/**
 * Saves a training log entry to the mock storage.
 */
export const saveTrainingLog = async (log: Omit<TrainingLog, 'id' | 'completedAt'>): Promise<TrainingLog> => {
  const newLog: TrainingLog = {
    ...log,
    id: Math.random().toString(36).substr(2, 9),
    completedAt: new Date().toISOString()
  };
  MOCK_LOGS.push(newLog);
  return newLog;
};

/**
 * Retrieves training logs for a specific user from the mock storage.
 */
export const getTrainingLogs = async (userId: string): Promise<TrainingLog[]> => {
  return MOCK_LOGS.filter(l => l.userId === userId);
};

/**
 * Returns a mock avatar URL for a given user ID.
 */
export const getAvatarUrl = (userId: string) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
};

// Fix: Implement missing join request management functions used in Discovery.tsx

/**
 * Creates a new join request for a Padel event.
 */
export const createJoinRequest = async (eventId: string, requesterId: string, message: string): Promise<JoinRequest> => {
  const newRequest: JoinRequest = {
    id: Math.random().toString(36).substring(2, 9),
    eventId,
    requesterId,
    status: 'PENDING',
    message,
    createdAt: new Date().toISOString(),
    // In this mock, we assume the requester is the current user to populate the profile
    requester: requesterId === MOCK_USER.id ? MOCK_USER : undefined
  };
  localJoinRequests.push(newRequest);
  return newRequest;
};

/**
 * Updates the status (APPROVED/DECLINED) of an existing join request.
 */
export const updateRequestStatus = async (requestId: string, status: RequestStatus): Promise<boolean> => {
  const index = localJoinRequests.findIndex(r => r.id === requestId);
  if (index !== -1) {
    localJoinRequests[index] = { ...localJoinRequests[index], status };
    return true;
  }
  return false;
};

/**
 * Fetches all join requests associated with a specific event ID.
 */
export const getJoinRequestsForEvent = async (eventId: string): Promise<JoinRequest[]> => {
  return localJoinRequests.filter(r => r.eventId === eventId);
};
