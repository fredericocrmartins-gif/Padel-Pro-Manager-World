
import React from 'react';
import { NAV_ITEMS } from '../constants';

interface AppShellProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (id: string) => void;
}

export const AppShell: React.FC<AppShellProps> = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="flex flex-col h-screen bg-background-dark text-white font-body">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-row h-full">
        <aside className="w-64 bg-surface-dark border-r border-border-dark flex flex-col p-6">
          <div className="flex items-center gap-3 text-primary font-display font-bold text-2xl mb-12">
            <span className="material-symbols-outlined text-3xl">sports_tennis</span>
            <span>PadelPro</span>
          </div>
          
          <nav className="flex-1 space-y-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id 
                    ? 'bg-primary text-background-dark font-bold shadow-lg shadow-primary/20' 
                    : 'text-text-muted hover:bg-surface-light hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
            {/* Contextual Tournament Navigation */}
            {activeTab === 'tournament' && (
              <button
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-primary/20 text-primary font-bold border border-primary/20"
              >
                <span className="material-symbols-outlined">stadium</span>
                <span className="font-medium">Live Tournament</span>
              </button>
            )}
          </nav>
          
          <div className="mt-auto pt-6 border-t border-border-dark">
            <button className="flex items-center gap-4 px-4 py-3 text-text-muted hover:text-white transition-colors w-full">
              <span className="material-symbols-outlined">settings</span>
              <span>Settings</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto relative no-scrollbar">
          {children}
        </main>
      </div>

      {/* Mobile App View */}
      <div className="md:hidden flex flex-col h-full relative">
        <header className="h-16 px-6 flex items-center justify-between border-b border-border-dark bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-2 text-primary font-display font-bold text-xl">
            <span className="material-symbols-outlined">sports_tennis</span>
            <span>PadelPro</span>
          </div>
          <button className="relative p-2 text-text-muted hover:text-white transition-colors">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 size-2 bg-secondary rounded-full border border-background-dark"></span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
          {children}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-surface-dark/95 backdrop-blur-md border-t border-border-dark px-6 flex items-center justify-between z-50">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === item.id ? 'text-primary' : 'text-text-muted'
              }`}
            >
              <span className={`material-symbols-outlined ${activeTab === item.id ? 'fill-1' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
