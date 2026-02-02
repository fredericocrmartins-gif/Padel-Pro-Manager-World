
import React, { useState, useEffect } from 'react';
import { MOCK_EVENTS, MOCK_USER, MOCK_JOIN_REQUESTS } from '../constants';
import { PadelEvent, JoinRequest, UserProfile } from '../types';
import { createJoinRequest, updateRequestStatus, getJoinRequestsForEvent } from '../lib/supabase';

export const Discovery: React.FC = () => {
  const [events, setEvents] = useState<PadelEvent[]>(MOCK_EVENTS);
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<PadelEvent | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMsg, setRequestMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Organizer Management State
  const [managingEvent, setManagingEvent] = useState<PadelEvent | null>(null);
  const [activeRequests, setActiveRequests] = useState<JoinRequest[]>([]);

  useEffect(() => {
    if (managingEvent) {
      getJoinRequestsForEvent(managingEvent.id).then(setActiveRequests);
    }
  }, [managingEvent]);

  const handleRequestJoin = async () => {
    if (!selectedEvent) return;
    setIsSubmitting(true);
    try {
      await createJoinRequest(selectedEvent.id, MOCK_USER.id, requestMsg);
      setShowRequestModal(false);
      setRequestMsg('');
      alert('Request sent successfully!');
    } catch (e) {
      alert('Failed to send request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (reqId: string, status: 'APPROVED' | 'DECLINED') => {
    const success = await updateRequestStatus(reqId, status);
    if (success && managingEvent) {
      const updated = await getJoinRequestsForEvent(managingEvent.id);
      setActiveRequests(updated);
    }
  };

  const filteredEvents = events.filter(e => {
    if (filterLevel && (filterLevel < e.skillRange.min || filterLevel > e.skillRange.max)) return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 relative">
      {/* Search Header */}
      <div className="p-6 bg-surface-dark/50 border-b border-border-dark sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-xl mx-auto flex flex-col gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">search</span>
            <input 
              type="text" 
              placeholder="Search by club or player..."
              className="w-full bg-background-dark border border-border-dark rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-primary transition-colors text-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setFilterLevel(null)}
              className={`shrink-0 px-4 py-2 rounded-full font-bold text-[10px] uppercase tracking-wider transition-all ${!filterLevel ? 'bg-primary text-background-dark' : 'bg-surface-dark text-text-muted border border-border-dark'}`}
            >
              All Levels
            </button>
            {[3.0, 3.5, 4.0, 4.5, 5.0].map(level => (
              <button 
                key={level}
                onClick={() => setFilterLevel(level)}
                className={`shrink-0 px-4 py-2 rounded-full font-bold text-[10px] uppercase tracking-wider transition-all ${filterLevel === level ? 'bg-primary text-background-dark' : 'bg-surface-dark text-text-muted border border-border-dark'}`}
              >
                Level {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map View (Desktop) */}
        <div className="hidden lg:block flex-1 bg-background-dark relative">
           <div 
             className="absolute inset-0 opacity-40 grayscale"
             style={{ 
               backgroundImage: `url('https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/-80.1918,25.7617,11,0/1200x800?access_token=pk.mock')`,
               backgroundSize: 'cover'
             }}
           />
           {filteredEvents.map(e => (
             <div key={e.id} className="absolute top-[40%] left-[45%] group cursor-pointer hover:z-10">
               <div className="bg-primary text-background-dark font-bold text-xs px-2 py-1 rounded shadow-xl mb-1 transform group-hover:scale-110 transition-transform">{e.players.length}/{e.maxPlayers}</div>
               <span className="material-symbols-outlined text-primary text-4xl drop-shadow-lg">location_on</span>
             </div>
           ))}
        </div>

        {/* Game List */}
        <div className="w-full lg:w-[450px] bg-background-dark border-l border-border-dark overflow-y-auto no-scrollbar p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-xl">Games Nearby</h2>
            <div className="flex gap-2">
              <button className="material-symbols-outlined text-text-muted hover:text-white p-2 rounded-lg bg-surface-dark">map</button>
              <button className="material-symbols-outlined text-text-muted hover:text-white p-2 rounded-lg bg-surface-dark">tune</button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredEvents.map(event => {
              const isFull = event.players.length >= event.maxPlayers;
              const isOrganizer = event.organizerId === MOCK_USER.id;
              const myRequest = MOCK_JOIN_REQUESTS.find(r => r.eventId === event.id && r.requesterId === MOCK_USER.id);

              return (
                <div key={event.id} className="bg-surface-dark border border-border-dark rounded-[2rem] p-6 hover:border-primary/50 transition-all group relative overflow-hidden">
                  {isOrganizer && (
                    <div className="absolute top-0 right-0 bg-primary/20 text-primary text-[8px] font-black uppercase px-3 py-1 rounded-bl-xl border-l border-b border-primary/30">
                      My Event
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-2xl">sports_tennis</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg leading-tight">{event.title}</h4>
                        <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mt-0.5">{event.location}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 bg-background-dark/50 p-2 rounded-xl">
                      <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                      <span className="text-xs font-bold">{event.time.split(' ')[0]}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-background-dark/50 p-2 rounded-xl">
                      <span className="material-symbols-outlined text-primary text-sm">signal_cellular_alt</span>
                      <span className="text-xs font-bold">{event.skillRange.min} - {event.skillRange.max}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {event.players.slice(0, 3).map((p, idx) => (
                          <img key={idx} src={p.avatar} className="size-8 rounded-full border-2 border-surface-dark bg-background-dark" alt="player"/>
                        ))}
                        {event.players.length > 3 && (
                          <div className="size-8 rounded-full bg-surface-light flex items-center justify-center text-[10px] font-bold border-2 border-surface-dark">
                            +{event.players.length - 3}
                          </div>
                        )}
                        {[...Array(Math.max(0, event.maxPlayers - event.players.length))].map((_, idx) => (
                          <div key={idx} className="size-8 rounded-full border-2 border-dashed border-border-dark flex items-center justify-center">
                            <span className="material-symbols-outlined text-xs text-border-dark">add</span>
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">
                        {event.players.length}/{event.maxPlayers} Spots
                      </span>
                    </div>

                    {isOrganizer ? (
                      <button 
                        onClick={() => setManagingEvent(event)}
                        className="px-5 py-2 bg-white text-background-dark font-black text-[10px] uppercase rounded-xl hover:bg-primary transition-all flex items-center gap-2"
                      >
                        Manage
                        {MOCK_JOIN_REQUESTS.filter(r => r.eventId === event.id && r.status === 'PENDING').length > 0 && (
                          <span className="size-2 bg-secondary rounded-full animate-pulse"></span>
                        )}
                      </button>
                    ) : myRequest ? (
                      <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border ${
                        myRequest.status === 'PENDING' ? 'border-yellow-500/30 text-yellow-500' : 
                        myRequest.status === 'APPROVED' ? 'border-primary/30 text-primary' : 'border-secondary/30 text-secondary'
                      }`}>
                        <span className="material-symbols-outlined text-sm">{myRequest.status === 'PENDING' ? 'pending' : myRequest.status === 'APPROVED' ? 'check_circle' : 'cancel'}</span>
                        {myRequest.status}
                      </div>
                    ) : isFull ? (
                      <div className="text-secondary text-[10px] font-black uppercase border border-secondary/30 px-4 py-2 rounded-xl">Full</div>
                    ) : (
                      <button 
                        onClick={() => { setSelectedEvent(event); setShowRequestModal(true); }}
                        className="px-5 py-2 bg-primary text-background-dark font-black text-[10px] uppercase rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                      >
                        Join Game
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Join Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background-dark/80 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
          <div className="bg-surface-dark border border-border-dark w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <h3 className="text-2xl font-black mb-2">Request Spot</h3>
            <p className="text-text-muted text-sm mb-6">Tell the organizer why you're a good fit for this game.</p>
            
            <textarea 
              value={requestMsg}
              onChange={(e) => setRequestMsg(e.target.value)}
              placeholder="Hi! I am a reliable player and live nearby..."
              className="w-full h-32 bg-background-dark border border-border-dark rounded-2xl p-4 text-sm outline-none focus:border-primary transition-all resize-none mb-6"
            />

            <div className="flex gap-4">
              <button 
                onClick={() => setShowRequestModal(false)}
                className="flex-1 py-4 bg-background-dark border border-border-dark font-bold rounded-2xl hover:bg-surface-light transition-all"
              >
                Cancel
              </button>
              <button 
                disabled={isSubmitting}
                onClick={handleRequestJoin}
                className="flex-1 py-4 bg-primary text-background-dark font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Organizer Request Management Drawer */}
      {managingEvent && (
        <div className="fixed inset-y-0 right-0 w-full lg:w-[500px] z-[100] bg-surface-dark border-l border-border-dark shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
          <div className="p-8 flex items-center justify-between border-b border-border-dark">
             <div>
               <h3 className="text-2xl font-black">Manage Requests</h3>
               <p className="text-text-muted text-xs font-bold uppercase tracking-widest mt-1">{managingEvent.title}</p>
             </div>
             <button 
               onClick={() => setManagingEvent(null)}
               className="size-12 rounded-2xl bg-background-dark flex items-center justify-center hover:bg-surface-light transition-colors"
             >
               <span className="material-symbols-outlined">close</span>
             </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="flex items-center gap-2 text-primary bg-primary/10 w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase">
              <span className="material-symbols-outlined text-sm">group</span>
              {managingEvent.players.length} / {managingEvent.maxPlayers} Confirmed
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-text-muted tracking-[0.2em]">Pending Inquiries</h4>
              {activeRequests.filter(r => r.status === 'PENDING').length === 0 ? (
                <div className="bg-background-dark/50 border border-dashed border-border-dark rounded-3xl p-10 text-center">
                  <span className="material-symbols-outlined text-4xl text-border-dark mb-2">hourglass_empty</span>
                  <p className="text-sm text-text-muted">No pending requests at the moment.</p>
                </div>
              ) : (
                activeRequests.filter(r => r.status === 'PENDING').map(request => (
                  <div key={request.id} className="bg-background-dark border border-border-dark rounded-3xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <img src={request.requester?.avatar} className="size-12 rounded-full" alt="avatar"/>
                      <div>
                        <p className="font-bold text-lg leading-none">{request.requester?.name}</p>
                        <p className="text-[10px] text-primary font-bold uppercase mt-1">Level {request.requester?.skillLevel}</p>
                      </div>
                    </div>
                    {request.message && (
                      <div className="bg-surface-dark p-4 rounded-xl text-xs text-text-muted italic mb-6">
                        "{request.message}"
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleStatusChange(request.id, 'DECLINED')}
                        className="flex-1 py-3 bg-secondary/10 text-secondary border border-secondary/20 font-bold rounded-xl text-[10px] uppercase hover:bg-secondary hover:text-white transition-all"
                      >
                        Decline
                      </button>
                      <button 
                        onClick={() => handleStatusChange(request.id, 'APPROVED')}
                        className="flex-1 py-3 bg-primary text-background-dark font-black rounded-xl text-[10px] uppercase shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-4 pt-4">
               <h4 className="text-xs font-black uppercase text-text-muted tracking-[0.2em]">History</h4>
               {activeRequests.filter(r => r.status !== 'PENDING').map(request => (
                 <div key={request.id} className="flex items-center justify-between p-4 bg-background-dark/30 rounded-2xl border border-border-dark/50 opacity-60">
                    <div className="flex items-center gap-3">
                       <img src={request.requester?.avatar} className="size-8 rounded-full" alt="avatar"/>
                       <p className="text-xs font-bold">{request.requester?.name}</p>
                    </div>
                    <span className={`text-[8px] font-black px-2 py-1 rounded border uppercase ${request.status === 'APPROVED' ? 'border-primary text-primary' : 'border-secondary text-secondary'}`}>
                      {request.status}
                    </span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
