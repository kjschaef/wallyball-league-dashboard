'use client';

import React from 'react';

interface Season {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

interface SeasonSelectorProps {
  seasons: Season[];
  currentSeason: string; // 'current', 'lifetime', or season ID string
  onSeasonChange: (season: string) => void;
}

export function SeasonSelector({ seasons, currentSeason, onSeasonChange }: SeasonSelectorProps) {
  const activeSeason = seasons.find(season => season.is_active);
  const historicalSeasons = seasons.filter(season => !season.is_active);
  
  const getCurrentSeasonLabel = () => {
    if (currentSeason === 'current') {
      return activeSeason ? activeSeason.name : 'Current Season';
    } else if (currentSeason === 'lifetime') {
      return 'All Time';
    } else {
      const selectedSeason = seasons.find(s => s.id.toString() === currentSeason);
      return selectedSeason ? selectedSeason.name : 'Unknown Season';
    }
  };

  const getButtonClasses = (isSelected: boolean) => {
    return `px-4 py-2 rounded-md font-medium transition-colors ${
      isSelected
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`;
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">View:</span>
        <div className="flex gap-2">
          <button
            onClick={() => onSeasonChange('current')}
            className={getButtonClasses(currentSeason === 'current')}
          >
            Current Season
          </button>
          <button
            onClick={() => onSeasonChange('lifetime')}
            className={getButtonClasses(currentSeason === 'lifetime')}
          >
            Lifetime Stats
          </button>
        </div>
      </div>

      {historicalSeasons.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Or select:</span>
          <select
            value={currentSeason === 'current' || currentSeason === 'lifetime' ? '' : currentSeason}
            onChange={(e) => onSeasonChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Historical Season</option>
            {historicalSeasons.map(season => (
              <option key={season.id} value={season.id.toString()}>
                {season.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-2 ml-auto">
        <span className="text-sm text-gray-500">Showing:</span>
        <span className="text-sm font-semibold text-gray-900">
          {getCurrentSeasonLabel()}
        </span>
      </div>
    </div>
  );
}