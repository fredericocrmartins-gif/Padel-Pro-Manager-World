
import React, { useState } from 'react';
import { UserProfile, Hand, CourtPosition, Gender } from '../types';
import { signOut, updateUserProfile } from '../lib/supabase';

interface ProfileProps {
  user: UserProfile;
  onUpdate?: () => void; // Trigger to refresh app state
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
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
    // New Fields
    country: user.country || 'PT',
    city: user.city || '',
    homeClub: user.homeClub || '',
    division: user.division || 'M3'
  });

  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
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
      city: formData.city,
      homeClub: formData.homeClub,
      division: formData.division
    });

    if (result.success) {
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } else {
      // Intelligent Error Handling
      let tip = "Ensure you have run the SQL script in Supabase to create the table and columns.";
      
      if (result.error?.includes('updated_at')) {
        tip = "MISSING COLUMN 'updated_at'.\n\nRun the Master Schema SQL script again.";
      } else if (result.error?.includes('home_club') || result.error?.includes('country')) {
         tip = "MISSING NEW COLUMNS.\n\nRun the updated SQL script in Supabase to add 'country', 'city', etc.";
      }

      alert(`Error saving profile: ${result.error}\n\n----------------\n${tip}`);
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

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-surface-dark p-8 rounded-[3rem] border border-border-dark relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="relative">
             <img src={user.avatar} className="size-28 rounded-full border-4 border-primary shadow-xl" alt="profile"/>
             <button className="absolute bottom-0 right-0 p-2 bg-background-dark border border-border-dark rounded-full text-text-muted hover:text-white transition-colors">
               <span className="material-symbols-outlined text-sm">photo_camera</span>
             </button>
          </div>
          <div className="text-center md:text-left">
             <h1 className="text-3xl font-black mb-1">
               {formData.nickname ? `"${formData.nickname}"` : user.name}
             </h1>
             <p className="text-text-muted text-sm font-bold uppercase tracking-widest flex items-center gap-2 justify-center md:justify-start">
               {formData.country && <span className="text-xl">{(formData.country === 'PT' ? '🇵🇹' : formData.country === 'ES' ? '🇪🇸' : '🌍')}</span>}
               {user.role} • {formData.city || user.location}
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
            <>
              <button 
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 bg-transparent text-text-muted font-bold rounded-2xl hover:text-white transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-3 bg-primary text-background-dark font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-2"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
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
           
           {/* Identity Section */}
           <section className="bg-surface-dark border border-border-dark rounded-[2.5rem] p-8">
              <h3 className="text-lg font-black mb-6 text-text-muted uppercase tracking-widest text-[10px]">Identity & Contact</h3>
              
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
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Phone</label>
                    <input 
                      type="tel"
                      disabled={!isEditing}
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none disabled:opacity-50 disabled:border-transparent"
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

           {/* Competition & Location (NEW SECTION) */}
           <section className="bg-surface-dark border border-border-dark rounded-[2.5rem] p-8">
              <h3 className="text-lg font-black mb-6 text-text-muted uppercase tracking-widest text-[10px]">Location & Rankings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Country</label>
                    <select
                       disabled={!isEditing}
                       value={formData.country}
                       onChange={(e) => setFormData({...formData, country: e.target.value})}
                       className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none disabled:opacity-50 disabled:border-transparent appearance-none"
                    >
                       <option value="PT">Portugal (PT)</option>
                       <option value="ES">Spain (ES)</option>
                       <option value="BR">Brazil (BR)</option>
                       <option value="AR">Argentina (AR)</option>
                       <option value="IT">Italy (IT)</option>
                       <option value="SE">Sweden (SE)</option>
                       <option value="FR">France (FR)</option>
                       <option value="US">USA (US)</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2">City / Region</label>
                    <input 
                      disabled={!isEditing}
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      placeholder="e.g. Lisbon"
                      className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none disabled:opacity-50 disabled:border-transparent"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase ml-2">Home Club</label>
                    <input 
                      disabled={!isEditing}
                      value={formData.homeClub}
                      onChange={(e) => setFormData({...formData, homeClub: e.target.value})}
                      placeholder="e.g. Padel Center Lisboa"
                      className="w-full bg-background-dark border border-border-dark rounded-xl p-3 text-sm font-bold focus:border-primary outline-none disabled:opacity-50 disabled:border-transparent"
                    />
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

           {/* Player Config Section */}
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
        </div>
      </div>
    </div>
  );
};
