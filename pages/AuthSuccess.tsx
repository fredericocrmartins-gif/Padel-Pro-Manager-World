
import React from 'react';
import { UserProfile } from '../types';

interface AuthSuccessProps {
  user: UserProfile;
  onContinue: () => void;
}

export const AuthSuccess: React.FC<AuthSuccessProps> = ({ user, onContinue }) => {
  return (
    <div className="h-screen w-screen bg-background-dark flex items-center justify-center p-6 relative overflow-hidden animate-in fade-in duration-700">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[128px]"></div>
      </div>

      <div className="max-w-md w-full bg-surface-dark/80 backdrop-blur-xl border border-border-dark rounded-[3rem] p-10 text-center shadow-2xl relative z-10">
        
        {/* Animated Icon */}
        <div className="mb-8 relative inline-block">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
          <div className="size-24 bg-background-dark rounded-full border-4 border-primary flex items-center justify-center relative z-10 mx-auto">
            <span className="material-symbols-outlined text-5xl text-primary animate-in zoom-in duration-500">check_circle</span>
          </div>
          <div className="absolute -top-2 -right-2 text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎾</div>
          <div className="absolute -bottom-2 -left-2 text-2xl animate-bounce" style={{ animationDelay: '0.5s' }}>✨</div>
        </div>

        <h1 className="text-3xl font-black mb-2 bg-gradient-to-r from-white to-text-muted bg-clip-text text-transparent">
          Account Verified!
        </h1>
        
        <p className="text-text-muted font-medium mb-8">
          Welcome to the court, <span className="text-primary font-bold">{user.name}</span>.<br/>
          Your profile is active and ready for action.
        </p>

        <div className="space-y-4">
          <div className="bg-background-dark/50 rounded-2xl p-4 flex items-center gap-4 border border-border-dark text-left">
             <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-sm">lock_open</span>
             </div>
             <div>
                <p className="text-sm font-bold text-white">Full Access Unlocked</p>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Rankings, Tournaments & AI Coach</p>
             </div>
          </div>
        </div>

        <button 
          onClick={onContinue}
          className="w-full mt-10 py-5 bg-primary text-background-dark font-black rounded-2xl text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group"
        >
          Enter PadelPro
          <span className="material-symbols-outlined align-middle ml-2 text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>

      </div>
    </div>
  );
};
