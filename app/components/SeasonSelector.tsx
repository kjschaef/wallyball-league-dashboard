'use client';

import React from 'react';

interface Season { id: number; name: string; start_date?: string; end_date?: string; is_active?: boolean }

interface Props {
  seasons: Season[];
  currentSeason?: string;
  onSeasonChange: (season: string | undefined) => void;
}

export function SeasonSelector({ seasons = [], currentSeason = 'current', onSeasonChange }: Props) {
  const active = seasons.find(s => s.is_active) as Season | undefined;
  const historical = seasons.filter(s => !s.is_active);

  const selected = currentSeason;

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <button
          className={selected === 'current' ? 'bg-blue-600 text-white px-3 py-1 rounded' : 'bg-gray-100 text-gray-700 px-3 py-1 rounded'}
          onClick={() => onSeasonChange('current')}
        >
          Current Season
        </button>
        <button
          className={selected === 'lifetime' ? 'bg-blue-600 text-white px-3 py-1 rounded' : 'bg-gray-100 text-gray-700 px-3 py-1 rounded'}
          onClick={() => onSeasonChange('lifetime')}
        >
          Lifetime Stats
        </button>
      </div>

      {historical.length > 0 && (
        <select aria-label="Season" role="combobox" value={selected} onChange={e => onSeasonChange(e.target.value)} className="border px-2 py-1 rounded">
          <option value="current">{active ? active.name : 'Current Season'}</option>
          <option value="lifetime">Lifetime Stats</option>
          {historical.map(s => (
            <option key={s.id} value={String(s.id)}>{s.name}</option>
          ))}
        </select>
      )}

      <div className="text-sm text-gray-600">
        {selected === 'current' ? (active ? active.name : 'Current Season') : null}
      </div>
    </div>
  );
}

export default SeasonSelector;

