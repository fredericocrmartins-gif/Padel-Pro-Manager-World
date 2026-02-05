
import React, { useState, useEffect, useRef } from 'react';
import { Brand } from '../types';
import { getBrands, uploadBrandLogo } from '../lib/supabase';
// @ts-ignore
import imageCompression from 'browser-image-compression';

export const AdminBrands: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  
  // Refresh trigger
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getBrands();
      // Filter out the "Other" placeholder
      setBrands(data.filter(b => b.id !== 'other'));
      setLoading(false);
    };
    load();
  }, [refresh]);

  const handleFileUpload = async (brandId: string, file: File) => {
    setUploadingId(brandId);
    try {
      // Compress slightly to ensure quick loading and low bandwidth
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 512, useWebWorker: true, fileType: 'image/png' };
      const compressedFile = await imageCompression(file, options);
      
      const { error } = await uploadBrandLogo(brandId, compressedFile);
      
      if (error) {
        alert(`Error: ${error}`);
      } else {
        // Success: Trigger reload to show new logo
        setRefresh(prev => prev + 1);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUploadingId(null);
    }
  };

  const filteredBrands = brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 md:p-10 h-full flex flex-col animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black">Brand Manager</h1>
          <p className="text-text-muted text-xs font-bold uppercase tracking-widest mt-1">Upload & Manage Assets</p>
        </div>
        
        <div className="relative w-full md:w-auto">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">search</span>
          <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brands..."
            className="w-full md:w-80 bg-surface-dark border border-border-dark rounded-xl pl-12 pr-4 py-3 outline-none focus:border-primary transition-all font-bold text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-surface-dark border border-border-dark rounded-[2rem] p-6 shadow-2xl">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBrands.map(brand => {
              const isDefault = brand.logo.includes('ui-avatars.com');
              
              return (
                <div key={brand.id} className="bg-background-dark border border-border-dark rounded-2xl p-4 flex items-center gap-4 group hover:border-primary/50 transition-all relative overflow-hidden">
                  
                  {/* Status Indicator Stripe */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isDefault ? 'bg-yellow-500/50' : 'bg-primary'}`}></div>

                  <div className="relative shrink-0">
                    <div className="size-16 bg-white/5 rounded-xl flex items-center justify-center p-2 border border-white/10">
                      <img src={brand.logo} className="max-w-full max-h-full object-contain" alt={brand.name} />
                    </div>
                    {uploadingId === brand.id && (
                      <div className="absolute inset-0 bg-background-dark/80 flex items-center justify-center rounded-xl">
                        <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate" title={brand.name}>{brand.name}</h3>
                    <p className={`text-[10px] font-black uppercase tracking-wider ${isDefault ? 'text-yellow-500' : 'text-primary'}`}>
                      {isDefault ? 'Generated' : 'Custom Uploaded'}
                    </p>
                  </div>

                  {/* Upload Button overlay */}
                  <label className="absolute inset-0 bg-primary/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileUpload(brand.id, e.target.files[0]);
                      }}
                    />
                    <div className="flex flex-col items-center text-background-dark">
                      <span className="material-symbols-outlined text-3xl mb-1">cloud_upload</span>
                      <span className="text-[10px] font-black uppercase">Change Logo</span>
                    </div>
                  </label>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
