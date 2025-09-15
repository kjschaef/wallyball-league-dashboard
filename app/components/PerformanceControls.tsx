'use client';

import { useEffect, useState } from 'react';
import Select from 'react-select';

interface Season { id: number; name: string; start_date: string; end_date: string; is_active?: boolean }

interface Props {
  season?: string;
  metric: 'winPercentage' | 'totalWins';
  compare: number[];
  onChange: (opts: Partial<{ season: string; metric: any; compare: number[]; action?: string }>) => void;
}

export function PerformanceControls({ season, metric, compare, onChange }: Props) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeSeasonId, setActiveSeasonId] = useState<number | null>(null);
  const [players, setPlayers] = useState<Array<{id: number; name: string}>>([]);
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>(season);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/seasons');
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) {
          setSeasons(data || []);
          const active = (data || []).find((s: any) => s.is_active);
          setActiveSeasonId(active ? active.id : null);
          // if the selected season corresponds to the active season, normalize to 'current'
          if (active && String(active.id) === String(selectedSeason)) {
            setSelectedSeason('current');
            onChange({ season: 'current' });
          }
        }
      } catch (e) {
        // ignore
      }
    })();
    // fetch players for compare selector
    (async () => {
      try {
        const res = await fetch('/api/players');
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setPlayers(data || []);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false };
  }, []);

  useEffect(() => {
    setSelectedSeason(season);
  }, [season]);

  // If the provided season prop equals the active season id, convert to 'current'
  useEffect(() => {
    if (season && activeSeasonId && String(season) === String(activeSeasonId)) {
      setSelectedSeason('current');
      onChange({ season: 'current' });
    }
  }, [season, activeSeasonId]);

  return (
    <div className="controls bg-white shadow-sm rounded-md p-4">
      <div className="primary flex flex-wrap items-end gap-4">
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Season</label>
          <select
            aria-label="Season"
            className="w-56 bg-gray-50 border border-gray-200 px-3 py-2 rounded-md text-sm"
            value={selectedSeason || 'current'}
            onChange={e => { setSelectedSeason(e.target.value); onChange({ season: e.target.value }); }}
          >
            <option value="current">Current</option>
            {seasons.filter(s => !s.is_active).map(s => (
              <option key={s.id} value={String(s.id)}>{s.name}</option>
            ))}
            <option value="lifetime">Lifetime</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Metric</label>
          <div className="inline-flex rounded-md shadow-sm bg-gray-100" role="tablist">
            <button
              onClick={() => onChange({ metric: 'winPercentage' })}
              className={`px-3 py-2 text-sm border-r ${metric === 'winPercentage' ? 'bg-gray-900 text-white border-gray-900' : 'bg-transparent text-gray-700 border-transparent'}`}
            >
              Win %
            </button>
            <button
              onClick={() => onChange({ metric: 'totalWins' })}
              className={`px-3 py-2 text-sm ${metric === 'totalWins' ? 'bg-gray-900 text-white border-gray-900' : 'bg-transparent text-gray-700 border-transparent'}`}
            >
              Total Wins
            </button>
          </div>
        </div>

        {/* Penalties and smoothing controls removed */}

        <div className="flex flex-col" style={{ minWidth: 220 }}>
          <label className="text-xs text-gray-500 mb-1">Compare</label>
          <div>
            <Select
              isMulti
              options={players.map(p => ({ value: p.id, label: p.name }))}
              classNamePrefix="react-select"
              placeholder="Search players..."
              onChange={(vals: any) => onChange({ compare: (vals || []).map((v: any) => v.value) })}
              value={players.filter(p => compare.includes(p.id)).map(p => ({ value: p.id, label: p.name }))}
              // Render the menu into a portal so it isn't clipped by parent containers,
              // and ensure it appears above other UI like charts with a high z-index.
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              menuPosition="fixed"
              styles={{
                // Ensure the visible menu has a very high z-index so it sits above charts
                menu: (provided) => ({ ...provided, maxHeight: 240, zIndex: 9999 }),
                // Also ensure the portal wrapper has a high z-index
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                // Fix container width and prevent selected values from overflowing
                container: (p) => ({ ...p, width: 260 }),
                control: (base) => ({ ...base, overflow: 'hidden' }),
                valueContainer: (base) => ({ ...base, overflow: 'hidden', maxWidth: 200 }),
                multiValue: (base) => ({ ...base, maxWidth: '100%', overflow: 'hidden' }),
                multiValueLabel: (base) => ({ ...base, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }),
                multiValueRemove: (base) => ({ ...base, flex: '0 0 auto' }),
                singleValue: (base) => ({ ...base, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })
              }}
              closeMenuOnSelect={false}
            />
          </div>
        </div>

        <div className="ml-auto flex items-center space-x-3">
          <button
            className="text-sm text-gray-600 hover:text-gray-900"
            onClick={() => onChange({ action: 'reset' })}
          >
            Reset
          </button>
          <button
            className="px-3 py-2 bg-gray-900 text-white rounded-md text-sm"
            onClick={() => onChange({ action: 'export' })}
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
