
import React, { useState, useId, useRef, useEffect } from 'react';
import { UserProfile, Hand, CourtPosition, Gender, PrivacyLevel, Partnership, Brand, UserRole } from '../types';
import { signOut, updateUserProfile, uploadAvatar, deleteAvatar, getPartners, searchUsers, sendPartnershipRequest, updatePartnershipStatus, removePartnership, getBrands } from '../lib/supabase';
import { PADEL_COUNTRIES, PADEL_REGIONS, PADEL_CITIES, PADEL_CLUBS, PADEL_RACKET_BRANDS } from '../constants';
// @ts-ignore
import imageCompression from 'browser-image-compression';

interface ProfileProps {
  user: UserProfile;
  onUpdate?: () => void; // Trigger to refresh app state
  onViewProfile: (userId: string) => void; // Callback to view other user
  onOpenAdmin?: () => void; // Callback to open admin
}

// Expanded Color Palette for Padel Rackets
const PADEL_RACKET_COLORS = [
  '#25f4c0', // Primary Green (PadelPro)
  '#10b981', // Emerald
  '#3b82f6', // Bright Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f20d0d', // Red (Secondary)
  '#f97316', // Orange
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#64748b', // Slate Grey
];

// Reusable SVG Component for the Default Avatar
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

export const Profile: React.FC<ProfileProps> = ({ user, onUpdate, onViewProfile, onOpenAdmin }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'privacy' | 'partners'>('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Partners State
  const [partners, setPartners] = useState<Partnership[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Brands State (Dynamic from DB)
  const [availableBrands, setAvailableBrands] = useState<Brand[]>(PADEL_RACKET_BRANDS);

  // Load Brands on Mount
  useEffect(() => {
    getBrands().then(setAvailableBrands);
  }, []);

  // Brand Selector Logic (Depends on availableBrands being loaded)
  const knownBrand = availableBrands.find(b => b.name === user.racketBrand);
  const initialBrandState = knownBrand ? knownBrand.name : (user.racketBrand ? 'other' : '');
  const [selectedBrandKey, setSelectedBrandKey] = useState(initialBrandState);
  const [customBrandName, setCustomBrandName] = useState(!knownBrand && user.racketBrand ? user.racketBrand : '');

  // Form State
  const [formData, setFormData] = useState({
    firstName: user.firstName || user.name.split(' ')[0] || '',
    lastName: user.lastName || user.name.split(' ').slice(1).join(' ') || '',
    nickname: user.nickname || '',
    email: user.email || '',
    phone: user.phone || '',
    birthDate: user.birthDate || '',
    gender: user.gender || 'MALE',
    height: user.height || 0,
    hand: user.hand || 'RIGHT',
    courtPosition: user.courtPosition || 'BOTH',
    racketBrand: user.racketBrand || '',
    country: user.country || 'PT',
    state: user.state || '',
    city: user.city || '',
    location: (user.location === 'Unknown' || !user.location) ? '' : user.location, 
    homeClub: user.homeClub || '',
    division: user.division || 'M3',
    avatar: user.avatar,
    avatarColor: user.avatarColor || '#25f4c0',
    privacySettings: user.privacySettings || {
      email: 'PRIVATE',
      phone: 'PARTNERS',
      stats: 'PUBLIC',
      matchHistory: 'PUBLIC',
      activityLog: 'PRIVATE'
    }
  });

  // Re-sync brand selection when user changes (if props update) or brands load
  useEffect(() => {
    const currentBrand = availableBrands.find(b => b.name === user.racketBrand);
    if (currentBrand) {
        setSelectedBrandKey(currentBrand.name);
    } else if (user.racketBrand) {
        setSelectedBrandKey('other');
        setCustomBrandName(user.racketBrand);
    } else {
        setSelectedBrandKey('');
    }
  }, [user.racketBrand, availableBrands]);

  // Sync brand selection to formData
  useEffect(() => {
    if (selectedBrandKey === 'other') {
      setFormData(prev => ({ ...prev, racketBrand: customBrandName }));
    } else {
      setFormData(prev => ({ ...prev, racketBrand: selectedBrandKey }));
    }
  }, [selectedBrandKey, customBrandName]);

  // Load Partners
  useEffect(() => {
    if (activeTab === 'partners') {
      getPartners(user.id).then(setPartners);
    }
  }, [activeTab, user.id]);

  // Handle User Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        const results = await searchUsers(searchQuery, user.id);
        // Filter out existing partners/pending
        const existingIds = new Set(partners.map(p => p.requesterId === user.id ? p.receiverId : p.requesterId));
        setSearchResults(results.filter(r => !existingIds.has(r.id)));
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, user.id, partners]);

  // Derived Lists
  const currentRegions = PADEL_REGIONS[formData.country] || [];
  const currentCountryInfo = PADEL_COUNTRIES.find(c => c.code === formData.country);
  const dialCode = currentCountryInfo?.dialCode || '+??';
  const hasCustomAvatar = formData.avatar && !formData.avatar.includes('dicebear');

  // Actions
  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  const handleSyncProfile = async () => {
    setIsSyncing(true);
    if (onUpdate) await onUpdate();
    setTimeout(() => setIsSyncing(false), 1000);
  };

  const handleDeleteAvatar = async () => {
    if (!confirm("Remove profile photo?")) return;
    setIsUploading(true);
    try {
      await deleteAvatar(user.id);
      const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;
      setFormData(prev => ({ ...prev, avatar: defaultAvatar }));
      if (onUpdate) onUpdate();
    } catch (error: any) { alert(error.message); } 
    finally { setIsUploading(false); }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const options = { maxSizeMB: 0.03, maxWidthOrHeight: 300, useWebWorker: true, fileType: 'image/jpeg' };
      const compressedFile = await imageCompression(file, options);
      const { url } = await uploadAvatar(user.id, compressedFile);
      if (url) {
        setFormData(prev => ({ ...prev, avatar: url }));
        await updateUserProfile(user.id, { avatar: url });
        if (onUpdate) onUpdate();
      }
    } catch (error: any) { alert(error.message); } 
    finally { setIsUploading(false); }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, country: e.target.value, state: '' }));
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, state: e.target.value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const displayName = `${formData.firstName} ${formData.lastName}`.trim();
    const result = await updateUserProfile(user.id, {
      name: displayName,
      firstName: formData.firstName,
      lastName: formData.lastName,
      nickname: formData.nickname,
      birthDate: formData.birthDate,
      gender: formData.gender as Gender,
      height: Number(formData.height) || 0,
      hand: formData.hand as Hand,
      courtPosition: formData.courtPosition as CourtPosition,
      phone: formData.phone,
      racketBrand: formData.racketBrand, // This is already synced via useEffect
      country: formData.country,
      state: formData.state,
      city: formData.city,
      location: formData.location, 
      homeClub: formData.homeClub,
      division: formData.division,
      avatarColor: formData.avatarColor,
      privacySettings: formData.privacySettings
    });

    if (result.success) {
      if (onUpdate) onUpdate();
      if (activeTab === 'edit' || activeTab === 'privacy') setActiveTab('overview');
    } else {
      alert(`Error: ${result.error}`);
    }
    setIsSaving(false);
  };

  const handleSendRequest = async (targetId: string) => {
    const { success, error } = await sendPartnershipRequest(user.id, targetId);
    if (success) {
      alert('Request sent!');
      getPartners(user.id).then(setPartners); // Refresh list
      setSearchQuery('');
    } else {
      alert(error);
    }
  };

  const handleAcceptRequest = async (partnershipId: string) => {
    await updatePartnershipStatus(partnershipId, 'ACCEPTED');
    getPartners(user.id).then(setPartners);
  };

  const handleRemovePartner = async (partnershipId: string) => {
    if (!confirm('Are you sure you want to remove this partner?')) return;
    await removePartnership(partnershipId);
    getPartners(user.id).then(setPartners);
  };

  const calculateAge = (dateString: string) => {
    if (!dateString) return '--';
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const getRegionName = (countryCode: string, regionCode: string) => {
    const regs = PADEL_REGIONS[countryCode];
    if (regs) {
      const reg = regs.find(r => r.code === regionCode);
      if (reg) return reg.name;
    }
    return regionCode;
  };

  const pendingRequests = partners.filter(p => p.status === 'PENDING' && p.receiverId === user.id);
  const sentRequests = partners.filter(p => p.status === 'PENDING' && p.requesterId === user.id);
  const activePartners = partners.filter(p => p.status === 'ACCEPTED');

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-20">
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-surface-dark p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-border-dark relative overflow-visible">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 w-full md:w-auto">
          <div className="relative group shrink-0">
             {/* Avatar */}
             <div className="size-24 md:size-28 rounded-full shadow-xl overflow-hidden bg-surface-dark border-4 border-surface-light flex items-center justify-center relative">
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center gap-1 text-text-muted"><span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span></div>
                ) : hasCustomAvatar ? (
                  <img src={formData.avatar} className="w-full h-full object-cover" alt="profile"/>
                ) : (
                  <div className="w-full h-full p-1"><DefaultRacketAvatar color={activeTab === 'edit' ? formData.avatarColor : (user.avatarColor || '#25f4c0')} /></div>
                )}
             </div>

             {hasCustomAvatar && (
               <button onClick={handleDeleteAvatar} disabled={isUploading} className="absolute top-0 right-0 p-1.5 bg-secondary text-white border border-background-dark rounded-full hover:bg-red-600 transition-colors z-20 shadow-md hover:scale-110">
                 <span className="material-symbols-outlined text-xs">close</span>
               </button>
             )}

             {activeTab === 'edit' && !hasCustomAvatar && (
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-surface-dark border border-border-dark rounded-2xl p-3 shadow-2xl z-50 animate-in zoom-in duration-200 flex flex-col items-center gap-3">
                   <div className="grid grid-cols-7 gap-1.5 w-max">
                     {PADEL_RACKET_COLORS.map(c => (
                       <button key={c} onClick={() => setFormData({...formData, avatarColor: c})} className={`size-5 rounded-full transition-transform hover:scale-125 ${formData.avatarColor === c ? 'scale-110 ring-2 ring-white' : ''}`} style={{ backgroundColor: c }} />
                     ))}
                   </div>
                </div>
             )}

             <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="absolute bottom-0 right-0 p-2 bg-background-dark border border-border-dark rounded-full text-text-muted hover:text-white transition-colors z-10 cursor-pointer shadow-lg hover:scale-110">
               <span className="material-symbols-outlined text-sm">photo_camera</span>
             </button>
          </div>
          <div className="text-center md:text-left w-full md:w-auto flex flex-col items-center md:items-start">
             {/* NAME DISPLAY UPDATE: 3 Lines (First, Last, Nickname) */}
             <h1 className="text-3xl md:text-4xl font-black leading-none tracking-tight break-words">{formData.firstName}</h1>
             <h1 className="text-3xl md:text-4xl font-black leading-none tracking-tight mb-1 break-words">{formData.lastName}</h1>
             {formData.nickname && <p className="text-lg text-primary font-bold italic mb-2">"{formData.nickname}"</p>}

             <div className="text-text-muted text-sm font-bold uppercase tracking-widest flex items-center gap-2 justify-center md:justify-start">
               <span className="text-xl">{PADEL_COUNTRIES.find(c => c.code === formData.country)?.flag || '🌍'}</span>
               {user.role} • {formData.state ? getRegionName(formData.country, formData.state) : formData.country}
             </div>
             
             {/* RESTORED: Level, Division, Verification Chips */}
             <div className="flex gap-2 mt-3 justify-center md:justify-start flex-wrap">
                <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-black uppercase">
                  Level {user.skillLevel}
                </span>
                {user.role === UserRole.ADMIN && (
                    <button 
                        onClick={onOpenAdmin}
                        className="px-3 py-1 bg-primary text-background-dark border border-primary rounded-lg text-[10px] font-black uppercase flex items-center gap-1 hover:scale-105 transition-all shadow-md shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-xs">admin_panel_settings</span> Admin Panel
                    </button>
                )}
                {user.isVerified && (
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">verified</span> Verified
                  </span>
                )}
             </div>
          </div>
        </div>

        <div className="flex gap-3 relative z-10 w-full md:w-auto justify-center md:justify-end">
          <button 
            onClick={handleSyncProfile} 
            disabled={isSyncing}
            className="px-4 py-3 bg-background-dark/50 text-text-muted border border-border-dark rounded-2xl hover:bg-background-dark hover:text-white transition-all flex items-center justify-center gap-2"
            title="Refresh Profile Data"
          >
             <span className={`material-symbols-outlined ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
             <span className="md:hidden text-xs font-black uppercase">Sync</span>
          </button>
          
          <button onClick={handleSignOut} className="px-4 py-3 bg-secondary/10 text-secondary border border-secondary/20 rounded-2xl hover:bg-secondary hover:text-white transition-all flex-1 md:flex-none flex items-center justify-center gap-2">
             <span className="material-symbols-outlined">logout</span>
             <span className="md:hidden text-xs font-black uppercase">Log Out</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="grid grid-cols-2 md:flex md:justify-center gap-2 bg-surface-dark p-1.5 rounded-2xl border border-border-dark w-full md:w-fit mx-auto">
        {[
          { id: 'overview', icon: 'person', label: 'Overview' },
          { id: 'edit', icon: 'edit', label: 'Edit' },
          { id: 'privacy', icon: 'lock', label: 'Privacy' },
          { id: 'partners', icon: 'group', label: 'Partners' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 md:px-6 py-3 md:py-2 rounded-xl text-[10px] md:text-xs font-black uppercase flex flex-col md:flex-row items-center justify-center gap-2 transition-all ${
              activeTab === tab.id ? 'bg-primary text-background-dark shadow-md' : 'text-text-muted hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg md:text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
           <div className="space-y-6">
              {/* RESTORED: Expanded Player Bio */}
              <div className="bg-surface-dark border border-border-dark rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8">
                  <h3 className="text-lg font-black mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary">accessibility_new</span> Player DNA</h3>
                  <div className="space-y-6">
                    <div className="flex justify-between border-b border-border-dark pb-4"><span className="text-xs font-bold text-text-muted uppercase">Age</span><span className="font-black text-xl">{calculateAge(formData.birthDate)}</span></div>
                    <div className="flex justify-between border-b border-border-dark pb-4"><span className="text-xs font-bold text-text-muted uppercase">Height</span><span className="font-black text-xl">{formData.height || '--'} cm</span></div>
                    <div className="flex justify-between border-b border-border-dark pb-4"><span className="text-xs font-bold text-text-muted uppercase">Hand</span><span className="font-black text-xl">{formData.hand}</span></div>
                    <div className="flex justify-between border-b border-border-dark pb-4"><span className="text-xs font-bold text-text-muted uppercase">Position</span><span className="font-black text-xl">{formData.courtPosition}</span></div>
                    <div className="flex justify-between border-b border-border-dark pb-4"><span className="text-xs font-bold text-text-muted uppercase">Racket</span><span className="font-black text-xl text-primary">{formData.racketBrand || '--'}</span></div>
                    <div className="flex justify-between"><span className="text-xs font-bold text-text-muted uppercase">Gender</span><span className="font-black text-xl">{formData.gender === 'MALE' ? 'Male' : formData.gender === 'FEMALE' ? 'Female' : 'Other'}</span></div>
                  </div>
              </div>

              {/* RESTORED: Contact Info Card (Private to user) */}
              <div className="bg-surface-dark border border-border-dark rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8">
                  <h3 className="text-lg font-black mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary">contact_phone</span> Contact Details</h3>
                  <div className="space-y-6">
                     <div className="space-y-1">
                        <span className="text-[10px] font-bold text-text-muted uppercase">Email</span>
                        <p className="font-bold truncate">{formData.email}</p>
                     </div>
                     <div className="space-y-1">
                        <span className="text-[10px] font-bold text-text-muted uppercase">Phone</span>
                        <p className="font-bold">{formData.phone || '--'}</p>
                     </div>
                  </div>
              </div>
           </div>
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-surface-dark border border-border-dark rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8">
                <h3 className="text-lg font-black mb-6">Performance Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-background-dark p-4 rounded-2xl text-center">
                    <p className="text-2xl font-black text-white">{user.stats.matchesPlayed}</p>
                    <p className="text-[9px] font-bold text-text-muted uppercase">Matches</p>
                  </div>
                  <div className="bg-background-dark p-4 rounded-2xl text-center">
                    <p className="text-2xl font-black text-primary">{user.stats.winRate}%</p>
                    <p className="text-[9px] font-bold text-text-muted uppercase">Win Rate</p>
                  </div>
                  <div className="bg-background-dark p-4 rounded-2xl text-center">
                    <p className="text-2xl font-black text-white">{user.stats.elo}</p>
                    <p className="text-[9px] font-bold text-text-muted uppercase">ELO</p>
                  </div>
                  <div className="bg-background-dark p-4 rounded-2xl text-center">
                    <p className="text-2xl font-black text-yellow-500">{user.stats.rankingPoints}</p>
                    <p className="text-[9px] font-bold text-text-muted uppercase">FIP Pts</p>
                  </div>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* EDIT TAB */}
      {activeTab === 'edit' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-dark border border-border-dark rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8">
            <div className="space-y-4">
               <h3 className="font-black text-sm uppercase text-text-muted tracking-widest border-b border-border-dark pb-2 mb-4">Identity</h3>
               <div className="space-y-2"><label className="text-[10px] font-bold text-text-muted uppercase ml-2">First Name</label><input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none" /></div>
               <div className="space-y-2"><label className="text-[10px] font-bold text-text-muted uppercase ml-2">Last Name</label><input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none" /></div>
               <div className="space-y-2"><label className="text-[10px] font-bold text-text-muted uppercase ml-2">Nickname</label><input value={formData.nickname} onChange={(e) => setFormData({...formData, nickname: e.target.value})} className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none" /></div>
               <div className="space-y-2"><label className="text-[10px] font-bold text-text-muted uppercase ml-2">Birth Date</label><input type="date" value={formData.birthDate} onChange={(e) => setFormData({...formData, birthDate: e.target.value})} className="w-full block bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none appearance-none text-white" /></div>
               {/* RESTORED: Gender */}
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Gender</label>
                  <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value as Gender})} className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none appearance-none">
                     <option value="MALE">Male</option>
                     <option value="FEMALE">Female</option>
                     <option value="OTHER">Other</option>
                  </select>
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="font-black text-sm uppercase text-text-muted tracking-widest border-b border-border-dark pb-2 mb-4">Location</h3>
               <div className="space-y-2"><label className="text-[10px] font-bold text-text-muted uppercase ml-2">Country</label><select value={formData.country} onChange={handleCountryChange} className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none">{PADEL_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}</select></div>
               <div className="space-y-2"><label className="text-[10px] font-bold text-text-muted uppercase ml-2">Region</label><select value={formData.state} onChange={handleRegionChange} className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none"><option value="">Select...</option>{currentRegions.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}</select></div>
               <div className="space-y-2"><label className="text-[10px] font-bold text-text-muted uppercase ml-2">City</label><input value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none" /></div>
            </div>

            {/* RESTORED: Contact Section */}
            <div className="space-y-4 md:col-span-2">
               <h3 className="font-black text-sm uppercase text-text-muted tracking-widest border-b border-border-dark pb-2 mb-4">Contact</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Email (Login)</label>
                     <input disabled value={formData.email} className="w-full bg-background-dark/50 border border-transparent rounded-xl p-3 text-sm font-bold text-text-muted opacity-70 cursor-not-allowed" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Phone</label>
                     <div className="flex gap-2">
                        <div className="w-20 bg-background-dark border border-border-dark rounded-xl flex items-center justify-center text-sm font-bold text-text-muted">{dialCode}</div>
                        <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="flex-1 bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none" placeholder="912345678"/>
                     </div>
                  </div>
               </div>
            </div>

            {/* RESTORED: Player Config Section */}
            <div className="space-y-4 md:col-span-2">
               <h3 className="font-black text-sm uppercase text-text-muted tracking-widest border-b border-border-dark pb-2 mb-4">Player Config</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="text-[10px] font-bold text-text-muted uppercase ml-2">Height (cm)</label><input type="number" value={formData.height} onChange={(e) => setFormData({...formData, height: parseInt(e.target.value) || 0})} className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none" /></div>
                  
                  {/* RACKET BRAND SELECTOR */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Racket Brand</label>
                    <div className="relative">
                      <select 
                        value={selectedBrandKey} 
                        onChange={(e) => setSelectedBrandKey(e.target.value)}
                        className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none appearance-none"
                      >
                        <option value="">Select Brand...</option>
                        {availableBrands.filter(b => b.id !== 'other').map(brand => (
                          <option key={brand.id} value={brand.name}>{brand.name}</option>
                        ))}
                        <option value="other">Other / Not Listed</option>
                      </select>
                      {/* Logo Preview inside Select Area */}
                      {selectedBrandKey && selectedBrandKey !== 'other' && (
                        <div className="absolute top-1/2 right-8 -translate-y-1/2 pointer-events-none">
                           <img 
                             src={availableBrands.find(b => b.name === selectedBrandKey)?.logo} 
                             alt="logo" 
                             className="h-6 w-auto object-contain rounded-md"
                           />
                        </div>
                      )}
                      <div className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none">
                        <span className="material-symbols-outlined text-sm text-text-muted">expand_more</span>
                      </div>
                    </div>
                    {/* Custom Brand Input if 'Other' selected */}
                    {selectedBrandKey === 'other' && (
                      <input 
                        value={customBrandName} 
                        onChange={(e) => setCustomBrandName(e.target.value)}
                        className="w-full mt-2 bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none animate-in fade-in slide-in-from-top-2" 
                        placeholder="Enter your custom racket brand..."
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Preferred Hand</label>
                     <div className="flex gap-2">
                        {(['RIGHT', 'LEFT'] as const).map(h => (
                           <button key={h} onClick={() => setFormData({...formData, hand: h})} className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${formData.hand === h ? 'bg-primary text-background-dark border-primary' : 'bg-background-dark text-text-muted border-border-dark'}`}>{h}</button>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Court Side</label>
                     <div className="flex gap-2">
                        {(['LEFT', 'RIGHT', 'BOTH'] as const).map(s => (
                           <button key={s} onClick={() => setFormData({...formData, courtPosition: s})} className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${formData.courtPosition === s ? 'bg-primary text-background-dark border-primary' : 'bg-background-dark text-text-muted border-border-dark'}`}>{s}</button>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

             {/* RESTORED: Club Section */}
            <div className="space-y-4 md:col-span-2">
               <h3 className="font-black text-sm uppercase text-text-muted tracking-widest border-b border-border-dark pb-2 mb-4">Club & Level</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Home Club</label>
                    <select value={formData.homeClub} onChange={(e) => setFormData({...formData, homeClub: e.target.value})} className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none appearance-none">
                       <option value="">Select Club...</option>
                       {PADEL_CLUBS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Division</label>
                    <select value={formData.division} onChange={(e) => setFormData({...formData, division: e.target.value})} className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none appearance-none">
                       <option value="M1">M1</option><option value="M2">M2</option><option value="M3">M3</option><option value="M4">M4</option><option value="M5">M5</option>
                       <option value="F1">F1</option><option value="F2">F2</option><option value="F3">F3</option><option value="F4">F4</option><option value="F5">F5</option>
                       <option value="MIX">MIX</option>
                    </select>
                  </div>
               </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-6 border-t border-border-dark">
               <button onClick={handleSave} disabled={isSaving} className="px-8 py-3 bg-primary text-background-dark font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all w-full md:w-auto">{isSaving ? 'Saving...' : 'Save Changes'}</button>
            </div>
        </div>
      )}

      {/* PRIVACY TAB */}
      {activeTab === 'privacy' && (
        <div className="bg-surface-dark border border-border-dark rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 max-w-3xl mx-auto">
          <h3 className="text-xl font-black mb-2">Privacy Settings</h3>
          <p className="text-text-muted text-sm mb-8">Control who can see your profile information.</p>
          
          <div className="space-y-6">
            {[
              { id: 'email', label: 'Email Address' },
              { id: 'phone', label: 'Phone Number' },
              { id: 'stats', label: 'Statistics (ELO, Win Rate)' },
              { id: 'matchHistory', label: 'Match History' },
              { id: 'activityLog', label: 'Activity Logs' },
            ].map(field => (
              <div key={field.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-background-dark rounded-2xl border border-border-dark">
                <span className="font-bold">{field.label}</span>
                <div className="flex bg-surface-dark p-1 rounded-xl border border-border-dark">
                  {(['PUBLIC', 'PARTNERS', 'PRIVATE'] as PrivacyLevel[]).map(level => (
                    <button
                      key={level}
                      onClick={() => setFormData(prev => ({ ...prev, privacySettings: { ...prev.privacySettings, [field.id]: level } }))}
                      className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1 ${
                        formData.privacySettings[field.id as keyof typeof formData.privacySettings] === level 
                          ? 'bg-primary text-background-dark' 
                          : 'text-text-muted hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[10px]">
                        {level === 'PUBLIC' ? 'public' : level === 'PARTNERS' ? 'group' : 'lock'}
                      </span>
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-8">
             <button onClick={handleSave} disabled={isSaving} className="px-8 py-3 bg-primary text-background-dark font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all w-full md:w-auto">{isSaving ? 'Saving...' : 'Save Preferences'}</button>
          </div>
        </div>
      )}

      {/* PARTNERS TAB */}
      {activeTab === 'partners' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          
          {/* Left: Find Partners */}
          <div className="bg-surface-dark border border-border-dark rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 flex flex-col h-[500px] md:h-[600px]">
             <h3 className="text-xl font-black mb-2">Find Partners</h3>
             <p className="text-text-muted text-sm mb-6">Search for players by name or nickname.</p>
             
             <div className="relative mb-6">
               <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">search</span>
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Search players..."
                 className="w-full bg-background-dark border border-border-dark rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:border-primary transition-all"
               />
               {isSearching && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary text-xs font-black animate-pulse">SEARCHING...</div>}
             </div>

             <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {searchResults.length === 0 && searchQuery.length > 2 && !isSearching && (
                   <p className="text-center text-text-muted text-sm mt-10">No players found.</p>
                )}
                {searchResults.map(result => (
                   <div key={result.id} className="flex items-center justify-between p-4 bg-background-dark rounded-2xl border border-border-dark hover:border-primary/40 transition-all cursor-pointer group" onClick={() => onViewProfile(result.id)}>
                      <div className="flex items-center gap-3">
                         <img src={result.avatar} className="size-10 rounded-full bg-surface-dark object-cover" alt="avatar"/>
                         <div>
                            <p className="font-bold text-sm group-hover:text-primary transition-colors">{result.name}</p>
                            <p className="text-[10px] text-text-muted font-bold uppercase">Level {result.skillLevel}</p>
                         </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleSendRequest(result.id); }}
                        className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-background-dark transition-all"
                      >
                         <span className="material-symbols-outlined text-sm">person_add</span>
                      </button>
                   </div>
                ))}
             </div>
          </div>

          {/* Right: My Network */}
          <div className="bg-surface-dark border border-border-dark rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 flex flex-col h-[500px] md:h-[600px]">
             <h3 className="text-xl font-black mb-6">My Network</h3>
             
             <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                
                {/* Pending Requests */}
                {pendingRequests.length > 0 && (
                   <div>
                      <h4 className="text-xs font-black uppercase text-secondary mb-3 tracking-widest">Pending Requests</h4>
                      <div className="space-y-3">
                         {pendingRequests.map(req => (
                            <div key={req.id} className="p-4 bg-background-dark rounded-2xl border border-secondary/30 flex items-center justify-between cursor-pointer hover:border-secondary/50 transition-all" onClick={() => req.partnerProfile && onViewProfile(req.partnerProfile.id)}>
                               <div className="flex items-center gap-3">
                                  <img src={req.partnerProfile?.avatar} className="size-10 rounded-full object-cover" alt="avatar"/>
                                  <div>
                                     <p className="font-bold text-sm">{req.partnerProfile?.name}</p>
                                     <p className="text-[10px] text-text-muted font-bold uppercase">Wants to connect</p>
                                  </div>
                               </div>
                               <div className="flex gap-2">
                                  <button onClick={(e) => { e.stopPropagation(); handleRemovePartner(req.id); }} className="p-2 bg-secondary/10 text-secondary rounded-lg hover:bg-secondary hover:text-white transition-all"><span className="material-symbols-outlined text-sm">close</span></button>
                                  <button onClick={(e) => { e.stopPropagation(); handleAcceptRequest(req.id); }} className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-background-dark transition-all"><span className="material-symbols-outlined text-sm">check</span></button>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                )}

                {/* Sent Requests */}
                {sentRequests.length > 0 && (
                   <div>
                      <h4 className="text-xs font-black uppercase text-text-muted mb-3 tracking-widest">Sent Requests</h4>
                      <div className="space-y-3">
                         {sentRequests.map(req => (
                            <div key={req.id} className="p-4 bg-background-dark/50 rounded-2xl border border-border-dark flex items-center justify-between opacity-70 cursor-pointer hover:opacity-100 transition-all" onClick={() => req.partnerProfile && onViewProfile(req.partnerProfile.id)}>
                               <div className="flex items-center gap-3">
                                  <img src={req.partnerProfile?.avatar} className="size-10 rounded-full object-cover" alt="avatar"/>
                                  <p className="font-bold text-sm">{req.partnerProfile?.name}</p>
                               </div>
                               <span className="text-[10px] font-black uppercase text-text-muted">Waiting...</span>
                            </div>
                         ))}
                      </div>
                   </div>
                )}

                {/* Active Partners */}
                <div>
                   <h4 className="text-xs font-black uppercase text-primary mb-3 tracking-widest">Connected Partners</h4>
                   {activePartners.length === 0 ? (
                      <p className="text-text-muted text-sm italic">No partners yet. Search for players!</p>
                   ) : (
                      <div className="space-y-3">
                         {activePartners.map(p => (
                            <div key={p.id} className="p-4 bg-background-dark rounded-2xl border border-border-dark hover:border-primary/30 transition-all flex items-center justify-between group cursor-pointer" onClick={() => p.partnerProfile && onViewProfile(p.partnerProfile.id)}>
                               <div className="flex items-center gap-3">
                                  <img src={p.partnerProfile?.avatar} className="size-10 rounded-full object-cover" alt="avatar"/>
                                  <div>
                                     <p className="font-bold text-sm group-hover:text-primary transition-colors">{p.partnerProfile?.name}</p>
                                     <p className="text-[10px] text-text-muted font-bold uppercase">Level {p.partnerProfile?.skillLevel}</p>
                                  </div>
                               </div>
                               <button onClick={(e) => { e.stopPropagation(); handleRemovePartner(p.id); }} className="p-2 text-text-muted hover:text-secondary opacity-0 group-hover:opacity-100 transition-all">
                                  <span className="material-symbols-outlined text-lg">person_remove</span>
                               </button>
                            </div>
                         ))}
                      </div>
                   )}
                </div>

             </div>
          </div>
        </div>
      )}
    </div>
  );
};
