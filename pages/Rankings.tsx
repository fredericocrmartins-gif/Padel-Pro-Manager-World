
import React, { useState } from 'react';
// Import MOCK_USER to provide user data for the leaderboard display
import { MOCK_RANKINGS, MOCK_USER } from '../constants';

export const Rankings: React.FC = () => {
  const [tab, setTab] = useState<'community' | 'official'>('community');

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col items-center text-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Global Leaderboards</h1>
        <div className="flex h-12 w-64 items-center justify-center rounded-2xl bg-surface-dark p-1 shadow-inner border border-border-dark">
          <button
            onClick={() => setTab('community')}
            className={`flex-1 h-full rounded-xl text-sm font-bold transition-all ${
              tab === 'community' ? 'bg-primary text-background-dark shadow-md' : 'text-text-muted hover:text-white'
            }`}
          >
            Community
          </button>
          <button
            onClick={() => setTab('official')}
            className={`flex-1 h-full rounded-xl text-sm font-bold transition-all ${
              tab === 'official' ? 'bg-primary text-background-dark shadow-md' : 'text-text-muted hover:text-white'
            }`}
          >
            FIP Official
          </button>
        </div>
      </header>

      {/* Podium for top 3 */}
      <section className="flex items-end justify-center gap-4 py-8">
        {/* Silver */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <img src={MOCK_RANKINGS[1].avatar} className="size-16 rounded-full border-4 border-gray-400/30" alt="rank2"/>
            <div className="absolute -bottom-1 -right-1 size-6 bg-gray-400 rounded-full flex items-center justify-center text-xs font-bold text-background-dark">2</div>
          </div>
          <p className="font-bold text-sm">{MOCK_RANKINGS[1].name}</p>
        </div>
        
        {/* Gold */}
        <div className="flex flex-col items-center gap-4 -translate-y-4">
          <div className="relative">
             <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-yellow-500 drop-shadow-glow animate-bounce">
               <span className="material-symbols-outlined text-4xl fill-1">workspace_premium</span>
             </div>
            <img src={MOCK_RANKINGS[0].avatar} className="size-24 rounded-full border-4 border-primary shadow-2xl shadow-primary/20" alt="rank1"/>
            <div className="absolute -bottom-2 -right-2 size-8 bg-primary rounded-full flex items-center justify-center text-lg font-bold text-background-dark">1</div>
          </div>
          <div className="text-center">
            <p className="font-black text-xl leading-none">{MOCK_RANKINGS[0].name}</p>
            <p className="text-primary text-sm font-bold mt-1">2,840 pts</p>
          </div>
        </div>

        {/* Bronze */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <img src={MOCK_RANKINGS[2].avatar} className="size-16 rounded-full border-4 border-orange-400/30" alt="rank3"/>
            <div className="absolute -bottom-1 -right-1 size-6 bg-orange-400 rounded-full flex items-center justify-center text-xs font-bold text-background-dark">3</div>
          </div>
          <p className="font-bold text-sm">{MOCK_RANKINGS[2].name}</p>
        </div>
      </section>

      {/* Full List */}
      <section className="bg-surface-dark rounded-3xl border border-border-dark overflow-hidden">
        <div className="p-6 border-b border-border-dark flex items-center justify-between bg-surface-dark/50">
          <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Rankings Table</span>
          <div className="flex items-center gap-2">
             <button className="material-symbols-outlined text-text-muted text-xl p-2 hover:bg-background-dark rounded-lg transition-colors">filter_list</button>
             <button className="material-symbols-outlined text-text-muted text-xl p-2 hover:bg-background-dark rounded-lg transition-colors">search</button>
          </div>
        </div>
        
        <div className="divide-y divide-border-dark">
          {MOCK_RANKINGS.map((player) => (
            <div key={player.rank} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-light transition-colors group cursor-pointer">
              <span className="w-8 font-black text-text-muted group-hover:text-primary transition-colors">{player.rank.toString().padStart(2, '0')}</span>
              <img src={player.avatar} className="size-10 rounded-full" alt="avatar"/>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{player.name}</p>
                <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{player.country === 'ES' ? 'Spain' : 'Argentina'}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">{player.points.toLocaleString()} pts</p>
                <span className={`material-symbols-outlined text-sm ${player.trend === 'up' ? 'text-green-500' : player.trend === 'down' ? 'text-secondary' : 'text-gray-500'}`}>
                  {player.trend === 'up' ? 'trending_up' : player.trend === 'down' ? 'trending_down' : 'remove'}
                </span>
              </div>
            </div>
          ))}
          
          {/* Your position */}
          <div className="bg-primary/5 px-6 py-4 flex items-center gap-4 border-t-2 border-primary/20">
              <span className="w-8 font-black text-primary">42</span>
              {/* Correctly referencing MOCK_USER now that it is imported */}
              <img src={MOCK_USER.avatar} className="size-10 rounded-full border-2 border-primary" alt="me"/>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">You (Alex Rivera)</p>
                <p className="text-[10px] text-primary/70 uppercase font-bold tracking-widest">Rising Star</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-primary">1,420 pts</p>
                <span className="material-symbols-outlined text-green-500 text-sm">trending_up</span>
              </div>
          </div>
        </div>
      </section>
    </div>
  );
};
