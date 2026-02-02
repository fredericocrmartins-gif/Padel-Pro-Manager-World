
import React, { useState, useEffect } from 'react';
import { MOCK_DRILLS, MOCK_USER } from '../constants';
import { TrainingExercise, AIPersonalPlan, TrainingLog } from '../types';
import { generateTrainingPlan } from '../lib/geminiService';
import { saveTrainingLog, getTrainingLogs } from '../lib/supabase';

export const Training: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'library' | 'plans'>('dashboard');
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [aiPlan, setAiPlan] = useState<AIPersonalPlan[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDrill, setSelectedDrill] = useState<TrainingExercise | null>(null);
  
  // Logging state
  const [logModal, setLogModal] = useState<TrainingExercise | null>(null);
  const [logRpe, setLogRpe] = useState(5);
  const [logNotes, setLogNotes] = useState('');
  const [logDuration, setLogDuration] = useState(15);
  const [isLogging, setIsLogging] = useState(false);
  const [userLogs, setUserLogs] = useState<TrainingLog[]>([]);

  useEffect(() => {
    getTrainingLogs(MOCK_USER.id).then(setUserLogs);
  }, []);

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    const plan = await generateTrainingPlan(MOCK_USER);
    if (plan) setAiPlan(plan);
    setIsGenerating(false);
    setView('plans');
  };

  const handleLogSubmit = async () => {
    if (!logModal) return;
    setIsLogging(true);
    await saveTrainingLog({
      exerciseId: logModal.id,
      userId: MOCK_USER.id,
      duration: logDuration,
      rpe: logRpe,
      notes: logNotes
    });
    const updated = await getTrainingLogs(MOCK_USER.id);
    setUserLogs(updated);
    setIsLogging(false);
    setLogModal(null);
    setLogNotes('');
    alert('Workout logged!');
  };

  const filteredDrills = MOCK_DRILLS.filter(d => !filterCat || d.category === filterCat);

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black tracking-tight">Training Lab</h1>
           <p className="text-text-muted font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Personal Growth & Technique</p>
        </div>
        
        <div className="flex bg-surface-dark p-1.5 rounded-2xl border border-border-dark shadow-inner">
           {(['dashboard', 'library', 'plans'] as const).map(t => (
             <button
               key={t}
               onClick={() => setView(t)}
               className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${view === t ? 'bg-primary text-background-dark shadow-md' : 'text-text-muted hover:text-white'}`}
             >
               {t}
             </button>
           ))}
        </div>
      </header>

      {view === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           {/* Weekly Progress */}
           <div className="lg:col-span-2 space-y-8">
              <section className="bg-surface-dark border border-border-dark rounded-[3rem] p-8 overflow-hidden relative group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                 <h3 className="text-xl font-black mb-6">Weekly Activity</h3>
                 <div className="grid grid-cols-7 gap-4 h-32 items-end">
                    {[30, 45, 0, 60, 20, 90, 15].map((val, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div 
                          className={`w-full rounded-t-xl transition-all duration-1000 ${val > 40 ? 'bg-primary' : 'bg-surface-light'}`}
                          style={{ height: `${(val / 90) * 100}%` }}
                        />
                        <span className="text-[10px] font-bold text-text-muted">MTWTFSS"[i]</span>
                      </div>
                    ))}
                 </div>
              </section>

              <section className="space-y-4">
                 <div className="flex items-center justify-between">
                   <h3 className="text-xl font-black">History</h3>
                   <span className="text-xs text-text-muted font-bold uppercase">{userLogs.length} Sessions</span>
                 </div>
                 <div className="space-y-3">
                   {userLogs.slice().reverse().map(log => {
                     const drill = MOCK_DRILLS.find(d => d.id === log.exerciseId);
                     return (
                       <div key={log.id} className="bg-surface-dark/50 border border-border-dark p-5 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all">
                          <div className="flex items-center gap-4">
                             <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
                               {log.rpe}
                             </div>
                             <div>
                               <p className="font-bold">{drill?.title || 'Custom Session'}</p>
                               <p className="text-[10px] text-text-muted font-bold uppercase">{new Date(log.completedAt).toLocaleDateString()}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="font-black text-sm">{log.duration} min</p>
                             <p className="text-[10px] text-text-muted font-bold uppercase">Duration</p>
                          </div>
                       </div>
                     );
                   })}
                 </div>
              </section>
           </div>

           {/* Quick Actions & Stats */}
           <div className="space-y-8">
              <button 
                onClick={handleGeneratePlan}
                disabled={isGenerating}
                className="w-full bg-primary p-8 rounded-[2.5rem] flex flex-col items-start gap-4 shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group"
              >
                <div className="absolute top-4 right-4 animate-spin-slow opacity-20 group-hover:opacity-40 transition-opacity">
                   <span className="material-symbols-outlined text-6xl text-background-dark">auto_awesome</span>
                </div>
                <div className="bg-background-dark/20 p-3 rounded-2xl">
                   <span className="material-symbols-outlined text-background-dark">psychology</span>
                </div>
                <div className="text-left">
                  <h4 className="text-background-dark text-2xl font-black leading-tight">AI Plan<br/>Generator</h4>
                  <p className="text-background-dark/60 text-xs font-bold mt-2 uppercase tracking-widest">Powered by Gemini 3</p>
                </div>
              </button>

              <div className="bg-surface-dark border border-border-dark rounded-[2.5rem] p-8">
                 <h4 className="font-black mb-6 uppercase tracking-widest text-[10px] text-text-muted">Focus Areas</h4>
                 <div className="space-y-4">
                    {[
                      { label: 'Volleys', val: 75 },
                      { label: 'Smash Power', val: 40 },
                      { label: 'Court Movement', val: 90 },
                    ].map(f => (
                      <div key={f.label} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                           <span>{f.label}</span>
                           <span className="text-primary">{f.val}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-background-dark rounded-full overflow-hidden">
                           <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${f.val}%` }}></div>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {view === 'library' && (
        <div className="space-y-10">
           <section className="flex gap-3 overflow-x-auto no-scrollbar py-2">
              {['Technique', 'Fitness', 'Mobility', 'Tactical'].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setFilterCat(filterCat === cat ? null : cat)}
                  className={`shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    filterCat === cat ? 'bg-primary text-background-dark border-primary' : 'bg-surface-dark text-text-muted border-border-dark hover:border-text-muted'
                  }`}
                >
                  {cat}
                </button>
              ))}
           </section>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredDrills.map(drill => (
                <div 
                  key={drill.id} 
                  className="bg-surface-dark border border-border-dark rounded-[2.5rem] overflow-hidden group hover:border-primary transition-all flex flex-col"
                >
                   <div className="h-48 relative overflow-hidden">
                      <img src={drill.thumbnail} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 opacity-60 group-hover:opacity-100" alt="drill"/>
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-transparent to-transparent"></div>
                      <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
                         <span className="bg-primary/20 backdrop-blur-md text-primary text-[8px] font-black uppercase px-2 py-1 rounded border border-primary/30">{drill.difficulty}</span>
                         <div className="flex items-center gap-1 text-[8px] font-black uppercase text-text-muted bg-surface-dark/80 px-2 py-1 rounded border border-border-dark">
                           <span className="material-symbols-outlined text-[10px]">schedule</span>
                           {drill.duration}m
                         </div>
                      </div>
                   </div>
                   <div className="p-8 flex-1 flex flex-col">
                      <h4 className="text-xl font-black mb-2">{drill.title}</h4>
                      <p className="text-text-muted text-xs leading-relaxed mb-8 flex-1">{drill.description}</p>
                      <div className="flex gap-3">
                         <button className="flex-1 py-4 bg-background-dark border border-border-dark rounded-2xl text-[10px] font-black uppercase hover:bg-surface-light transition-colors">Video</button>
                         <button 
                           onClick={() => setLogModal(drill)}
                           className="flex-1 py-4 bg-primary text-background-dark rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                         >
                           Log Session
                         </button>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {view === 'plans' && (
        <div className="space-y-8 max-w-4xl mx-auto">
          {isGenerating ? (
            <div className="py-20 flex flex-col items-center justify-center text-center animate-pulse">
               <span className="material-symbols-outlined text-7xl text-primary mb-4 animate-spin-slow">auto_awesome</span>
               <h3 className="text-3xl font-black">AI is Curating Your Schedule</h3>
               <p className="text-text-muted mt-2">Analyzing your skill level and goals...</p>
            </div>
          ) : !aiPlan ? (
            <div className="py-20 text-center space-y-6">
               <h3 className="text-2xl font-black">No active plan found</h3>
               <button onClick={handleGeneratePlan} className="px-10 py-5 bg-primary text-background-dark font-black rounded-[2rem] shadow-2xl shadow-primary/20 uppercase tracking-widest text-xs">Generate Now</button>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-10 duration-700">
               <div className="flex items-center justify-between bg-primary/10 border border-primary/20 p-8 rounded-[2.5rem] mb-10">
                  <div>
                    <h3 className="text-2xl font-black text-primary">Your 7-Day Protocol</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary/70">Generated for Level {MOCK_USER.skillLevel}</p>
                  </div>
                  <button onClick={handleGeneratePlan} className="size-14 rounded-full bg-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-background-dark transition-all">
                    <span className="material-symbols-outlined">refresh</span>
                  </button>
               </div>
               
               {aiPlan.map((day, i) => (
                 <div key={i} className="bg-surface-dark border border-border-dark rounded-[2.5rem] p-8 flex flex-col md:flex-row gap-8 hover:border-primary/40 transition-all group">
                    <div className="md:w-32 flex flex-col items-center justify-center border-r border-border-dark pr-8">
                       <span className="text-[10px] font-black uppercase text-text-muted tracking-[0.3em] mb-1">Day</span>
                       <span className="text-4xl font-black text-primary group-hover:scale-125 transition-transform">{day.day.split(' ')[1] || (i+1)}</span>
                    </div>
                    <div className="flex-1 space-y-4">
                       <div className="flex items-center justify-between">
                          <h4 className="text-xl font-black">{day.activity}</h4>
                          <span className="text-[10px] font-black uppercase text-primary/80 bg-primary/5 px-2 py-1 rounded border border-primary/10">{day.focus}</span>
                       </div>
                       <div className="flex flex-wrap gap-2">
                          {day.drills.map((d, j) => (
                            <span key={j} className="px-3 py-1.5 bg-background-dark border border-border-dark rounded-xl text-[10px] font-bold text-text-muted">{d}</span>
                          ))}
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      )}

      {/* Log Session Modal */}
      {logModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background-dark/90 backdrop-blur-md animate-in fade-in zoom-in duration-300">
           <div className="bg-surface-dark border border-border-dark w-full max-w-xl rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
              
              <div className="flex items-center justify-between mb-8">
                 <div>
                   <h3 className="text-3xl font-black">Log Session</h3>
                   <p className="text-text-muted text-xs font-bold uppercase tracking-widest mt-1">{logModal.title}</p>
                 </div>
                 <button onClick={() => setLogModal(null)} className="material-symbols-outlined text-text-muted hover:text-white transition-colors">close</button>
              </div>

              <div className="space-y-8">
                 <div className="space-y-4">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                       <span>Intensity (RPE)</span>
                       <span className="text-primary">{logRpe}/10</span>
                    </div>
                    <input 
                      type="range" min="1" max="10" value={logRpe}
                      onChange={(e) => setLogRpe(parseInt(e.target.value))}
                      className="w-full accent-primary bg-background-dark h-3 rounded-full outline-none"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Duration (min)</label>
                       <input 
                        type="number" value={logDuration}
                        onChange={(e) => setLogDuration(parseInt(e.target.value))}
                        className="w-full bg-background-dark border border-border-dark rounded-2xl p-4 font-black text-xl outline-none focus:border-primary transition-all"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Session Notes</label>
                    <textarea 
                      placeholder="Felt great on the Bandeja today..."
                      value={logNotes}
                      onChange={(e) => setLogNotes(e.target.value)}
                      className="w-full h-24 bg-background-dark border border-border-dark rounded-2xl p-4 text-sm outline-none focus:border-primary transition-all resize-none"
                    />
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button onClick={() => setLogModal(null)} className="flex-1 py-5 bg-background-dark border border-border-dark font-black rounded-2xl uppercase tracking-widest text-xs">Cancel</button>
                    <button 
                      onClick={handleLogSubmit}
                      disabled={isLogging}
                      className="flex-1 py-5 bg-primary text-background-dark font-black rounded-2xl shadow-lg shadow-primary/20 uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isLogging ? 'Saving...' : 'Complete Workout'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
