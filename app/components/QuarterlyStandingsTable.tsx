'use client';

import { useState, useEffect } from 'react';
import { getPlayerThreshold } from '../lib/playerFiltering';

interface StandingPlayer {
  id: number;
  name: string;
  record: {
    wins: number;
    losses: number;
    totalGames: number;
  };
  winPercentage: number;
  isProvisional?: boolean;
}

interface QuarterlyStandingsTableProps {
  season?: string;
  showAllPlayers?: boolean;
}

export function QuarterlyStandingsTable({ season, showAllPlayers = false }: QuarterlyStandingsTableProps) {
  const [standings, setStandings] = useState<StandingPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStandings() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (season) queryParams.set('season', season);
        const res = await fetch(`/api/player-stats?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch season stats');
        const data: StandingPlayer[] = await res.json();

        // Calculate threshold (50 games if any players meet it, else 1 unless showAllPlayers is on)
        const threshold = getPlayerThreshold(data || [], showAllPlayers);

        // Filter players who meet the threshold
        const filtered = (data || []).filter(p => (p.record?.totalGames ?? 0) >= threshold);

        // Sort by win percentage descending, then total wins
        filtered.sort((a, b) => {
          if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
          return (b.record?.wins ?? 0) - (a.record?.wins ?? 0);
        });

        setStandings(filtered);
      } catch (err) {
        console.error('Error loading quarterly standings:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStandings();
  }, [season, showAllPlayers]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>🏆 Season Standings</span>
          </h2>
          <p className="text-xs text-gray-500">Ranked by Win % & Match Record</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
          {standings.length} Active Players
        </span>
      </div>

      {standings.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          No match records found for this season.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-2.5 px-2 text-center w-10">#</th>
                <th className="py-2.5 px-3">Player</th>
                <th className="py-2.5 px-3 text-right">Win %</th>
                <th className="py-2.5 px-3 text-center">Record</th>
                <th className="py-2.5 px-3 text-right">Games</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {standings.map((player, idx) => {
                const rank = idx + 1;
                const winRate = player.winPercentage;
                const winRateColor =
                  winRate >= 55 ? 'text-emerald-600 font-bold' :
                  winRate >= 45 ? 'text-amber-600 font-semibold' :
                  'text-rose-600 font-semibold';

                return (
                  <tr key={player.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-2.5 px-2 text-center text-xs font-bold text-gray-400">
                      {rank <= 3 ? (
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                          rank === 1 ? 'bg-amber-100 text-amber-800' :
                          rank === 2 ? 'bg-slate-200 text-slate-700' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {rank}
                        </span>
                      ) : (
                        rank
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-gray-900">{player.name}</span>
                    </td>
                    <td className={`py-2.5 px-3 text-right ${winRateColor}`}>
                      {winRate.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-center text-xs">
                      <span className="text-emerald-600 font-medium">{player.record?.wins ?? 0}</span>
                      <span className="text-gray-400 mx-1">-</span>
                      <span className="text-rose-600 font-medium">{player.record?.losses ?? 0}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs font-medium text-gray-600">
                      {player.record?.totalGames ?? 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
