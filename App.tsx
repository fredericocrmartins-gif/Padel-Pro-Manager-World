
import React, { useState } from 'react';
import { AppShell } from './components/AppShell';
import { Dashboard } from './pages/Dashboard';
import { Discovery } from './pages/Discovery';
import { Training } from './pages/Training';
import { Rankings } from './pages/Rankings';
import { TournamentLive } from './pages/TournamentLive';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard onStartTournament={() => setActiveTab('tournament')} />;
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
          <div className="p-10 flex flex-col items-center justify-center h-full text-center">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" className="size-40 rounded-full border-4 border-primary mb-6" alt="profile"/>
            <h2 className="text-3xl font-black mb-2">Alex Rivera</h2>
            <p className="text-text-muted mb-8 tracking-[0.3em] font-bold uppercase">Organizer • Miami Padel Club</p>
            <div className="grid grid-cols-3 gap-8 mb-12">
               <div className="text-center">
                 <p className="text-3xl font-black">142</p>
                 <p className="text-[10px] font-bold text-text-muted uppercase">Matches</p>
               </div>
               <div className="text-center">
                 <p className="text-3xl font-black">98</p>
                 <p className="text-[10px] font-bold text-text-muted uppercase">Wins</p>
               </div>
               <div className="text-center">
                 <p className="text-3xl font-black">69%</p>
                 <p className="text-[10px] font-bold text-text-muted uppercase">Win %</p>
               </div>
            </div>
            <div className="flex gap-4">
              <button className="px-8 py-3 bg-primary text-background-dark font-black rounded-2xl shadow-lg shadow-primary/20">Edit Profile</button>
              <button className="px-8 py-3 bg-surface-dark border border-border-dark font-black rounded-2xl hover:bg-surface-light">Settings</button>
            </div>
          </div>
        );
      default:
        return <Dashboard onStartTournament={() => setActiveTab('tournament')} />;
    }
  };

  return (
    <AppShell activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </AppShell>
  );
};

export default App;
