
import React, { useState, useEffect } from 'react';
import { AppShell } from './components/AppShell';
import { Dashboard } from './pages/Dashboard';
import { Discovery } from './pages/Discovery';
import { Training } from './pages/Training';
import { Rankings } from './pages/Rankings';
import { TournamentLive } from './pages/TournamentLive';
import { Login } from './pages/Login';
import { AuthSuccess } from './pages/AuthSuccess';
import { Profile } from './pages/Profile';
import { supabase, getCurrentUserProfile, signOut } from './lib/supabase';
import { UserProfile } from './types';
import { MOCK_USER } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  // Auth Effect
  useEffect(() => {
    let mounted = true;

    // Check URL for Supabase Email Verification markers (access_token + type=signup/recovery)
    // We check this ON MOUNT before Supabase client strips the hash.
    const hash = window.location.hash;
    if (hash && (hash.includes('type=signup') || hash.includes('type=recovery') || hash.includes('type=magiclink'))) {
      setShowWelcome(true);
    }

    // Safety timeout: If auth check hangs for more than 6 seconds, force stop loading
    const safetyTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn("Forcing loading completion due to timeout");
        setIsLoading(false);
      }
    }, 6000);

    // 1. Check initial session
    const checkUser = async () => {
      try {
        const profile = await getCurrentUserProfile();
        if (mounted) {
          setUser(profile);
        }
      } catch (error) {
        console.error("Failed to check user session:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    checkUser();

    // 2. Listen for Auth changes (Sign In / Sign Out)
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const profile = await getCurrentUserProfile();
          if (mounted) setUser(profile);
        } else if (event === 'SIGNED_OUT') {
          if (mounted) setUser(null);
          setShowWelcome(false);
        }
      });
      return () => {
        mounted = false;
        clearTimeout(safetyTimeout);
        subscription.unsubscribe();
      };
    } else {
      // If no supabase, clear timeout immediately as checkUser will finish instantly (returning Mock)
      return () => {
         mounted = false;
         clearTimeout(safetyTimeout);
      };
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

  // Fallback if supabase is not configured, we might show MOCK_USER or still show login if desired.
  const currentUser = user || MOCK_USER;

  // If user just verified email, show the celebration screen
  if (showWelcome && user) {
    return <AuthSuccess user={currentUser} onContinue={() => setShowWelcome(false)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard userProfile={currentUser} onStartTournament={() => setActiveTab('tournament')} />;
      case 'discovery':
        return <Discovery />;
      case 'training':
        return <Training />;
      case 'rankings':
        return <Rankings />;
      case 'tournament':
        return <TournamentLive />;
      case 'profile':
        return <Profile user={currentUser} onUpdate={refreshProfile} />;
      default:
        return <Dashboard userProfile={currentUser} onStartTournament={() => setActiveTab('tournament')} />;
    }
  };

  return (
    <AppShell activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </AppShell>
  );
};

export default App;
