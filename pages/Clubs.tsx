
import React, { useState, useEffect } from 'react';
import { Club } from '../types';
import { getClubs } from '../lib/supabase';

export const Clubs: React.FC = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterCity, setFilterCity] = useState<string | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await getClubs();
      setClubs(data);
      setLoading(false);
    };
    loadData();
  }, []);

  // Extract unique cities for filter dropdown
  const cities = Array.from(new Set(clubs.map(c => c.city))).sort();

  // Filter Logic
  const filteredClubs = clubs.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          club.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType ? club.type === filterType : true;
    const matchesCity = filterCity ? club.city === filterCity : true;
    
    return matchesSearch && matchesType && matchesCity;
  });

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      
      {/* Header & Filter Bar */}
      <div className="p-6 md:p-8 bg-surface-dark border-b border-border-dark flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sticky top-0 z-20 backdrop-blur-xl">
         <div>
            <h1 className="text-3xl font-black">Club Directory</h1>
            <p className="text-text-muted text-xs font-bold uppercase tracking-widest mt-1">Find the best courts near you</p>
         </div>

         <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">search</span>
              <input 
                type="text" 
                placeholder="Search clubs..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 bg-background-dark border border-border-dark rounded-xl pl-10 pr-4 py-3 text-sm font-bold outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* City Filter */}
            <select 
              value={filterCity || ''}
              onChange={(e) => setFilterCity(e.target.value || null)}
              className="bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
            >
              <option value="">All Cities</option>
              {cities.map(city => <option key={city} value={city}>{city}</option>)}
            </select>

            {/* Type Filter */}
            <div className="flex bg-background-dark p-1 rounded-xl border border-border-dark">
               <button 
                 onClick={() => setFilterType(null)}
                 className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${!filterType ? 'bg-surface-light text-white' : 'text-text-muted hover:text-white'}`}
               >
                 All
               </button>
               <button 
                 onClick={() => setFilterType('INDOOR')}
                 className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filterType === 'INDOOR' ? 'bg-primary text-background-dark' : 'text-text-muted hover:text-white'}`}
               >
                 Indoor
               </button>
               <button 
                 onClick={() => setFilterType('OUTDOOR')}
                 className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filterType === 'OUTDOOR' ? 'bg-orange-500 text-white' : 'text-text-muted hover:text-white'}`}
               >
                 Outdoor
               </button>
            </div>
         </div>
      </div>

      {/* Content Grid */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
         {loading ? (
           <div className="flex justify-center pt-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
         ) : filteredClubs.length === 0 ? (
           <div className="text-center pt-20 opacity-50">
             <span className="material-symbols-outlined text-6xl mb-2">domain_disabled</span>
             <p className="font-bold">No clubs found matching your criteria.</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredClubs.map(club => (
                <div key={club.id} className="bg-surface-dark border border-border-dark rounded-[2rem] overflow-hidden hover:border-primary/50 transition-all group flex flex-col h-full">
                   <div className="h-48 relative overflow-hidden">
                      <img src={club.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={club.name}/>
                      <div className="absolute top-4 right-4 flex gap-2">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border shadow-lg ${
                          club.type === 'INDOOR' ? 'bg-background-dark/80 text-primary border-primary/30' : 'bg-background-dark/80 text-orange-400 border-orange-400/30'
                        }`}>
                          {club.type}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-background-dark/90 to-transparent">
                         <div className="flex items-center gap-1 text-white text-xs font-bold">
                            <span className="material-symbols-outlined text-sm">location_on</span>
                            {club.city}, {club.country}
                         </div>
                      </div>
                   </div>
                   
                   <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-black mb-1">{club.name}</h3>
                      <p className="text-text-muted text-xs mb-4 line-clamp-2">{club.address}</p>
                      
                      {/* Amenities Icons */}
                      <div className="flex gap-3 mb-6">
                         {club.hasBar && <span title="Bar/Café" className="material-symbols-outlined text-text-muted text-lg">local_cafe</span>}
                         {club.hasShowers && <span title="Showers" className="material-symbols-outlined text-text-muted text-lg">shower</span>}
                         {club.hasParking && <span title="Parking" className="material-symbols-outlined text-text-muted text-lg">directions_car</span>}
                         {club.hasShop && <span title="Pro Shop" className="material-symbols-outlined text-text-muted text-lg">shopping_bag</span>}
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-border-dark">
                         <div className="flex flex-col">
                           <span className="text-[10px] text-text-muted font-bold uppercase">Courts</span>
                           <span className="text-lg font-black text-white">{club.courtCount}</span>
                         </div>
                         <button 
                           onClick={() => setSelectedClub(club)}
                           className="px-6 py-3 bg-surface-light hover:bg-primary hover:text-background-dark text-white font-bold rounded-xl transition-all text-xs uppercase tracking-wider"
                         >
                           View Details
                         </button>
                      </div>
                   </div>
                </div>
              ))}
           </div>
         )}
      </div>

      {/* Club Details Modal */}
      {selectedClub && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background-dark/90 backdrop-blur-md animate-in fade-in zoom-in duration-300">
           <div className="bg-surface-dark border border-border-dark w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] p-0 shadow-2xl relative">
              
              {/* Modal Header Image */}
              <div className="h-64 relative">
                 <img src={selectedClub.image} className="w-full h-full object-cover" alt="cover"/>
                 <div className="absolute inset-0 bg-gradient-to-t from-surface-dark to-transparent"></div>
                 <button 
                    onClick={() => setSelectedClub(null)} 
                    className="absolute top-6 right-6 size-10 bg-background-dark/50 hover:bg-background-dark backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all border border-white/10"
                 >
                    <span className="material-symbols-outlined">close</span>
                 </button>
                 <div className="absolute bottom-8 left-8">
                    <h2 className="text-4xl font-black mb-2 shadow-black drop-shadow-md">{selectedClub.name}</h2>
                    <div className="flex items-center gap-3">
                       <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border bg-background-dark/50 backdrop-blur-md ${
                          selectedClub.type === 'INDOOR' ? 'text-primary border-primary/30' : 'text-orange-400 border-orange-400/30'
                       }`}>
                          {selectedClub.type}
                       </span>
                       <span className="flex items-center gap-1 text-white text-xs font-bold bg-background-dark/50 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {selectedClub.address}
                       </span>
                    </div>
                 </div>
              </div>

              <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
                 
                 {/* Main Info */}
                 <div className="md:col-span-2 space-y-8">
                    <section>
                       <h3 className="text-sm font-black uppercase text-text-muted tracking-widest mb-4">About the Club</h3>
                       <p className="text-sm leading-relaxed text-gray-300">
                         Experience top-tier padel at {selectedClub.name}. Located in the heart of {selectedClub.city}, 
                         we offer {selectedClub.courtCount} professional-grade courts. Whether you are a beginner or a pro, 
                         our facilities are designed to give you the best playing experience.
                       </p>
                    </section>

                    <section>
                       <h3 className="text-sm font-black uppercase text-text-muted tracking-widest mb-4">Facilities</h3>
                       <div className="grid grid-cols-2 gap-4">
                          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${selectedClub.hasBar ? 'bg-primary/10 border-primary/30 text-white' : 'bg-background-dark border-border-dark text-text-muted opacity-50'}`}>
                             <span className="material-symbols-outlined">local_cafe</span>
                             <span className="font-bold text-sm">Bar & Lounge</span>
                          </div>
                          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${selectedClub.hasShowers ? 'bg-primary/10 border-primary/30 text-white' : 'bg-background-dark border-border-dark text-text-muted opacity-50'}`}>
                             <span className="material-symbols-outlined">shower</span>
                             <span className="font-bold text-sm">Changing Rooms</span>
                          </div>
                          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${selectedClub.hasParking ? 'bg-primary/10 border-primary/30 text-white' : 'bg-background-dark border-border-dark text-text-muted opacity-50'}`}>
                             <span className="material-symbols-outlined">directions_car</span>
                             <span className="font-bold text-sm">Private Parking</span>
                          </div>
                          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${selectedClub.hasShop ? 'bg-primary/10 border-primary/30 text-white' : 'bg-background-dark border-border-dark text-text-muted opacity-50'}`}>
                             <span className="material-symbols-outlined">shopping_bag</span>
                             <span className="font-bold text-sm">Pro Shop</span>
                          </div>
                       </div>
                    </section>
                 </div>

                 {/* Sidebar Info */}
                 <div className="space-y-6">
                    <div className="bg-background-dark p-6 rounded-3xl border border-border-dark">
                       <h3 className="text-xs font-black uppercase text-text-muted tracking-widest mb-4">Opening Hours</h3>
                       <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                             <span className="text-text-muted">Mon - Fri</span>
                             <span className="font-bold text-white">{selectedClub.openingHours?.weekdays || '09:00 - 23:00'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                             <span className="text-text-muted">Sat - Sun</span>
                             <span className="font-bold text-white">{selectedClub.openingHours?.weekends || '09:00 - 20:00'}</span>
                          </div>
                       </div>
                    </div>

                    <div className="bg-background-dark p-6 rounded-3xl border border-border-dark">
                       <h3 className="text-xs font-black uppercase text-text-muted tracking-widest mb-4">Contact Us</h3>
                       <div className="space-y-4">
                          {selectedClub.phone && (
                            <a href={`tel:${selectedClub.phone}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                               <div className="size-8 rounded-lg bg-surface-dark flex items-center justify-center border border-border-dark">
                                  <span className="material-symbols-outlined text-sm">call</span>
                               </div>
                               <span className="text-sm font-bold">{selectedClub.phone}</span>
                            </a>
                          )}
                          {selectedClub.email && (
                            <a href={`mailto:${selectedClub.email}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                               <div className="size-8 rounded-lg bg-surface-dark flex items-center justify-center border border-border-dark">
                                  <span className="material-symbols-outlined text-sm">mail</span>
                               </div>
                               <span className="text-sm font-bold truncate">{selectedClub.email}</span>
                            </a>
                          )}
                          {selectedClub.website && (
                            <a href={selectedClub.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-primary transition-colors">
                               <div className="size-8 rounded-lg bg-surface-dark flex items-center justify-center border border-border-dark">
                                  <span className="material-symbols-outlined text-sm">language</span>
                               </div>
                               <span className="text-sm font-bold truncate">Visit Website</span>
                            </a>
                          )}
                       </div>
                    </div>
                    
                    <button className="w-full py-4 bg-primary text-background-dark font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                       Book Court
                    </button>
                 </div>
              </div>

           </div>
        </div>
      )}
    </div>
  );
};
