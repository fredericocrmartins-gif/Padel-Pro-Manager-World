
import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, Brand, Club } from '../types';
import { getBrands, uploadBrandLogo, adminGetAllUsers, updateUserProfile, getClubs, adminDeleteClub, adminCreateClub } from '../lib/supabase';
// @ts-ignore
import imageCompression from 'browser-image-compression';

type Section = 'overview' | 'users' | 'clubs' | 'brands' | 'database';

export const AdminDashboard: React.FC = () => {
  const [section, setSection] = useState<Section>('overview');
  
  // Data State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load Data based on section
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (section === 'brands') {
        const data = await getBrands();
        setBrands(data.filter(b => b.id !== 'other'));
      }
      if (section === 'users') {
        const data = await adminGetAllUsers();
        setUsers(data);
      }
      if (section === 'clubs') {
        const data = await getClubs();
        setClubs(data);
      }
      setLoading(false);
    };
    load();
  }, [section, refreshTrigger]);

  // --- SUB-COMPONENTS FOR EACH SECTION ---

  const UsersManager = () => {
    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        await updateUserProfile(userId, { role: newRole });
        setRefreshTrigger(prev => prev + 1);
    };

    const handleVerify = async (userId: string, currentStatus: boolean) => {
        await updateUserProfile(userId, { isVerified: !currentStatus });
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-black mb-4">User Management</h2>
            <div className="bg-surface-dark border border-border-dark rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-background-dark text-text-muted font-bold uppercase text-xs">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Verified</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-dark">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 flex items-center gap-3">
                                    <img src={u.avatar} className="size-8 rounded-full" alt="avatar"/>
                                    <div>
                                        <p className="font-bold">{u.name}</p>
                                        <p className="text-xs text-text-muted">{u.email}</p>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <select 
                                        value={u.role} 
                                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                                        className="bg-background-dark border border-border-dark rounded-lg px-2 py-1 text-xs font-bold outline-none"
                                    >
                                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </td>
                                <td className="p-4">
                                    <button 
                                        onClick={() => handleVerify(u.id, !!u.isVerified)}
                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.isVerified ? 'bg-blue-500/20 text-blue-400' : 'bg-surface-light text-text-muted'}`}
                                    >
                                        {u.isVerified ? 'Verified' : 'Unverified'}
                                    </button>
                                </td>
                                <td className="p-4 text-right">
                                    <button className="text-text-muted hover:text-white"><span className="material-symbols-outlined">more_vert</span></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
  };

  const BrandsManager = () => {
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const handleFileUpload = async (brandId: string, file: File) => {
        setUploadingId(brandId);
        try {
          const options = { maxSizeMB: 0.5, maxWidthOrHeight: 512, useWebWorker: true, fileType: 'image/png' };
          const compressedFile = await imageCompression(file, options);
          const { error } = await uploadBrandLogo(brandId, compressedFile);
          if (error) alert(`Error: ${error}`);
          else setRefreshTrigger(prev => prev + 1);
        } catch (e: any) { alert(e.message); } 
        finally { setUploadingId(null); }
    };

    const filtered = brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black">Racket Brands</h2>
                <input 
                    type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search brands..."
                    className="bg-surface-dark border border-border-dark rounded-xl px-4 py-2 text-sm font-bold outline-none"
                />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filtered.map(brand => {
                    const isDefault = brand.logo.includes('ui-avatars.com');
                    return (
                        <div key={brand.id} className="bg-background-dark border border-border-dark rounded-xl p-4 flex flex-col items-center gap-3 group relative overflow-hidden">
                            <div className="size-16 bg-white/5 rounded-lg flex items-center justify-center p-2">
                                <img src={brand.logo} className="max-w-full max-h-full object-contain" alt={brand.name} />
                            </div>
                            <p className="font-bold text-xs text-center">{brand.name}</p>
                            
                            {/* Upload Overlay */}
                            <label className="absolute inset-0 bg-primary/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm">
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(brand.id, e.target.files[0])} />
                                <div className="flex flex-col items-center text-background-dark">
                                    <span className="material-symbols-outlined text-2xl mb-1">cloud_upload</span>
                                    {uploadingId === brand.id ? <span className="animate-spin text-xl">refresh</span> : <span className="text-[10px] font-black uppercase">Change</span>}
                                </div>
                            </label>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  const ClubsManager = () => {
      const [showForm, setShowForm] = useState(false);
      const [newClub, setNewClub] = useState<Partial<Club>>({ type: 'INDOOR', country: 'PT' });

      const handleCreate = async () => {
          if (!newClub.name || !newClub.city) return alert("Name and City required");
          const { success, error } = await adminCreateClub(newClub);
          if (success) {
              setRefreshTrigger(prev => prev + 1);
              setShowForm(false);
              setNewClub({ type: 'INDOOR', country: 'PT' });
          } else {
              alert(error);
          }
      };

      const handleDelete = async (id: string) => {
          if(!confirm("Delete this club?")) return;
          await adminDeleteClub(id);
          setRefreshTrigger(prev => prev + 1);
      };

      return (
          <div className="space-y-6">
              <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black">Clubs Registry</h2>
                  <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary text-background-dark font-black rounded-xl text-xs uppercase hover:scale-105 transition-all">
                      {showForm ? 'Cancel' : 'Add New Club'}
                  </button>
              </div>

              {showForm && (
                  <div className="bg-surface-dark border border-border-dark p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4">
                      <input placeholder="Club Name" className="p-3 bg-background-dark rounded-xl border border-border-dark outline-none" onChange={e => setNewClub({...newClub, name: e.target.value})} />
                      <input placeholder="City" className="p-3 bg-background-dark rounded-xl border border-border-dark outline-none" onChange={e => setNewClub({...newClub, city: e.target.value})} />
                      <input placeholder="Address" className="p-3 bg-background-dark rounded-xl border border-border-dark outline-none" onChange={e => setNewClub({...newClub, address: e.target.value})} />
                      <select className="p-3 bg-background-dark rounded-xl border border-border-dark outline-none" onChange={e => setNewClub({...newClub, type: e.target.value as any})}>
                          <option value="INDOOR">Indoor</option><option value="OUTDOOR">Outdoor</option>
                      </select>
                      <input type="number" placeholder="Court Count" className="p-3 bg-background-dark rounded-xl border border-border-dark outline-none" onChange={e => setNewClub({...newClub, courtCount: parseInt(e.target.value)})} />
                      <div className="md:col-span-2">
                          <button onClick={handleCreate} className="w-full py-3 bg-primary text-background-dark font-bold rounded-xl">Save Club</button>
                      </div>
                  </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clubs.map(club => (
                      <div key={club.id} className="bg-surface-dark border border-border-dark rounded-2xl p-4 flex gap-4 relative group">
                          <img src={club.image} className="size-20 rounded-xl object-cover bg-background-dark" alt={club.name}/>
                          <div>
                              <h4 className="font-bold">{club.name}</h4>
                              <p className="text-xs text-text-muted">{club.city}, {club.country}</p>
                              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded mt-2 inline-block font-bold">{club.courtCount} Courts</span>
                          </div>
                          <button onClick={() => handleDelete(club.id)} className="absolute top-2 right-2 p-2 bg-secondary/10 text-secondary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary hover:text-white">
                              <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  const DatabaseManager = () => {
      return (
          <div className="space-y-6">
              <h2 className="text-2xl font-black">Database Settings</h2>
              <div className="p-6 bg-surface-dark border border-border-dark rounded-3xl text-center space-y-4">
                  <div className="size-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-3xl">dns</span>
                  </div>
                  <h3 className="text-xl font-bold">Dynamic Locations</h3>
                  <p className="text-text-muted text-sm max-w-md mx-auto">
                      Tables for Countries, Regions, and Cities have been created. 
                      Future updates will migrate the hardcoded constants to these tables.
                  </p>
                  <div className="flex justify-center gap-4 pt-4">
                      <button className="px-6 py-3 bg-background-dark border border-border-dark text-text-muted rounded-xl text-xs font-bold uppercase cursor-not-allowed opacity-50">
                          Manage Countries
                      </button>
                      <button className="px-6 py-3 bg-background-dark border border-border-dark text-text-muted rounded-xl text-xs font-bold uppercase cursor-not-allowed opacity-50">
                          Manage Cities
                      </button>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="flex h-screen bg-background-dark overflow-hidden animate-in fade-in duration-500">
        {/* Sidebar */}
        <aside className="w-20 md:w-64 bg-surface-dark border-r border-border-dark flex flex-col pt-6">
            <div className="flex items-center gap-3 px-6 mb-8 text-primary font-display font-bold text-xl">
                <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
                <span className="hidden md:block">Admin</span>
            </div>
            
            <nav className="flex-1 space-y-1 px-3">
                {[
                    { id: 'overview', icon: 'dashboard', label: 'Overview' },
                    { id: 'users', icon: 'group', label: 'Users' },
                    { id: 'clubs', icon: 'domain', label: 'Clubs' },
                    { id: 'brands', icon: 'sell', label: 'Brands' },
                    { id: 'database', icon: 'database', label: 'Database' }
                ].map(item => (
                    <button 
                        key={item.id}
                        onClick={() => setSection(item.id as Section)}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${section === item.id ? 'bg-primary text-background-dark font-bold' : 'text-text-muted hover:bg-background-dark hover:text-white'}`}
                    >
                        <span className="material-symbols-outlined">{item.icon}</span>
                        <span className="hidden md:block text-sm">{item.label}</span>
                    </button>
                ))}
            </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
            {loading ? (
                <div className="flex justify-center pt-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
                <>
                    {section === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-surface-dark border border-border-dark p-6 rounded-3xl">
                                <p className="text-text-muted text-xs font-bold uppercase">Total Users</p>
                                <h3 className="text-4xl font-black text-white mt-2">{users.length || '--'}</h3>
                            </div>
                            <div className="bg-surface-dark border border-border-dark p-6 rounded-3xl">
                                <p className="text-text-muted text-xs font-bold uppercase">Active Clubs</p>
                                <h3 className="text-4xl font-black text-primary mt-2">{clubs.length || '--'}</h3>
                            </div>
                            <div className="bg-surface-dark border border-border-dark p-6 rounded-3xl">
                                <p className="text-text-muted text-xs font-bold uppercase">Brand Assets</p>
                                <h3 className="text-4xl font-black text-white mt-2">{brands.length || '--'}</h3>
                            </div>
                        </div>
                    )}
                    {section === 'users' && <UsersManager />}
                    {section === 'brands' && <BrandsManager />}
                    {section === 'clubs' && <ClubsManager />}
                    {section === 'database' && <DatabaseManager />}
                </>
            )}
        </main>
    </div>
  );
};
