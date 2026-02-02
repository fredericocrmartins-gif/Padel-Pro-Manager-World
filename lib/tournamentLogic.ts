
import { TournamentMatch, TournamentPair, TournamentStanding, MatchResult } from '../types';

/**
 * 8-player Cards Mode Rules:
 * R1: A vs K (C1), Q vs J (C2)
 * R2: C1 Winners face C2 Winners, C1 Losers face C2 Losers
 * R3: Final Cross-match to ensure everyone plays 3 matches
 */

export const calculateStandings = (matches: TournamentMatch[], pairs: TournamentPair[]): TournamentStanding[] => {
  const standings: Record<string, TournamentStanding> = {};

  pairs.forEach(p => {
    standings[p.id] = {
      pairId: p.id,
      pairName: p.name,
      wins: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      diff: 0
    };
  });

  matches.forEach(m => {
    if (!m.result) return;
    
    const sA = standings[m.teamA.id];
    const sB = standings[m.teamB.id];

    sA.pointsFor += m.result.scoreA;
    sA.pointsAgainst += m.result.scoreB;
    sB.pointsFor += m.result.scoreB;
    sB.pointsAgainst += m.result.scoreA;

    if (m.result.winner === 'teamA') {
      sA.wins += 1;
    } else {
      sB.wins += 1;
    }

    sA.diff = sA.pointsFor - sA.pointsAgainst;
    sB.diff = sB.pointsFor - sB.pointsAgainst;
  });

  return Object.values(standings).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.diff !== a.diff) return b.diff - a.diff;
    return b.pointsFor - a.pointsFor;
  });
};

export const generateRound2 = (r1Matches: TournamentMatch[]): TournamentMatch[] => {
  const c1Match = r1Matches.find(m => m.court === 1);
  const c2Match = r1Matches.find(m => m.court === 2);

  if (!c1Match?.result || !c2Match?.result) return [];

  const c1Winner = c1Match.result.winner === 'teamA' ? c1Match.teamA : c1Match.teamB;
  const c1Loser = c1Match.result.winner === 'teamA' ? c1Match.teamB : c1Match.teamA;
  
  const c2Winner = c2Match.result.winner === 'teamA' ? c2Match.teamA : c2Match.teamB;
  const c2Loser = c2Match.result.winner === 'teamA' ? c2Match.teamB : c2Match.teamA;

  return [
    {
      id: 'm-r2-c1',
      round: 2,
      court: 1,
      teamA: c1Winner,
      teamB: c2Winner
    },
    {
      id: 'm-r2-c2',
      round: 2,
      court: 2,
      teamA: c1Loser,
      teamB: c2Loser
    }
  ];
};
