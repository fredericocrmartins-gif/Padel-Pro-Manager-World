
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
import { AdminDashboard } from './pages/AdminDashboard'; // Updated Import
import { supabase, getCurrentUserProfile, signOut } from './lib/supabase';
import { UserProfile, UserRole } from './types';
import { MOCK_USER } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const isMounted = useRef(true);

  // 1. ABSOLUTE SAFETY TIMER (The "Big Hammer")
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMounted.current) {
        setIsLoading((prev) => {
          if (prev) console.warn("⚠️ PadelPro: Forced app load via safety timer");
          return false;
        });
      }
    }, 3000);

    return () => { clearTimeout(timer); };
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
        }

        const profile = await getCurrentUserProfile();
        
        if (isMounted.current) {
          if (profile) setUser(profile);
          setIsLoading(false);
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
           if (!user) {
             const profile = await getCurrentUserProfile();
             if (isMounted.current && profile) setUser(profile);
           }
        } else if (event === 'SIGNED_OUT') {
          if (isMounted.current) {
             setUser(null);
             setShowWelcome(false);
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

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-background-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <div className="text-primary font-black text-2xl animate-pulse tracking-widest">LOADING PADELPRO</div>
           <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!user && supabase) {
    return <Login />;
  }

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
      case 'profile': return <Profile user={currentUser} onUpdate={refreshProfile} onViewProfile={handleViewProfile} />;
      case 'admin': 
        // Security Check: Only allow ADMIN role to render the component
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
