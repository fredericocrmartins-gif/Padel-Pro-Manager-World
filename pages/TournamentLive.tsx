
import React, { useState, useEffect } from 'react';
import { TournamentMatch, TournamentPair, TournamentStanding, MatchResult } from '../types';
import { calculateStandings, generateRound2 } from '../lib/tournamentLogic';
import { MOCK_USER } from '../constants';

const INITIAL_PAIRS: TournamentPair[] = [
  { id: 'pA', name: 'Pair Ace', players: [MOCK_USER, { ...MOCK_USER, id: 'u2', name: 'Mark S.' }] },
  { id: 'pK', name: 'Pair King', players: [{ ...MOCK_USER, id: 'u3', name: 'John D.' }, { ...MOCK_USER, id: 'u4', name: 'Sarah L.' }] },
  { id: 'pQ', name: 'Pair Queen', players: [{ ...MOCK_USER, id: 'u5', name: 'Elena R.' }, { ...MOCK_USER, id: 'u6', name: 'Dave B.' }] },
  { id: 'pJ', name: 'Pair Jack', players: [{ ...MOCK_USER, id: 'u7', name: 'Tom H.' }, { ...MOCK_USER, id: 'u8', name: 'Anna P.' }] },
];

export const TournamentLive: React.FC = () => {
  const [currentRound, setCurrentRound] = useState(1);
  const [matches, setMatches] = useState<TournamentMatch[]>([
    { id: 'm-r1-c1', round: 1, court: 1, teamA: INITIAL_PAIRS[0], teamB: INITIAL_PAIRS[1] },
    { id: 'm-r1-c2', round: 1, court: 2, teamA: INITIAL_PAIRS[2], teamB: INITIAL_PAIRS[3] },
  ]);
  const [standings, setStandings] = useState<TournamentStanding[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null);
  const [scoreEntry, setScoreEntry] = useState({ scoreA: 0, scoreB: 0, goldenPoint: false });

  useEffect(() => {
    setStandings(calculateStandings(matches, INITIAL_PAIRS));
  }, [matches]);

  const handleResultSubmit = () => {
    if (!selectedMatch) return;

    const result: MatchResult = {
      scoreA: scoreEntry.scoreA,
      scoreB: scoreEntry.scoreB,
      isGoldenPoint: scoreEntry.goldenPoint,
      winner: scoreEntry.scoreA > scoreEntry.scoreB ? 'teamA' : 'teamB'
    };

    const newMatches = matches.map(m => m.id === selectedMatch.id ? { ...m, result } : m);
    setMatches(newMatches);
    setSelectedMatch(null);
    setScoreEntry({ scoreA: 0, scoreB: 0, goldenPoint: false });

    // Auto-generate Round 2 if R1 is done
    const r1Matches = newMatches.filter(m => m.round === 1);
    if (currentRound === 1 && r1Matches.every(m => m.result)) {
      const r2 = generateRound2(r1Matches);
      setMatches([...newMatches, ...r2]);
      setCurrentRound(2);
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.3em] mb-2">
            <span className="material-symbols-outlined text-sm">stadium</span>
            Weekly Cards Circuit
          </div>
          <h1 className="text-4xl font-black">Friday Night 8-Mixer</h1>
        </div>
        
        <div className="flex gap-2">
          {[1, 2, 3].map(r => (
            <div 
              key={r}
              className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${
                currentRound === r ? 'bg-primary text-background-dark border-primary' : 'bg-surface-dark text-text-muted border-border-dark'
              }`}
            >
              ROUND {r}
            </div>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Courts View */}
        <div className="lg:col-span-2 space-y-8">
           <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black">Live Courts</h2>
              <span className="text-xs text-text-muted font-bold uppercase tracking-widest animate-pulse">Live Progression</span>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {[1, 2].map(courtNum => {
               const match = matches.find(m => m.round === currentRound && m.court === courtNum);
               return (
                 <div key={courtNum} className="relative group">
                    <div className="absolute -top-3 -left-3 size-10 bg-primary/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-primary font-black border border-primary/30 z-10 shadow-lg">
                      {courtNum}
                    </div>
                    
                    <div className="bg-surface-dark border border-border-dark rounded-[2.5rem] p-8 transition-all hover:border-primary/50 overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                      
                      {!match ? (
                        <div className="h-40 flex flex-col items-center justify-center text-text-muted gap-2 opacity-50">
                           <span className="material-symbols-outlined text-4xl">lock</span>
                           <span className="text-[10px] font-black uppercase tracking-widest">Waiting for round 1</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col gap-6 relative z-10">
                            <div className={`flex items-center justify-between p-4 rounded-2xl transition-all ${match.result?.winner === 'teamA' ? 'bg-primary/10 border border-primary/20' : 'bg-background-dark/50'}`}>
                               <div className="flex flex-col">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Team A</span>
                                 <span className="font-black text-xl">{match.teamA.name}</span>
                               </div>
                               {match.result && <span className="text-3xl font-black">{match.result.scoreA}</span>}
                            </div>

                            <div className="flex items-center justify-center relative">
                               <div className="w-full h-px bg-border-dark"></div>
                               <span className="absolute px-4 bg-surface-dark text-[10px] font-black text-text-muted">VS</span>
                            </div>

                            <div className={`flex items-center justify-between p-4 rounded-2xl transition-all ${match.result?.winner === 'teamB' ? 'bg-primary/10 border border-primary/20' : 'bg-background-dark/50'}`}>
                               <div className="flex flex-col">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Team B</span>
                                 <span className="font-black text-xl">{match.teamB.name}</span>
                               </div>
                               {match.result && <span className="text-3xl font-black">{match.result.scoreB}</span>}
                            </div>
                          </div>

                          <button 
                            disabled={!!match.result}
                            onClick={() => setSelectedMatch(match)}
                            className={`w-full mt-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                              match.result ? 'bg-surface-light text-text-muted cursor-default' : 'bg-primary text-background-dark hover:scale-[1.02] shadow-lg shadow-primary/20'
                            }`}
                          >
                            {match.result ? 'Match Finished' : 'Enter Result'}
                          </button>
                        </>
                      )}
                    </div>
                 </div>
               );
             })}
           </div>
        </div>

        {/* Sidebar Standings */}
        <div className="bg-surface-dark/50 border border-border-dark rounded-[2.5rem] p-8 flex flex-col">
           <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-primary">leaderboard</span>
              <h2 className="text-xl font-black uppercase tracking-tighter">Current Standings</h2>
           </div>

           <div className="space-y-4 flex-1">
              {standings.map((s, idx) => (
                <div key={s.pairId} className="flex items-center gap-4 p-4 bg-background-dark/50 rounded-2xl border border-border-dark/30 group hover:border-primary/40 transition-all">
                  <span className={`text-xl font-black w-6 ${idx === 0 ? 'text-primary' : 'text-text-muted'}`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black truncate">{s.pairName}</p>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">W:{s.wins} | D:{s.diff > 0 ? `+${s.diff}` : s.diff}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black">{s.pointsFor}</p>
                    <p className="text-[8px] text-text-muted font-black uppercase">Points</p>
                  </div>
                </div>
              ))}
           </div>

           <div className="mt-8 pt-8 border-t border-border-dark flex flex-col gap-4">
              <div className="flex justify-between text-[10px] font-black uppercase text-text-muted tracking-widest px-2">
                 <span>Tournament Status</span>
                 <span className="text-primary">{currentRound === 3 ? 'Final Phase' : `Round ${currentRound}/3`}</span>
              </div>
              <div className="w-full h-1.5 bg-background-dark rounded-full overflow-hidden">
                 <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${(currentRound / 3) * 100}%` }}></div>
              </div>
           </div>
        </div>
      </div>

      {/* Result Entry Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background-dark/90 backdrop-blur-md animate-in fade-in zoom-in duration-300">
           <div className="bg-surface-dark border border-border-dark w-full max-w-xl rounded-[3rem] p-10 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
              
              <div className="flex items-center justify-between mb-10">
                 <div>
                   <h3 className="text-3xl font-black">Record Result</h3>
                   <p className="text-text-muted text-xs font-bold uppercase tracking-widest mt-1">Court {selectedMatch.court} • Round {selectedMatch.round}</p>
                 </div>
                 <button onClick={() => setSelectedMatch(null)} className="material-symbols-outlined text-text-muted hover:text-white transition-colors">close</button>
              </div>

              <div className="flex items-center justify-between gap-10 mb-10">
                 {/* Team A Entry */}
                 <div className="flex-1 flex flex-col items-center gap-4">
                    <div className="size-20 bg-background-dark rounded-[2rem] flex items-center justify-center text-4xl font-black border border-border-dark">
                      <input 
                        type="number" 
                        value={scoreEntry.scoreA} 
                        onChange={(e) => setScoreEntry({ ...scoreEntry, scoreA: parseInt(e.target.value) || 0 })}
                        className="w-full h-full bg-transparent text-center outline-none text-primary"
                      />
                    </div>
                    <span className="font-black text-center">{selectedMatch.teamA.name}</span>
                 </div>

                 <span className="text-2xl font-black text-border-dark mt-[-2rem]">VS</span>

                 {/* Team B Entry */}
                 <div className="flex-1 flex flex-col items-center gap-4">
                    <div className="size-20 bg-background-dark rounded-[2rem] flex items-center justify-center text-4xl font-black border border-border-dark">
                      <input 
                        type="number" 
                        value={scoreEntry.scoreB} 
                        onChange={(e) => setScoreEntry({ ...scoreEntry, scoreB: parseInt(e.target.value) || 0 })}
                        className="w-full h-full bg-transparent text-center outline-none text-white"
                      />
                    </div>
                    <span className="font-black text-center">{selectedMatch.teamB.name}</span>
                 </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-background-dark/50 rounded-3xl mb-10">
                 <div className="flex items-center gap-3">
                   <div className={`size-6 rounded-lg flex items-center justify-center transition-all ${scoreEntry.goldenPoint ? 'bg-primary text-background-dark' : 'bg-surface-dark border border-border-dark text-text-muted'}`}>
                     <span className="material-symbols-outlined text-sm">check</span>
                   </div>
                   <span className="text-sm font-bold">Golden Point Final</span>
                 </div>
                 <button 
                  onClick={() => setScoreEntry({ ...scoreEntry, goldenPoint: !scoreEntry.goldenPoint })}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-surface-dark border border-border-dark rounded-xl hover:bg-surface-light"
                 >
                   Toggle
                 </button>
              </div>

              <div className="flex gap-4">
                 <button onClick={() => setSelectedMatch(null)} className="flex-1 py-5 bg-background-dark border border-border-dark font-black rounded-2xl uppercase tracking-widest text-xs">Cancel</button>
                 <button 
                   onClick={handleResultSubmit}
                   className="flex-1 py-5 bg-primary text-background-dark font-black rounded-2xl shadow-lg shadow-primary/20 uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                 >
                   Save Result
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
