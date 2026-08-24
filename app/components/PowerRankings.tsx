'use client';

import { useState, useEffect } from 'react';
import { getSkillTier, computeWeeklyMovers, SkillTier } from '../lib/elo';

export interface PowerRankingsPlayer {
  id: number;
  name: string;
  elo?: number;
  isProvisional?: boolean;
  careerGames?: number;
  winPercentage: number;
}

interface WeeklyMoverInfo {
  id: number;
  name: string;
  delta: number;
  currentElo: number;
}

interface PowerRankingsProps {
  className?: string;
}

export function PowerRankings({ className = '' }: PowerRankingsProps) {
  const [players, setPlayers] = useState<PowerRankingsPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyMover, setWeeklyMover] = useState<WeeklyMoverInfo | null>(null);
  const [periodLabel, setPeriodLabel] = useState('This Week');

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch lifetime player stats for career Elo
        const statsRes = await fetch('/api/player-stats?season=lifetime');
        if (!statsRes.ok) throw new Error('Failed to load stats');
        const statsData: PowerRankingsPlayer[] = await statsRes.json();

        // Sort players by Elo descending
        const sorted = (statsData || []).map(p => ({
          ...p,
          elo: p.elo ?? 1500,
        })).sort((a, b) => (b.elo ?? 1500) - (a.elo ?? 1500));

        setPlayers(sorted);

        // Fetch recent matches to calculate real weekly mover
        try {
          const matchesRes = await fetch('/api/matches?limit=100');
          if (matchesRes.ok) {
            const matches = await matchesRes.json();
            if (matches && matches.length > 0) {
              const movers = computeWeeklyMovers(sorted, matches);
              if (movers.biggestGainer) {
                setWeeklyMover(movers.biggestGainer);
                setPeriodLabel(movers.periodLabel);
              } else {
                setWeeklyMover(null);
              }
            }
          }
        } catch {
          // Ignore mover errors gracefully
        }
      } catch (err) {
        console.error('Error loading power rankings:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4 ${className}`}>
        <div className="h-6 w-44 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-3">
          <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  const top3 = players.slice(0, 3);
  const remaining = players.slice(3);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return {
        medal: '#1',
        bg: 'bg-amber-400 text-amber-950 ring-2 ring-amber-300 shadow-sm',
        cardBg: 'bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 border-amber-200/80',
        progressBar: 'from-amber-400 to-amber-500',
        ribbon: '🥇',
      };
    }
    if (rank === 2) {
      return {
        medal: '#2',
        bg: 'bg-slate-300 text-slate-900 ring-2 ring-slate-200 shadow-sm',
        cardBg: 'bg-gradient-to-br from-slate-50/80 via-white to-slate-50/30 border-slate-200/80',
        progressBar: 'from-slate-400 to-slate-500',
        ribbon: '🥈',
      };
    }
    return {
      medal: '#3',
      bg: 'bg-amber-700 text-white ring-2 ring-amber-600 shadow-sm',
      cardBg: 'bg-gradient-to-br from-orange-50/60 via-white to-orange-50/20 border-orange-200/70',
      progressBar: 'from-orange-400 to-amber-700',
      ribbon: '🥉',
    };
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between gap-4 ${className}`}>
      {/* Top Section */}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>⚡ League Power Rankings</span>
            </h2>
            <p className="text-xs text-gray-500">All-Time Career Elo & Skill Tiers</p>
          </div>
        </div>

        {/* Top 3 Podium Cards */}
        <div className="space-y-2.5">
          {top3.map((player, idx) => {
            const rank = idx + 1;
            const badge = getRankBadge(rank);
            const elo = player.elo ?? 1500;
            const tier: SkillTier = getSkillTier(elo, !!player.isProvisional);
            const eloProgress = Math.min(100, Math.max(5, ((elo - 1200) / 600) * 100));

            return (
              <div
                key={player.id}
                className={`p-3 rounded-xl border transition-all hover:shadow-md ${badge.cardBg}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${badge.bg}`}
                    >
                      {badge.medal}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-900 text-sm">{player.name}</span>
                        {player.isProvisional && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.2 rounded">
                            PROV
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[11px] text-gray-500 font-medium">
                          {tier.icon} {tier.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-gray-900 leading-none block">
                      {elo}
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
                      Elo
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200/80 rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${badge.progressBar} transition-all duration-500 ease-out`}
                    style={{ width: `${eloProgress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly Movers Card */}
        {weeklyMover && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🔥</span>
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                  Biggest Gainer ({periodLabel})
                </p>
                <p className="text-xs font-bold text-gray-900 mt-0.5">{weeklyMover.name}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200">
                +{weeklyMover.delta} Elo
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Ranked Ladder List (#4+) */}
      {remaining.length > 0 && (
        <div className="flex-1 flex flex-col min-h-0 pt-2 border-t border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Skill Ladder
          </h3>
          <div className="flex-1 divide-y divide-gray-100 overflow-y-auto pr-1 max-h-[360px] lg:max-h-none">
            {remaining.map((player, idx) => {
              const rank = idx + 4;
              const elo = player.elo ?? 1500;
              const tier = getSkillTier(elo, !!player.isProvisional);

              return (
                <div
                  key={player.id}
                  className="py-2 flex items-center justify-between hover:bg-gray-50/80 px-1.5 rounded transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-gray-400 w-5 text-center">
                      #{rank}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-800">{player.name}</span>
                        {player.isProvisional && (
                          <span className="text-[8px] bg-amber-100 text-amber-700 font-semibold px-1 py-0.2 rounded">
                            PROV
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        {tier.icon} {tier.name}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-indigo-700">{elo}</span>
                    <span className="text-[10px] text-gray-400 ml-1">Elo</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Skill Tier Breakdown Legend */}
      <div className="pt-3 border-t border-gray-100 mt-auto">
        <div className="grid grid-cols-2 gap-1.5 text-[10px] text-gray-500 bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
          <div className="flex items-center gap-1"><span>💎</span> <span className="font-semibold text-gray-700">Diamond:</span> 1650+</div>
          <div className="flex items-center gap-1"><span>🥇</span> <span className="font-semibold text-gray-700">Gold:</span> 1525–1649</div>
          <div className="flex items-center gap-1"><span>🥈</span> <span className="font-semibold text-gray-700">Silver:</span> 1400–1524</div>
          <div className="flex items-center gap-1"><span>🥉</span> <span className="font-semibold text-gray-700">Bronze:</span> &lt;1400</div>
        </div>
      </div>
    </div>
  );
}
