
import React, { useState, useEffect } from 'react';
import { AppShell } from './components/AppShell';
import { Dashboard } from './pages/Dashboard';
import { Discovery } from './pages/Discovery';
import { Training } from './pages/Training';
import { Rankings } from './pages/Rankings';
import { TournamentLive } from './pages/TournamentLive';
import { Login } from './pages/Login';
import { supabase, getCurrentUserProfile, signOut } from './lib/supabase';
import { UserProfile } from './types';
import { MOCK_USER } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auth Effect
  useEffect(() => {
    let mounted = true;

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
        }
      });
      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } else {
      mounted = false;
    }
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
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
  // Current logic: If supabase exists but no user -> Login. If supabase doesn't exist -> Show Mock App.
  const currentUser = user || MOCK_USER;

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
        return (
          <div className="p-10 flex flex-col items-center justify-center h-full text-center animate-in fade-in duration-500">
            <img src={currentUser.avatar} className="size-40 rounded-full border-4 border-primary mb-6" alt="profile"/>
            <h2 className="text-3xl font-black mb-2">{currentUser.name}</h2>
            <p className="text-text-muted mb-8 tracking-[0.3em] font-bold uppercase">{currentUser.role} • {currentUser.location}</p>
            <div className="grid grid-cols-3 gap-8 mb-12">
               <div className="text-center">
                 <p className="text-3xl font-black">{currentUser.stats.matchesPlayed}</p>
                 <p className="text-[10px] font-bold text-text-muted uppercase">Matches</p>
               </div>
               <div className="text-center">
                 <p className="text-3xl font-black">{Math.floor(currentUser.stats.matchesPlayed * (currentUser.stats.winRate / 100))}</p>
                 <p className="text-[10px] font-bold text-text-muted uppercase">Wins</p>
               </div>
               <div className="text-center">
                 <p className="text-3xl font-black">{currentUser.stats.winRate}%</p>
                 <p className="text-[10px] font-bold text-text-muted uppercase">Win %</p>
               </div>
            </div>
            <div className="flex gap-4">
              <button className="px-8 py-3 bg-primary text-background-dark font-black rounded-2xl shadow-lg shadow-primary/20">Edit Profile</button>
              <button 
                onClick={handleSignOut}
                className="px-8 py-3 bg-secondary/10 text-secondary border border-secondary/20 font-black rounded-2xl hover:bg-secondary hover:text-white transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        );
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
