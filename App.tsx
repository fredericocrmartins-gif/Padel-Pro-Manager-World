
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
import { supabase, getCurrentUserProfile, signOut } from './lib/supabase';
import { UserProfile } from './types';
import { MOCK_USER } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const isMounted = useRef(true);

  // 1. ABSOLUTE SAFETY TIMER (The "Big Hammer")
  // This effect runs independently of any auth logic. 
  // It guarantees the loading screen disappears after 3 seconds, no matter what.
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
        // 1. FAST CHECK: Local Session
        if (supabase) {
            // We use a safe wrapper inside supabase.ts, but standard call here is fine 
            // because the Safety Timer above protects us from hanging.
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                // Definitely logged out
                if (isMounted.current) setIsLoading(false);
                return;
            }
        }

        // 2. FULL CHECK: Get profile data
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

    // 3. Listen for Auth changes
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
      // Demo Mode
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
      case 'clubs':
        return <Clubs />;
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
