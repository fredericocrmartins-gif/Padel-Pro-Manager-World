
import React, { useState, useId, useRef } from 'react';
import { UserProfile, Hand, CourtPosition, Gender } from '../types';
import { signOut, updateUserProfile, uploadAvatar } from '../lib/supabase';
import { PADEL_COUNTRIES, PADEL_REGIONS, PADEL_CITIES, PADEL_CLUBS } from '../constants';
// @ts-ignore
import imageCompression from 'browser-image-compression';

interface ProfileProps {
  user: UserProfile;
  onUpdate?: () => void; // Trigger to refresh app state
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
  const maskId = useId(); // Unique ID for the mask to prevent conflicts
  
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className="w-full h-full p-2" // Added slight padding to frame it nicely
      aria-label="Padel racket avatar solid straight long handle overlap"
      style={{ color: color }} // Applies the user's chosen color to currentColor
    >
      <defs>
        {/* Mask for centered holes */}
        <mask id={maskId}>
          <rect width="256" height="256" fill="white"/>

          <g fill="black">
            {/* Row 1 */}
            <circle cx="104" cy="56" r="7"/>
            <circle cx="128" cy="56" r="7"/>
            <circle cx="152" cy="56" r="7"/>

            {/* Row 2 */}
            <circle cx="92" cy="76" r="7"/>
            <circle cx="116" cy="76" r="7"/>
            <circle cx="140" cy="76" r="7"/>
            <circle cx="164" cy="76" r="7"/>

            {/* Row 3 */}
            <circle cx="92" cy="100" r="7"/>
            <circle cx="116" cy="100" r="7"/>
            <circle cx="140" cy="100" r="7"/>
            <circle cx="164" cy="100" r="7"/>

            {/* Row 4 */}
            <circle cx="92" cy="124" r="7"/>
            <circle cx="116" cy="124" r="7"/>
            <circle cx="140" cy="124" r="7"/>
            <circle cx="164" cy="124" r="7"/>

            {/* Row 5 */}
            <circle cx="104" cy="148" r="7"/>
            <circle cx="128" cy="148" r="7"/>
            <circle cx="152" cy="148" r="7"/>
          </g>
        </mask>
      </defs>

      {/* Racket head */}
      <g fill="currentColor" mask={`url(#${maskId})`}>
        <path d="
          M128 12
          C80 12 56 48 56 96
          C56 148 88 188 128 188
          C168 188 200 148 200 96
          C200 48 176 12 128 12
          Z"/>
      </g>

      {/* Throat (kept behind handle) */}
      <g fill="currentColor">
        <path d="
          M108 176
          C118 194 124 198 128 198
          C132 198 138 194 148 176
          L162 176
          C150 204 140 214 128 214
          C116 214 106 204 94 176
          Z"/>
      </g>

      {/* Handle drawn LAST so it overlaps the throat */}
      <g fill="currentColor">
        {/* Slightly higher + overlapping */}
        <rect x="116" y="206" width="24" height="72" rx="4"/>
      </g>
    </svg>
  );
};

export const Profile: React.FC<ProfileProps> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    // Location Fields
    country: user.country || 'PT',
    state: user.state || '', // Region/District Code
    city: user.city || '',   // Standardized Municipality
    location: (user.location === 'Unknown' || !user.location) ? '' : user.location, 
    
    homeClub: user.homeClub || '',
    division: user.division || 'M3',

    // Visuals
    avatar: user.avatar,
    avatarColor: user.avatarColor || '#25f4c0'
  });

  // Derived Lists
  const currentRegions = PADEL_REGIONS[formData.country] || [];
  const currentCities = formData.state ? PADEL_CITIES[formData.state] || [] : [];
  const currentCountryInfo = PADEL_COUNTRIES.find(c => c.code === formData.country);
  const dialCode = currentCountryInfo?.dialCode || '+??';

  // Check if we should show the default racket or the user's custom image
  // We treat "dicebear" URLs (the old default) as "no image set", so we show the racket instead.
  const hasCustomAvatar = formData.avatar && !formData.avatar.includes('dicebear');

  // Handlers for Location Cascading Updates
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      country: e.target.value,
      state: '', // Reset region
      city: ''   // Reset city
    }));
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      state: e.target.value,
      city: '' // Reset city when region changes
    }));
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // 1. Compression Options
      const options = {
        maxSizeMB: 0.2, // Max size in MB (200KB)
        maxWidthOrHeight: 800, // Max dimension
        useWebWorker: true,
        fileType: 'image/jpeg'
      };

      // 2. Compress
      const compressedFile = await imageCompression(file, options);
      
      // 3. Upload
      const { url, error } = await uploadAvatar(user.id, compressedFile);

      if (error) throw new Error(error);

      if (url) {
        setFormData(prev => ({ ...prev, avatar: url }));
        // Save immediately to profile so it persists
        await updateUserProfile(user.id, { avatar: url });
        if (onUpdate) onUpdate();
      }

    } catch (error: any) {
      console.error("Image upload failed:", error);
      alert(`Upload failed: ${error.message || "Unknown error"}. Ensure 'avatars' bucket exists in Supabase Storage.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Construct display name from first + last
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
      racketBrand: formData.racketBrand,
      
      country: formData.country,
      state: formData.state,
      city: formData.city,
      location: formData.location, 
      
      homeClub: formData.homeClub,
      division: formData.division,

      avatarColor: formData.avatarColor
    });

    if (result.success) {
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } else {
      let tip = "Ensure you have run the SQL script in Supabase to create the table and columns.";
      if (result.error?.includes('updated_at')) tip = "MISSING COLUMN 'updated_at'. Run the SQL script again.";
      if (result.error?.includes('avatar_color')) tip = "MISSING COLUMN 'avatar_color'. Run the SQL script again.";
      
      alert(`Error saving profile: ${result.error}\n\n${tip}`);
    }
    setIsSaving(false);
  };

  const calculateAge = (dateString: string) => {
    if (!dateString) return '--';
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Helper: Get display name for region code
  const getRegionName = (countryCode: string, regionCode: string) => {
    const regs = PADEL_REGIONS[countryCode];
    if (regs) {
      const reg = regs.find(r => r.code === regionCode);
      if (reg) return reg.name;
    }
    return regionCode;
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-surface-dark p-8 rounded-[3rem] border border-border-dark relative overflow-visible">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="relative group">
             {/* Avatar Render Logic */}
             <div className="size-28 rounded-full shadow-xl overflow-hidden bg-surface-dark border-4 border-surface-light flex items-center justify-center relative">
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center gap-1 text-text-muted">
                    <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                  </div>
                ) : hasCustomAvatar ? (
                  <img src={formData.avatar} className="w-full h-full object-cover" alt="profile"/>
                ) : (
                  <div className="w-full h-full p-1">
                    <DefaultRacketAvatar color={isEditing ? formData.avatarColor : (user.avatarColor || '#25f4c0')} />
                  </div>
                )}
             </div>

             {/* Color Picker (Only visible in edit mode AND no custom avatar) */}
             {isEditing && !hasCustomAvatar && (
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-surface-dark border border-border-dark rounded-2xl p-3 shadow-2xl z-50 animate-in zoom-in duration-200 flex flex-col items-center gap-3">
                   <div className="grid grid-cols-7 gap-1.5 w-max">
                     {PADEL_RACKET_COLORS.map(c => (
                       <button
                         key={c}
                         onClick={() => setFormData({...formData, avatarColor: c})}
                         className={`size-5 rounded-full transition-transform hover:scale-125 ${formData.avatarColor === c ? 'scale-110 ring-2 ring-white ring-offset-1 ring-offset-surface-dark' : 'hover:ring-1 hover:ring-white/50'}`}
                         style={{ backgroundColor: c }}
                         title={c}
                       />
                     ))}
                   </div>
                   {/* Mini Save Button specifically for Color Picker UX */}
                   <button 
                    onClick={handleSave} 
                    className="w-full py-1.5 bg-background-dark text-primary text-[9px] font-black uppercase rounded-lg border border-primary/20 hover:bg-primary hover:text-background-dark transition-all"
                   >
                     Save Color
                   </button>

                   {/* Triangle pointer */}
                   <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-surface-dark border-t border-l border-border-dark rotate-45"></div>
                </div>
             )}

             <button 
               onClick={() => fileInputRef.current?.click()}
               disabled={isUploading || !isEditing}
               className={`absolute bottom-0 right-0 p-2 bg-background-dark border border-border-dark rounded-full text-text-muted transition-colors z-10 ${isEditing ? 'hover:text-white cursor-pointer' : 'opacity-50 cursor-default'}`}
               title="Upload Image"
             >
               <span className="material-symbols-outlined text-sm">photo_camera</span>
             </button>
          </div>
          <div className="text-center md:text-left">
             <h1 className="text-3xl font-black mb-1">
               {formData.nickname ? `"${formData.nickname}"` : user.name}
             </h1>
             <p className="text-text-muted text-sm font-bold uppercase tracking-widest flex items-center gap-2 justify-center md:justify-start">
               {/* Display Flag + Region Name */}
               <span className="text-xl">
                 {PADEL_COUNTRIES.find(c => c.code === formData.country)?.flag || '🌍'}
               </span>
               {user.role} • {formData.state ? getRegionName(formData.country, formData.state) : formData.country}
             </p>
             <div className="flex gap-2 mt-3 justify-center md:justify-start">
                <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-black uppercase">
                  Level {user.skillLevel}
                </span>
                {formData.division && (
                  <span className="px-3 py-1 bg-surface-light text-white border border-border-dark rounded-lg text-[10px] font-black uppercase">
                    Div {formData.division}
                  </span>
                )}
                {user.isVerified && (
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">verified</span> Verified
                  </span>
                )}
             </div>
          </div>
        </div>

        <div className="flex gap-3 relative z-10">
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-6 py-3 bg-surface-light border border-border-dark text-white font-bold rounded-2xl hover:bg-border-dark transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Edit Profile
            </button>
          ) : (
            /* Empty div or null when editing to remove buttons from top */
            null
          )}
          <button 
             onClick={handleSignOut}
             className="px-4 py-3 bg-secondary/10 text-secondary border border-secondary/20 rounded-2xl hover:bg-secondary hover:text-white transition-all"
          >
             <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Metrics Display */}
        <div className="space-y-6">
           {/* Physical Stats Card */}
           <div className="bg-surface-dark border border-border-dark rounded-[2.5rem] p-8">
              <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">accessibility_new</span>
                Bio-Metrics
              </h3>
              <div className="space-y-6">
                 <div className="flex items-center justify-between border-b border-border-dark pb-4">
                    <span className="text-xs font-bold text-text-muted uppercase">Age</span>
                    <span className="font-black text-xl">{calculateAge(formData.birthDate)} <span className="text-xs text-text-muted font-normal">y.o</span></span>
                 </div>
                 <div className="flex items-center justify-between border-b border-border-dark pb-4">
                    <span className="text-xs font-bold text-text-muted uppercase">Height</span>
                    <span className="font-black text-xl">{formData.height || '--'} <span className="text-xs text-text-muted font-normal">cm</span></span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-muted uppercase">Hand</span>
                    <span className="font-black text-xl flex items-center gap-2">
                       {formData.hand === 'RIGHT' ? 'Right' : formData.hand === 'LEFT' ? 'Left' : '--'}
                       <span className="material-symbols-outlined text-lg">{formData.hand === 'RIGHT' ? 'front_hand' : 'back_hand'}</span>
                    </span>
                 </div>
              </div>
           </div>

           {/* Stats Summary */}
           <div className="bg-surface-dark border border-border-dark rounded-[2.5rem] p-8">
              <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">bar_chart</span>
                Performance
              </h3>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-background-dark p-4 rounded-2xl text-center">
                    <p className="text-2xl font-black text-white">{user.stats.matchesPlayed}</p>
                    <p className="text-[9px] font-bold text-text-muted uppercase mt-1">Matches</p>
                 </div>
                 <div className="bg-background-dark p-4 rounded-2xl text-center">
                    <p className="text-2xl font-black text-primary">{user.stats.winRate}%</p>
                    <p className="text-[9px] font-bold text-text-muted uppercase mt-1">Win Rate</p>
                 </div>
                 <div className="bg-background-dark p-4 rounded-2xl text-center col-span-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10 text-white">
                      <span className="material-symbols-outlined text-4xl">workspace_premium</span>
                    </div>
                    <div className="flex justify-around items-end">
                      <div>
                        <p className="text-2xl font-black text-white">{user.stats.elo}</p>
                        <p className="text-[9px] font-bold text-text-muted uppercase mt-1">ELO Rating</p>
                      </div>
                      <div className="h-8 w-px bg-border-dark"></div>
                      <div>
                         <p className="text-2xl font-black text-yellow-500">{user.stats.rankingPoints || 0}</p>
                         <p className="text-[9px] font-bold text-text-muted uppercase mt-1">FIP Points</p>
                      </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="lg:col-span-2 space-y-8">
           
           {/* SECTION 1: IDENTITY */}
           <section className="bg-surface-dark border border-border-dark rounded-[2.5rem] p-8">
              <h3 className="text-lg font-black mb-6 text-text-muted uppercase tracking-widest text-[10px]">Identity</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2">First Name</label>
                    <input 
                      disabled={!isEditing}
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none disabled:opacity-50 disabled:border-transparent"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Last Name</label>
                    <input 
                      disabled={!isEditing}
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none disabled:opacity-50 disabled:border-transparent"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Nickname</label>
                    <input 
                      disabled={!isEditing}
                      value={formData.nickname}
                      onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                      placeholder="e.g. 'The Wall'"
                      className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none disabled:opacity-50 disabled:border-transparent"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Date of Birth</label>
                    <input 
                      type="date"
                      disabled={!isEditing}
                      value={formData.birthDate}
                      onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                      className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none disabled:opacity-50 disabled:border-transparent text-white" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Gender</label>
                    <select
                       disabled={!isEditing}
                       value={formData.gender}
                       onChange={(e) => setFormData({...formData, gender: e.target.value as Gender})}
                       className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none disabled:opacity-50 disabled:border-transparent appearance-none"
                    >
                       <option value="MALE">Male</option>
                       <option value="FEMALE">Female</option>
                       <option value="OTHER">Other</option>
                    </select>
                 </div>
              </div>
           </section>

           {/* SECTION 2: CONTACT INFORMATION */}
           <section className="bg-surface-dark border border-border-dark rounded-[2.5rem] p-8">
              <h3 className="text-lg font-black mb-6 text-text-muted uppercase tracking-widest text-[10px]">Contact Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Email Field - Read Only */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2 flex items-center gap-2">
                      Email Address 
                      <span className="bg-background-dark px-1.5 py-0.5 rounded text-[8px] text-text-muted border border-border-dark">LOGIN ID</span>
                    </label>
                    <input 
                      disabled
                      value={formData.email}
                      className="w-full bg-background-dark/50 border border-transparent rounded-xl p-3 text-sm font-bold text-text-muted opacity-70 cursor-not-allowed"
                    />
                 </div>

                 {/* Phone Input with Country Code Prefix */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Phone (Optional)</label>
                    <div className="flex gap-2">
                      <div className="w-20 bg-background-dark border border-border-dark rounded-xl flex items-center justify-center text-sm font-bold text-text-muted select-none">
                        {dialCode}
                      </div>
                      <input 
                        type="tel"
                        disabled={!isEditing}
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                        placeholder="912345678"
                        className="flex-1 bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none disabled:opacity-50 disabled:border-transparent"
                      />
                    </div>
                 </div>
              </div>
           </section>

           {/* SECTION 3: LOCATION & COMPETITION */}
           <section className="bg-surface-dark border border-border-dark rounded-[2.5rem] p-8">
              <h3 className="text-lg font-black mb-6 text-text-muted uppercase tracking-widest text-[10px]">Location & Rankings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* COUNTRY SELECT */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Country</label>
                    <select
                       disabled={!isEditing}
                       value={formData.country}
                       onChange={handleCountryChange}
                       className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none disabled:opacity-50 disabled:border-transparent appearance-none"
                    >
                       {PADEL_COUNTRIES.map(c => (
                         <option key={c.code} value={c.code} disabled={c.code === 'sep'}>{c.flag} {c.name}</option>
                       ))}
                    </select>
                 </div>

                 {/* REGION SELECT (DEPENDENT) */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Region / District</label>
                    <div className="relative">
                      <select
                        disabled={!isEditing || currentRegions.length === 0}
                        value={formData.state}
                        onChange={handleRegionChange}
                        className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none disabled:opacity-50 disabled:border-transparent appearance-none"
                      >
                         <option value="">Select Region...</option>
                         {currentRegions.map(region => (
                           <option key={region.code} value={region.code}>{region.name}</option>
                         ))}
                      </select>
                      {currentRegions.length === 0 && (
                        <p className="text-[9px] text-text-muted mt-1 ml-2">No regions available.</p>
                      )}
                    </div>
                 </div>

                 {/* CITY SELECT (DEPENDENT) OR INPUT */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2">City / Municipality</label>
                    {currentCities.length > 0 ? (
                       <div className="relative">
                        <select
                           disabled={!isEditing}
                           value={formData.city}
                           onChange={(e) => setFormData({...formData, city: e.target.value})}
                           className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none disabled:opacity-50 disabled:border-transparent appearance-none"
                        >
                           <option value="">Select Municipality...</option>
                           {currentCities.map(city => (
                              <option key={city} value={city}>{city}</option>
                           ))}
                        </select>
                      </div>
                    ) : (
                      <input 
                        disabled={!isEditing}
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        placeholder="e.g. Cascais, Sintra..."
                        className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none disabled:opacity-50 disabled:border-transparent"
                      />
                    )}
                 </div>

                 {/* SPECIFIC LOCATION (OPTIONAL) - Default Empty */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Neighbourhood (Optional)</label>
                    <input 
                      disabled={!isEditing}
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="" 
                      className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none disabled:opacity-50 disabled:border-transparent"
                    />
                 </div>

                 {/* HOME CLUB SELECT - MOCK DB INTEGRATION */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Home Club</label>
                    <div className="relative">
                      <select 
                        disabled={!isEditing}
                        value={formData.homeClub}
                        onChange={(e) => setFormData({...formData, homeClub: e.target.value})}
                        className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none disabled:opacity-50 disabled:border-transparent appearance-none"
                      >
                         <option value="">Select your Club...</option>
                         {PADEL_CLUBS.map(club => (
                           <option key={club} value={club}>{club}</option>
                         ))}
                      </select>
                      {/* Search Icon or Arrow could go here */}
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Division / Category</label>
                    <select
                       disabled={!isEditing}
                       value={formData.division}
                       onChange={(e) => setFormData({...formData, division: e.target.value})}
                       className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none disabled:opacity-50 disabled:border-transparent appearance-none"
                    >
                       <option value="M1">M1 (Pro/Adv)</option>
                       <option value="M2">M2 (High)</option>
                       <option value="M3">M3 (Medium)</option>
                       <option value="M4">M4 (Low)</option>
                       <option value="M5">M5 (Beginner)</option>
                       <option value="F1">F1 (Pro/Adv)</option>
                       <option value="F2">F2 (High)</option>
                       <option value="F3">F3 (Medium)</option>
                       <option value="F4">F4 (Low)</option>
                       <option value="F5">F5 (Beginner)</option>
                       <option value="MIX">Mixed</option>
                    </select>
                 </div>
              </div>
           </section>

           {/* SECTION 4: PLAYER CONFIGURATION */}
           <section className="bg-surface-dark border border-border-dark rounded-[2.5rem] p-8">
              <h3 className="text-lg font-black mb-6 text-text-muted uppercase tracking-widest text-[10px]">Player Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Height (cm)</label>
                    <input 
                      type="number"
                      disabled={!isEditing}
                      value={formData.height || ''}
                      onChange={(e) => setFormData({...formData, height: e.target.value ? parseInt(e.target.value) : 0})}
                      placeholder="180"
                      className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none disabled:opacity-50 disabled:border-transparent"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Preferred Hand</label>
                    <div className="flex gap-2">
                       {(['RIGHT', 'LEFT'] as const).map((h) => (
                          <button
                            key={h}
                            disabled={!isEditing}
                            onClick={() => setFormData({...formData, hand: h})}
                            className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${
                               formData.hand === h 
                                ? 'bg-primary text-background-dark border-primary' 
                                : 'bg-background-dark text-text-muted border-border-dark hover:border-text-muted'
                            } ${!isEditing && formData.hand !== h ? 'opacity-30' : ''}`}
                          >
                             {h}
                          </button>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Preferred Court Side</label>
                    <div className="flex gap-2">
                       {(['LEFT', 'RIGHT', 'BOTH'] as const).map((side) => (
                          <button
                            key={side}
                            disabled={!isEditing}
                            onClick={() => setFormData({...formData, courtPosition: side})}
                            className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${
                               formData.courtPosition === side
                                ? 'bg-primary text-background-dark border-primary' 
                                : 'bg-background-dark text-text-muted border-border-dark hover:border-text-muted'
                            } ${!isEditing && formData.courtPosition !== side ? 'opacity-30' : ''}`}
                          >
                             {side}
                          </button>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Racket Brand</label>
                    <input 
                      disabled={!isEditing}
                      value={formData.racketBrand}
                      onChange={(e) => setFormData({...formData, racketBrand: e.target.value})}
                      placeholder="e.g. Bullpadel, Nox..."
                      className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none disabled:opacity-50 disabled:border-transparent"
                    />
                 </div>
              </div>
           </section>

           {/* Footer Save Action Bar (Static at bottom) */}
           {isEditing && (
             <div className="bg-surface-dark border border-border-dark rounded-[2.5rem] p-6 flex justify-end gap-3 mt-8">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 bg-transparent text-text-muted font-bold rounded-2xl hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-8 py-3 bg-primary text-background-dark font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-2"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                  <span className="material-symbols-outlined text-lg">save</span>
                </button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
