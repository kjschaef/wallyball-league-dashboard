'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { AdminLoginModal } from '../components/AdminLoginModal';
import { Trash2, Plus, Clock } from 'lucide-react';
import {
  generateWeekDates,
  getEasternWallTimeNow,
  getSignupCycleState,
  type SignupSettings,
} from '../lib/signups';

interface Player {
  id: number;
  name: string;
}

interface Signup {
  id: number;
  player_id: number;
  name: string;
  date: string;
  status: 'registered' | 'waitlisted';
  created_at: string;
}

interface UnavailablePlayer {
  id: number;
  player_id: number;
  name: string;
  week_start: string;
  created_at: string;
}

type Settings = SignupSettings;

export default function SignupsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [unavailablePlayers, setUnavailablePlayers] = useState<UnavailablePlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [actionPending, setActionPending] = useState<(() => Promise<boolean>) | null>(null);

  useEffect(() => {
    setNow(getEasternWallTimeNow());
    const interval = setInterval(() => setNow(getEasternWallTimeNow()), 1000);
    fetchData();
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, playersRes, signupsRes, unavailableRes] = await Promise.all([
        fetch('/api/settings', { cache: 'no-store' }),
        fetch('/api/players', { cache: 'no-store' }),
        fetch('/api/signups', { cache: 'no-store' }),
        fetch('/api/signups?unavailable=1', { cache: 'no-store' }),
      ]);
      if (settingsRes.ok) setSettings(await settingsRes.json());
      if (playersRes.ok) setPlayers(await playersRes.json());
      if (signupsRes.ok) setSignups(await signupsRes.json());
      if (unavailableRes.ok) setUnavailablePlayers(await unavailableRes.json());
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (date: string) => {
    if (!selectedPlayerId) return alert('Please select a player first');
    const doSignup = async (): Promise<boolean> => {
      const res = await fetch('/api/signups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: parseInt(selectedPlayerId), date })
      });
      if (res.status === 401 || res.status === 403) {
        setActionPending(() => doSignup);
        setShowAdminModal(true);
        return false;
      }
      if (res.ok) {
        await fetchData();
        return true;
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to sign up');
        return false;
      }
    };
    await doSignup();
  };

  const handleMarkUnavailable = async () => {
    if (!selectedPlayerId) return alert('Please select a player first');

    const selectedId = parseInt(selectedPlayerId, 10);
    const existingUnavailable = unavailablePlayers.find((entry) => entry.player_id === selectedId);

    const res = await fetch('/api/signups', {
      method: existingUnavailable ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        existingUnavailable
          ? { id: existingUnavailable.id, unavailable: true }
          : { playerId: selectedId, unavailable: true },
      ),
    });

    if (res.ok) {
      await fetchData();
      return;
    }

    const data = await res.json();
    alert(data.error || 'Failed to update unavailable status');
  };

  const handleDelete = async (signupId: number) => {
    if (!confirm('Are you sure you want to remove this player?')) return;
    const doDelete = async (): Promise<boolean> => {
      const res = await fetch('/api/signups', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: signupId })
      });
      if (res.status === 401) {
        setActionPending(() => doDelete);
        setShowAdminModal(true);
        return false;
      }
      if (res.ok) {
        await fetchData();
        return true;
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove player');
        return false;
      }
    };
    await doDelete();
  };

  const executePendingAction = async (): Promise<boolean> => {
    if (!actionPending) {
      return false;
    }

    const didComplete = await actionPending();
    if (didComplete) {
      setActionPending(null);
    }

    return didComplete;
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading signups...</div>;

  // Compute state
  const state = settings && now ? getSignupCycleState(now, settings) : null;
  const { isOpen, closeDateTime, nextOpenDateTime, signupWeekSunday, currentWeekSunday } = state ?? {
    isOpen: false,
    closeDateTime: new Date(),
    nextOpenDateTime: new Date(),
    signupWeekSunday: null,
    currentWeekSunday: new Date(),
    openDateTime: null,
  };

  const signupWeekStart = signupWeekSunday ? format(signupWeekSunday, 'yyyy-MM-dd') : null;
  const unavailableThisWeek = signupWeekStart
    ? unavailablePlayers.filter((player) => player.week_start === signupWeekStart)
    : [];
  const selectedPlayerUnavailable = selectedPlayerId
    ? unavailableThisWeek.some((player) => player.player_id === parseInt(selectedPlayerId, 10))
    : false;

  // Dates available for signup (next week's play days) — only shown when open
  const upcomingDates: string[] = (settings && isOpen && signupWeekSunday)
    ? generateWeekDates(signupWeekSunday, settings.availableDays)
    : [];

  // Current week dates (shown at bottom as reference)
  const currentWeekDates: string[] = settings
    ? generateWeekDates(currentWeekSunday, settings.availableDays)
    : [];

  // Countdown to next open
  const timeDiffMs = now && nextOpenDateTime ? nextOpenDateTime.getTime() - now.getTime() : 0;
  const countdownDays = Math.floor(timeDiffMs / (1000 * 60 * 60 * 24));
  const countdownHours = Math.floor((timeDiffMs / (1000 * 60 * 60)) % 24);
  const countdownMinutes = Math.floor((timeDiffMs / 1000 / 60) % 60);
  const countdownSeconds = Math.floor((timeDiffMs / 1000) % 60);
  const closeTimeDiffMs = now && closeDateTime ? Math.max(closeDateTime.getTime() - now.getTime(), 0) : 0;
  const closeCountdownDays = Math.floor(closeTimeDiffMs / (1000 * 60 * 60 * 24));
  const closeCountdownHours = Math.floor((closeTimeDiffMs / (1000 * 60 * 60)) % 24);
  const closeCountdownMinutes = Math.floor((closeTimeDiffMs / 1000 / 60) % 60);
  const closeCountdownSeconds = Math.floor((closeTimeDiffMs / 1000) % 60);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Weekly Signups</h1>
          <p className="text-gray-500 mt-1">
            {isOpen
              ? 'Opt in to play for the upcoming week. Max 6 players per day.'
              : 'Signups are currently closed.'}
          </p>
        </div>
        {isOpen && (
          <div className="flex items-center gap-2">
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 w-48"
            >
              <option value="">-- Who are you? --</option>
              {[...players].sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              onClick={handleMarkUnavailable}
              disabled={!selectedPlayerId}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${selectedPlayerUnavailable
                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {selectedPlayerUnavailable ? "I'm Back In" : 'Out This Week'}
            </button>
          </div>
        )}
      </div>

      {/* Main body */}
      {isOpen ? (
        /* OPEN: show upcoming (next week) signup cards */
        <div className="space-y-6">
          <div className="mx-auto w-full max-w-2xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-amber-900 md:w-1/2">
            <div className="text-sm">
              <span className="font-semibold">Signups close in: </span>
              <span className="font-mono tabular-nums">
                {closeCountdownDays > 0 && `${closeCountdownDays}d `}
                {closeCountdownHours.toString().padStart(2, '0')}:
                {closeCountdownMinutes.toString().padStart(2, '0')}:
                {closeCountdownSeconds.toString().padStart(2, '0')}
              </span>
            </div>
            <div className="mt-1 text-xs font-medium text-amber-700">
              Closes {format(closeDateTime, 'EEEE')} at {format(closeDateTime, 'h:mm a')}
            </div>
          </div>

          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-800">Unavailable This Week</h2>
            {unavailableThisWeek.length === 0 ? (
              <p className="mt-1 text-sm text-rose-700">No one has marked themselves out yet.</p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {unavailableThisWeek.map((player) => (
                  <li key={player.id} className="rounded-full bg-white px-3 py-1 text-sm text-rose-700 border border-rose-200">
                    {player.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {upcomingDates.length === 0 ? (
            <div className="text-center text-gray-500 py-8 bg-white rounded-lg border border-gray-200">
              {(!settings || settings.availableDays.length === 0)
                ? 'No available playing days configured. Ask an admin to check settings.'
                : 'Signups are not currently open for any upcoming days.'}
            </div>
          ) : (
            upcomingDates.map(dateStr => {
              const daySignups = signups.filter(s => s.date === dateStr);
              const registered = daySignups.filter(s => s.status === 'registered');
              const waitlisted = daySignups.filter(s => s.status === 'waitlisted');
              const isFull = registered.length >= 6;
              const dateObj = new Date(dateStr + 'T12:00:00');

              return (
                <div key={dateStr} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">{format(dateObj, 'EEEE, MMMM do')}</h2>
                      <p className="text-sm text-gray-500">{registered.length}/6 spots filled</p>
                    </div>
                    <button
                      onClick={() => handleSignup(dateStr)}
                      className={`flex items-center gap-1 px-4 py-2 rounded-md font-medium transition-colors
                        ${isFull
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                      <Plus className="w-4 h-4" />
                      {isFull ? 'Join Waitlist' : 'Sign Up'}
                    </button>
                  </div>

                  <div className="p-0">
                    {registered.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 italic">No one signed up yet</div>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {registered.map((signup, idx) => (
                          <li key={signup.id} className="flex justify-between items-center p-3 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="text-gray-400 font-mono w-4">{idx + 1}.</span>
                              <span className="font-medium text-gray-800">{signup.name}</span>
                            </div>
                            <button
                              onClick={() => handleDelete(signup.id)}
                              className="text-red-400 hover:text-red-600 p-2 rounded-md hover:bg-red-50"
                              title="Remove player"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {waitlisted.length > 0 && (
                    <div className="bg-orange-50/50 p-3 border-t border-orange-100">
                      <h3 className="text-xs font-semibold uppercase text-orange-800 mb-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Waitlist
                      </h3>
                      <ul className="space-y-1">
                        {waitlisted.map((signup, idx) => (
                          <li key={signup.id} className="flex justify-between items-center text-sm text-gray-600 pl-2">
                            <span>{idx + 1}. {signup.name}</span>
                            <button
                              onClick={() => handleDelete(signup.id)}
                              className="text-orange-400 hover:text-orange-600 p-1 rounded hover:bg-orange-100"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* CLOSED: show countdown timer */
        nextOpenDateTime && (
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-4 text-slate-700">
            <div className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Next Week&apos;s Signups Open In
            </div>
            <div className="mx-auto grid max-w-2xl grid-cols-4 gap-2 text-center">
              <div className="rounded-md border border-slate-200/80 bg-white/85 px-2 py-2">
                <div className="font-mono text-xl font-medium tabular-nums text-slate-700 md:text-2xl">
                  {countdownDays.toString().padStart(2, '0')}
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Days
                </div>
              </div>
              <div className="rounded-md border border-slate-200/80 bg-white/85 px-2 py-2">
                <div className="font-mono text-xl font-medium tabular-nums text-slate-700 md:text-2xl">
                  {countdownHours.toString().padStart(2, '0')}
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Hours
                </div>
              </div>
              <div className="rounded-md border border-slate-200/80 bg-white/85 px-2 py-2">
                <div className="font-mono text-xl font-medium tabular-nums text-slate-700 md:text-2xl">
                  {countdownMinutes.toString().padStart(2, '0')}
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Minutes
                </div>
              </div>
              <div className="rounded-md border border-slate-200/80 bg-white/85 px-2 py-2">
                <div className="font-mono text-xl font-medium tabular-nums text-rose-500 md:text-2xl">
                  {countdownSeconds.toString().padStart(2, '0')}
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Seconds
                </div>
              </div>
            </div>
            <div className="mt-2 text-center">
              <span className="text-xs font-medium text-slate-500">
                Opens {format(nextOpenDateTime, 'EEEE, MMMM do')} at {format(nextOpenDateTime, 'h:mm a')}
              </span>
            </div>
          </div>
        )
      )}

      {/* Current Week (bottom section) */}
      {currentWeekDates.length > 0 && (() => {
        const currentWeekCards = currentWeekDates
          .map(dateStr => ({
            dateStr,
            daySignups: signups.filter(s => s.date === dateStr && s.status === 'registered'),
          }))
          .filter(({ daySignups }) => daySignups.length > 0);

        if (currentWeekCards.length === 0) return null;

        return (
          <div className="pt-8 mt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-700 mb-6">Current Week</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentWeekCards.map(({ dateStr, daySignups }) => {
                const dateObj = new Date(dateStr + 'T12:00:00');
                return (
                  <div key={dateStr} className="bg-gray-50 rounded-lg border border-gray-200 p-4 opacity-80">
                    <h3 className="font-semibold text-gray-800 mb-3">{format(dateObj, 'EEEE, MMM do')}</h3>
                    <ul className="space-y-1">
                      {daySignups.map((s, idx) => (
                        <li key={s.id} className="text-sm text-gray-600 flex items-center">
                          <span className="text-gray-400 font-mono w-4 mr-2">{idx + 1}.</span>
                          {s.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <AdminLoginModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onSuccess={executePendingAction}
      />
    </div>
  );
}
