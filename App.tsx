
import React, { useState, useEffect, useRef } from 'react';
import { AppShell } from './components/AppShell';
import { Dashboard } from './pages/Dashboard';
import { Discovery } from './pages/Discovery';
import { Training } from './pages/Training';
import { Rankings } from './pages/Rankings';
import { TournamentLive } from './pages/TournamentLive';
import { Clubs } from './pages/Clubs';
import { Login } from './pages/Login';
import { AuthSuccess } from './pages/AuthSuccess';
import { Profile } from './pages/Profile';
import { PublicProfile } from './pages/PublicProfile';
import { AdminDashboard } from './pages/AdminDashboard';
import { supabase, getCurrentUserProfile, signOut } from './lib/supabase';
import { UserProfile, UserRole } from './types';
import { MOCK_USER } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRescueBtn, setShowRescueBtn] = useState(false); // New Rescue State
  const [showWelcome, setShowWelcome] = useState(false);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const isMounted = useRef(true);

  // 1. SAFETY TIMERS (The "Big Hammer")
  useEffect(() => {
    // Show "Force Enter" button after 3 seconds if still loading
    const rescueTimer = setTimeout(() => {
        if (isMounted.current) setShowRescueBtn(true);
    }, 3000);

    // Force stop loading after 6 seconds no matter what
    const safetyTimer = setTimeout(() => {
      if (isMounted.current) {
        setIsLoading((prev) => {
          if (prev) console.warn("⚠️ PadelPro: Forced app load via safety timer");
          return false;
        });
      }
    }, 6000);

    return () => { 
        clearTimeout(rescueTimer); 
        clearTimeout(safetyTimer); 
    };
  }, []);

  // 2. Auth & Data Fetching
  useEffect(() => {
    isMounted.current = true;

    // Check URL for Supabase Email Verification markers
    const hash = window.location.hash;
    if (hash && (hash.includes('type=signup') || hash.includes('type=recovery') || hash.includes('type=magiclink'))) {
      setShowWelcome(true);
    }

    const checkUser = async () => {
      try {
        if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                if (isMounted.current) setIsLoading(false);
                return;
            }
            // Session exists, we must get a user
            const profile = await getCurrentUserProfile();
            
            if (isMounted.current) {
               if (profile) {
                 setUser(profile);
               }
               setIsLoading(false);
            }
        } else {
          // Mock Mode
          const profile = await getCurrentUserProfile();
          if (isMounted.current) {
            if (profile) setUser(profile);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Failed to check user session:", error);
        if (isMounted.current) setIsLoading(false);
      }
    };

    checkUser();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
             // Only fetch if we don't have a user or if the session user is different
             if (session && (!user || user.id !== session.user.id)) {
                // IMPORTANT: Do NOT set isLoading(true) here. 
                // We want background updates without blocking the UI.
                const profile = await getCurrentUserProfile();
                if (isMounted.current && profile) setUser(profile);
             }
        } else if (event === 'SIGNED_OUT') {
          if (isMounted.current) {
             setUser(null);
             setShowWelcome(false);
             setIsLoading(false);
          }
        }
      });
      return () => {
        isMounted.current = false;
        subscription.unsubscribe();
      };
    } else {
      setIsLoading(false);
    }
  }, []); 

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setShowWelcome(false);
  };

  const refreshProfile = async () => {
    const profile = await getCurrentUserProfile();
    if (profile) setUser(profile);
  };

  // Navigation Logic
  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setViewingProfileId(null); // Reset profile view when changing main tabs
  };

  const handleViewProfile = (targetUserId: string) => {
    if (targetUserId === user?.id) {
        setActiveTab('profile'); // Go to own editable profile
    } else {
        setViewingProfileId(targetUserId); // View other user
    }
  };

  const handleForceEnter = () => {
      console.warn("User triggered Force Enter");
      setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-background-dark flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center">
           <div className="flex flex-col items-center gap-2">
             <div className="text-primary font-black text-2xl animate-pulse tracking-widest">LOADING PADELPRO</div>
             <p className="text-text-muted text-xs">Syncing player data...</p>
           </div>
           
           <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>

           {showRescueBtn && (
             <button 
               onClick={handleForceEnter}
               className="mt-4 px-6 py-3 bg-secondary/10 border border-secondary/30 text-secondary rounded-xl font-bold text-xs uppercase animate-in fade-in slide-in-from-bottom-4"
             >
               Taking too long? Click to Enter
             </button>
           )}
        </div>
      </div>
    );
  }

  if (!user && supabase) {
    return <Login />;
  }

  // Fallback for when user is null but loading is false (rare edge case handled by force enter)
  const currentUser = user || MOCK_USER;

  if (showWelcome && user) {
    return <AuthSuccess user={currentUser} onContinue={() => setShowWelcome(false)} />;
  }

  const renderContent = () => {
    if (viewingProfileId) {
        return <PublicProfile targetUserId={viewingProfileId} currentUserId={currentUser.id} onBack={() => setViewingProfileId(null)} />;
    }

    switch (activeTab) {
      case 'home': return <Dashboard userProfile={currentUser} onStartTournament={() => handleTabChange('tournament')} />;
      case 'discovery': return <Discovery />;
      case 'training': return <Training />;
      case 'rankings': return <Rankings />;
      case 'tournament': return <TournamentLive />;
      case 'clubs': return <Clubs />;
      case 'profile': return <Profile user={currentUser} onUpdate={refreshProfile} onViewProfile={handleViewProfile} onOpenAdmin={() => setActiveTab('admin')} />;
      case 'admin': 
        if (currentUser.role === UserRole.ADMIN) {
            return <AdminDashboard />;
        } else {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-10">
                    <span className="material-symbols-outlined text-6xl text-secondary mb-4">gpp_bad</span>
                    <h1 className="text-3xl font-black mb-2">Access Denied</h1>
                    <p className="text-text-muted">You do not have permission to view the Admin Dashboard.</p>
                    <button onClick={() => setActiveTab('home')} className="mt-6 px-6 py-3 bg-surface-light rounded-xl font-bold">Go Home</button>
                </div>
            );
        }
      default: return <Dashboard userProfile={currentUser} onStartTournament={() => handleTabChange('tournament')} />;
    }
  };

  return (
    <AppShell activeTab={viewingProfileId ? 'profile' : activeTab} setActiveTab={handleTabChange} isAdmin={currentUser.role === UserRole.ADMIN}>
      {renderContent()}
    </AppShell>
  );
};

export default App;
