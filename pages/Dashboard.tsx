
import React from 'react';
import { UserProfile } from '../types';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from 'recharts';

const data = [
  { name: 'M', value: 40 },
  { name: 'T', value: 70 },
  { name: 'W', value: 30 },
  { name: 'T', value: 90 },
  { name: 'F', value: 50 },
  { name: 'S', value: 20 },
  { name: 'S', value: 0 },
];

interface DashboardProps {
  userProfile: UserProfile;
  onStartTournament?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userProfile, onStartTournament }) => {
  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-text-muted text-sm uppercase tracking-[0.2em] font-bold">Welcome Back</h2>
          <h1 className="text-3xl font-bold mt-1">{userProfile.name}</h1>
        </div>
        <div className="flex -space-x-3">
          {[1, 2, 3].map(i => (
            <img 
              key={i}
              src={`https://picsum.photos/seed/friend${i}/100/100`} 
              className="size-10 rounded-full border-2 border-background-dark" 
              alt="friend"
            />
          ))}
          <div className="size-10 rounded-full border-2 border-background-dark bg-surface-light flex items-center justify-center text-[10px] font-bold">
            +12
          </div>
        </div>
      </header>

      {/* Next Match Card */}
      <section className="relative overflow-hidden rounded-3xl group">
        <div className="absolute inset-0 bg-gradient-to-tr from-background-dark via-background-dark/40 to-primary/20 z-10"></div>
        <img 
          src="https://picsum.photos/seed/court/800/400" 
          className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-700" 
          alt="court"
        />
        <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end">
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-2">
            <span className="material-symbols-outlined text-sm">event</span>
            Today, 18:00
          </div>
          <h3 className="text-2xl font-bold mb-4">Vs. The Padel Kings</h3>
          <button className="w-full py-3 bg-primary text-background-dark font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            Confirm Attendance
          </button>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-dark rounded-3xl p-6 border border-border-dark flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Weekly Load</h3>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">Last 7 Days</span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#90cbbc', fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(37, 244, 192, 0.05)' }}
                  contentStyle={{ backgroundColor: '#18302b', border: '1px solid #31685a', borderRadius: '12px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.value > 80 ? '#25f4c0' : '#31685a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-dark rounded-3xl p-6 border border-border-dark relative overflow-hidden">
             <div className="absolute -top-4 -right-4 size-24 bg-primary/5 rounded-full blur-2xl"></div>
             <p className="text-text-muted text-xs font-bold uppercase mb-2">Win Rate</p>
             <h4 className="text-4xl font-bold text-primary tracking-tighter">{userProfile.stats.winRate}%</h4>
             <div className="w-full h-1.5 bg-background-dark rounded-full mt-4 overflow-hidden">
               <div className="bg-primary h-full w-[68%]"></div>
             </div>
          </div>
          <div className="bg-surface-dark rounded-3xl p-6 border border-border-dark">
             <p className="text-text-muted text-xs font-bold uppercase mb-2">ELO Rating</p>
             <div className="flex items-baseline gap-2">
               <h4 className="text-4xl font-bold tracking-tighter">{userProfile.stats.elo}</h4>
               <span className="text-xs font-bold text-primary">+{userProfile.stats.ytdImprovement}</span>
             </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-surface-dark border border-border-dark hover:border-primary/50 transition-all group"
          >
            <div className={`size-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined text-2xl">edit_calendar</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Record Match</span>
          </button>
          
          <button 
            onClick={onStartTournament}
            className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-surface-dark border border-border-dark hover:border-primary/50 transition-all group"
          >
            <div className={`size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined text-2xl">trophy</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Play Cards</span>
          </button>

          <button 
            className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-surface-dark border border-border-dark hover:border-primary/50 transition-all group"
          >
            <div className={`size-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined text-2xl">groups</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Find Group</span>
          </button>

          <button 
            className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-surface-dark border border-border-dark hover:border-primary/50 transition-all group"
          >
            <div className={`size-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined text-2xl">person_add</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Invite Friends</span>
          </button>
        </div>
      </section>
    </div>
  );
};
