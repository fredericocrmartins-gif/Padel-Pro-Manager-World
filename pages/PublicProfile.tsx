
import React, { useState, useEffect, useId } from 'react';
import { UserProfile, PrivacyLevel } from '../types';
import { getUserProfileById, getPartnershipStatus, sendPartnershipRequest } from '../lib/supabase';
import { PADEL_COUNTRIES, PADEL_REGIONS } from '../constants';

interface PublicProfileProps {
  targetUserId: string;
  currentUserId: string;
  onBack: () => void;
}

// Reusable Avatar Component (Duplicated from Profile to avoid circular deps, in a real app would be a shared component)
const DefaultRacketAvatar: React.FC<{ color: string }> = ({ color }) => {
  const maskId = useId(); 
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="w-full h-full p-2" style={{ color: color }}>
      <defs>
        <mask id={maskId}>
          <rect width="256" height="256" fill="white"/>
          <g fill="black">
            <circle cx="104" cy="56" r="7"/><circle cx="128" cy="56" r="7"/><circle cx="152" cy="56" r="7"/>
            <circle cx="92" cy="76" r="7"/><circle cx="116" cy="76" r="7"/><circle cx="140" cy="76" r="7"/><circle cx="164" cy="76" r="7"/>
            <circle cx="92" cy="100" r="7"/><circle cx="116" cy="100" r="7"/><circle cx="140" cy="100" r="7"/><circle cx="164" cy="100" r="7"/>
            <circle cx="92" cy="124" r="7"/><circle cx="116" cy="124" r="7"/><circle cx="140" cy="124" r="7"/><circle cx="164" cy="124" r="7"/>
            <circle cx="104" cy="148" r="7"/><circle cx="128" cy="148" r="7"/><circle cx="152" cy="148" r="7"/>
          </g>
        </mask>
      </defs>
      <g fill="currentColor" mask={`url(#${maskId})`}>
        <path d="M128 12C80 12 56 48 56 96C56 148 88 188 128 188C168 188 200 148 200 96C200 48 176 12 128 12Z"/>
      </g>
      <g fill="currentColor">
        <path d="M108 176C118 194 124 198 128 198C132 198 138 194 148 176L162 176C150 204 140 214 128 214C116 214 106 204 94 176Z"/>
      </g>
      <g fill="currentColor">
        <rect x="116" y="206" width="24" height="72" rx="4"/>
      </g>
    </svg>
  );
};

export const PublicProfile: React.FC<PublicProfileProps> = ({ targetUserId, currentUserId, onBack }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [partnershipStatus, setPartnershipStatus] = useState<'NONE' | 'PENDING' | 'ACCEPTED'>('NONE');
  const [loading, setLoading] = useState(true);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [user, status] = await Promise.all([
        getUserProfileById(targetUserId),
        getPartnershipStatus(currentUserId, targetUserId)
      ]);
      setProfile(user);
      setPartnershipStatus(status);
      setLoading(false);
    };
    fetchData();
  }, [targetUserId, currentUserId]);

  const handleConnect = async () => {
    await sendPartnershipRequest(currentUserId, targetUserId);
    setPartnershipStatus('PENDING');
    setRequestSent(true);
  };

  const getRegionName = (countryCode: string, regionCode: string) => {
    const regs = PADEL_REGIONS[countryCode];
    if (regs) {
      const reg = regs.find(r => r.code === regionCode);
      if (reg) return reg.name;
    }
    return regionCode;
  };

  const calculateAge = (dateString?: string) => {
    if (!dateString) return '--';
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  // --- PRIVACY CHECKER ---
  const canView = (field: keyof typeof profile.privacySettings): boolean => {
    if (!profile || !profile.privacySettings) return false;
    const setting = profile.privacySettings[field] || 'PRIVATE';
    
    if (setting === 'PUBLIC') return true;
    if (setting === 'PARTNERS' && partnershipStatus === 'ACCEPTED') return true;
    return false; // PRIVATE
  };

  if (loading) {
    return (
        <div className="h-full flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  if (!profile) return <div className="p-10 text-center">User not found</div>;

  const hasCustomAvatar = profile.avatar && !profile.avatar.includes('dicebear');

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      
      <button onClick={onBack} className="flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-4">
        <span className="material-symbols-outlined">arrow_back</span>
        <span className="text-sm font-bold uppercase tracking-widest">Back</span>
      </button>

      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-surface-dark p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-border-dark relative overflow-visible">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 w-full md:w-auto">
          <div className="relative group shrink-0">
             <div className="size-24 md:size-28 rounded-full shadow-xl overflow-hidden bg-surface-dark border-4 border-surface-light flex items-center justify-center relative">
                {hasCustomAvatar ? (
                  <img src={profile.avatar} className="w-full h-full object-cover" alt="profile"/>
                ) : (
                  <div className="w-full h-full p-1"><DefaultRacketAvatar color={profile.avatarColor || '#25f4c0'} /></div>
                )}
             </div>
          </div>
          <div className="text-center md:text-left w-full md:w-auto">
             <h1 className="text-2xl md:text-3xl font-black mb-1 break-words">{profile.nickname ? `"${profile.nickname}"` : profile.name}</h1>
             <p className="text-text-muted text-sm font-bold uppercase tracking-widest flex items-center gap-2 justify-center md:justify-start">
               <span className="text-xl">{PADEL_COUNTRIES.find(c => c.code === profile.country)?.flag || '🌍'}</span>
               {profile.role} • {profile.state ? getRegionName(profile.country || 'PT', profile.state) : profile.country}
             </p>
             
             <div className="flex gap-2 mt-3 justify-center md:justify-start flex-wrap">
                <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-black uppercase">
                  Level {profile.skillLevel}
                </span>
                {profile.division && (
                  <span className="px-3 py-1 bg-surface-light text-white border border-border-dark rounded-lg text-[10px] font-black uppercase">
                    Div {profile.division}
                  </span>
                )}
                {profile.isVerified && (
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">verified</span> Verified
                  </span>
                )}
             </div>
          </div>
        </div>

        <div className="flex gap-3 relative z-10 w-full md:w-auto justify-center md:justify-end">
           {partnershipStatus === 'ACCEPTED' ? (
              <button disabled className="px-6 py-3 bg-primary/20 text-primary border border-primary/20 rounded-2xl font-black text-xs uppercase flex items-center gap-2 cursor-default">
                  <span className="material-symbols-outlined text-sm">handshake</span>
                  Partner
              </button>
           ) : partnershipStatus === 'PENDING' || requestSent ? (
              <button disabled className="px-6 py-3 bg-surface-light text-text-muted border border-border-dark rounded-2xl font-black text-xs uppercase flex items-center gap-2 cursor-default">
                  <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                  Pending
              </button>
           ) : (
              <button onClick={handleConnect} className="px-6 py-3 bg-primary text-background-dark rounded-2xl font-black text-xs uppercase flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-sm">person_add</span>
                  Connect
              </button>
           )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
           <div className="space-y-6">
              {/* Player DNA */}
              <div className="bg-surface-dark border border-border-dark rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8">
                  <h3 className="text-lg font-black mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary">accessibility_new</span> Player DNA</h3>
                  <div className="space-y-6">
                    <div className="flex justify-between border-b border-border-dark pb-4"><span className="text-xs font-bold text-text-muted uppercase">Age</span><span className="font-black text-xl">{calculateAge(profile.birthDate)}</span></div>
                    <div className="flex justify-between border-b border-border-dark pb-4"><span className="text-xs font-bold text-text-muted uppercase">Height</span><span className="font-black text-xl">{profile.height || '--'} cm</span></div>
                    <div className="flex justify-between border-b border-border-dark pb-4"><span className="text-xs font-bold text-text-muted uppercase">Hand</span><span className="font-black text-xl">{profile.hand || '--'}</span></div>
                    <div className="flex justify-between border-b border-border-dark pb-4"><span className="text-xs font-bold text-text-muted uppercase">Position</span><span className="font-black text-xl">{profile.courtPosition || '--'}</span></div>
                    <div className="flex justify-between"><span className="text-xs font-bold text-text-muted uppercase">Gender</span><span className="font-black text-xl">{profile.gender === 'MALE' ? 'Male' : profile.gender === 'FEMALE' ? 'Female' : 'Other'}</span></div>
                  </div>
              </div>

              {/* Contact Info (Protected) */}
              <div className="bg-surface-dark border border-border-dark rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden">
                  <h3 className="text-lg font-black mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary">contact_phone</span> Contact Details</h3>
                  
                  {!canView('email') && !canView('phone') ? (
                      <div className="flex flex-col items-center justify-center py-6 text-text-muted opacity-50">
                          <span className="material-symbols-outlined text-4xl mb-2">lock</span>
                          <p className="text-xs font-black uppercase">Private Information</p>
                      </div>
                  ) : (
                      <div className="space-y-6">
                         <div className="space-y-1">
                            <span className="text-[10px] font-bold text-text-muted uppercase flex items-center gap-2">
                                Email
                                {!canView('email') && <span className="material-symbols-outlined text-[10px]">lock</span>}
                            </span>
                            <p className="font-bold truncate">{canView('email') ? profile.email : '•••••••••'}</p>
                         </div>
                         <div className="space-y-1">
                            <span className="text-[10px] font-bold text-text-muted uppercase flex items-center gap-2">
                                Phone
                                {!canView('phone') && <span className="material-symbols-outlined text-[10px]">lock</span>}
                            </span>
                            <p className="font-bold">{canView('phone') ? (profile.phone || '--') : '•••••••••'}</p>
                         </div>
                      </div>
                  )}
              </div>
           </div>
           
           <div className="lg:col-span-2 space-y-6">
              {/* Stats (Protected) */}
              <div className="bg-surface-dark border border-border-dark rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 relative">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black">Performance Stats</h3>
                    {!canView('stats') && <span className="material-symbols-outlined text-text-muted">lock</span>}
                </div>

                {!canView('stats') ? (
                    <div className="absolute inset-0 bg-surface-dark/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-[2.5rem]">
                        <span className="material-symbols-outlined text-4xl text-text-muted mb-2">lock</span>
                        <p className="text-sm font-bold text-white">Stats are private</p>
                    </div>
                ) : null}

                <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${!canView('stats') ? 'opacity-20 blur-sm' : ''}`}>
                  <div className="bg-background-dark p-4 rounded-2xl text-center">
                    <p className="text-2xl font-black text-white">{profile.stats.matchesPlayed}</p>
                    <p className="text-[9px] font-bold text-text-muted uppercase">Matches</p>
                  </div>
                  <div className="bg-background-dark p-4 rounded-2xl text-center">
                    <p className="text-2xl font-black text-primary">{profile.stats.winRate}%</p>
                    <p className="text-[9px] font-bold text-text-muted uppercase">Win Rate</p>
                  </div>
                  <div className="bg-background-dark p-4 rounded-2xl text-center">
                    <p className="text-2xl font-black text-white">{profile.stats.elo}</p>
                    <p className="text-[9px] font-bold text-text-muted uppercase">ELO</p>
                  </div>
                  <div className="bg-background-dark p-4 rounded-2xl text-center">
                    <p className="text-2xl font-black text-yellow-500">{profile.stats.rankingPoints}</p>
                    <p className="text-[9px] font-bold text-text-muted uppercase">FIP Pts</p>
                  </div>
                </div>
              </div>
              
              {/* Match History Placeholder (Protected) */}
               <div className="bg-surface-dark border border-border-dark rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 relative min-h-[200px]">
                   <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black">Match History</h3>
                        {!canView('matchHistory') && <span className="material-symbols-outlined text-text-muted">lock</span>}
                   </div>
                   
                   {!canView('matchHistory') ? (
                        <div className="absolute inset-0 bg-surface-dark/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-[2.5rem]">
                            <span className="material-symbols-outlined text-4xl text-text-muted mb-2">lock</span>
                            <p className="text-sm font-bold text-white">Match history is private</p>
                        </div>
                    ) : (
                        <p className="text-text-muted text-sm italic">No recent public matches found.</p>
                    )}
               </div>

           </div>
      </div>
    </div>
  );
};
