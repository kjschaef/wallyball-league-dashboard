'use client';

import { useState, useEffect } from 'react';
import { format, addDays, Day } from 'date-fns';
import { AdminLoginModal } from '../components/AdminLoginModal';
import { Trash2, Plus, Clock } from 'lucide-react';

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

interface Settings {
  signupOpenDayOfWeek: number;
  signupOpenTime: string;
  availableDays: string[];
}

const DAY_MAP: Record<string, Day> = {
  "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6
};

export default function SignupsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [actionPending, setActionPending] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    fetchData();
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, playersRes, signupsRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/players'),
        fetch('/api/signups')
      ]);

      if (settingsRes.ok) setSettings(await settingsRes.json());
      if (playersRes.ok) setPlayers(await playersRes.json());
      if (signupsRes.ok) setSignups(await signupsRes.json());
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUpcomingDates = () => {
    if (!settings || !settings.availableDays.length || !now) return [];
    
    const dates: string[] = [];
    
    // 1. Current Week (Sun to Sat)
    let currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay()); // Sunday
    
    // 2. Next Week (Sun to Sat)
    let nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(currentWeekStart.getDate() + 7);
    
    const generateWeekDates = (weekStart: Date) => {
        const weekDates: string[] = [];
        let d = new Date(weekStart);
        for (let i = 0; i < 7; i++) {
            const dayName = format(d, 'EEEE');
            if (settings.availableDays.includes(dayName)) {
                weekDates.push(format(d, 'yyyy-MM-dd'));
            }
            d = addDays(d, 1);
        }
        return weekDates;
    };
    
    const currentWeekDates = generateWeekDates(currentWeekStart);
    const nextWeekDates = generateWeekDates(nextWeekStart);
    
    // Tomorrow (since we move "today" to previous week)
    const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    
    // Add current week dates that are >= tomorrow
    currentWeekDates.forEach(dateStr => {
        if (dateStr >= tomorrowStr) {
            dates.push(dateStr);
        }
    });
    
    // For next week, check if it has opened
    const [hours, minutes] = settings.signupOpenTime.split(':').map(Number);
    const openDateTime = new Date(currentWeekStart);
    openDateTime.setDate(currentWeekStart.getDate() + settings.signupOpenDayOfWeek);
    openDateTime.setHours(hours, minutes, 0, 0);
    
    if (now >= openDateTime) {
        nextWeekDates.forEach(dateStr => {
            dates.push(dateStr);
        });
    }
    
    return dates.sort();
  };

  const handleSignup = async (date: string) => {
    if (!selectedPlayerId) return alert('Please select a player first');

    const doSignup = async () => {
      const res = await fetch('/api/signups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: parseInt(selectedPlayerId), date })
      });

      if (res.status === 401 || res.status === 403) {
        // Might need admin to bypass time restrictions or edit
        setActionPending(() => doSignup);
        setShowAdminModal(true);
        return;
      }

      if (res.ok) {
        await fetchData(); // Refresh data
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to sign up');
      }
    };

    await doSignup();
  };

  const handleDelete = async (signupId: number) => {
    if (!confirm('Are you sure you want to remove this player?')) return;

    const doDelete = async () => {
      const res = await fetch('/api/signups', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: signupId })
      });

      if (res.status === 401) {
        setActionPending(() => doDelete);
        setShowAdminModal(true);
        return;
      }

      if (res.ok) {
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove player');
      }
    };

    await doDelete();
  };

  const executePendingAction = async () => {
    setShowAdminModal(false);
    if (actionPending) {
        await actionPending();
        setActionPending(null);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading signups...</div>;

  const upcomingDates = getUpcomingDates();
  const previousDates = Array.from(new Set(signups.map(s => s.date)))
    .filter(d => !upcomingDates.includes(d))
    .sort();

  const nextOpenDate = settings ? (() => {
    const baseNow = new Date();
    const [hours, minutes] = settings.signupOpenTime.split(':').map(Number);
    let openDateTime = new Date();
    openDateTime.setHours(hours, minutes, 0, 0);

    let daysUntilOpen = (settings.signupOpenDayOfWeek - openDateTime.getDay() + 7) % 7;
    if (daysUntilOpen === 0 && baseNow > openDateTime) {
       daysUntilOpen = 7;
    }
    openDateTime.setDate(openDateTime.getDate() + daysUntilOpen);
    return openDateTime;
  })() : null;

  const timeDiffMs = nextOpenDate && now ? nextOpenDate.getTime() - now.getTime() : 0;
  const isCountdownActive = timeDiffMs > 0;
  const days = Math.floor(timeDiffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeDiffMs / 1000 / 60) % 60);
  const seconds = Math.floor((timeDiffMs / 1000) % 60);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {isCountdownActive && nextOpenDate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 flex flex-col items-center justify-center text-blue-800 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-600 mb-2 mt-1">Next Week's Signups Open In</h2>
            <div className="text-4xl font-mono font-bold tabular-nums mb-2">
                {days > 0 && `${days}d `}
                {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </div>
            <p className="text-sm text-blue-500 font-medium mb-1">
                {format(nextOpenDate, 'EEEE, MMMM do')} at {format(nextOpenDate, 'h:mm a')}
            </p>
        </div>
      )}

      <div className="border-b border-gray-200 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Weekly Signups</h1>
          <p className="text-gray-500 mt-1">Opt in to play for the upcoming week. Max 6 players per day.</p>
        </div>
        
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
        </div>
      </div>

      <div className="space-y-6">
        {upcomingDates.length === 0 ? (
            <div className="text-center text-gray-500 py-8 bg-white rounded-lg border border-gray-200">
                {(!settings || settings.availableDays.length === 0) 
                  ? "No available playing days configured. Ask an admin to check settings."
                  : "Signups are not currently open for any upcoming days."
                }
            </div>
        ) : (
            upcomingDates.map(dateStr => {
                const daySignups = signups.filter(s => s.date === dateStr);
                const registered = daySignups.filter(s => s.status === 'registered');
                const waitlisted = daySignups.filter(s => s.status === 'waitlisted');
                const isFull = registered.length >= 6;
                const dateObj = new Date(dateStr + "T12:00:00");

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

      {previousDates.length > 0 && (
          <div className="pt-8 mt-8 border-t border-gray-200">
              <h2 className="text-xl font-bold text-gray-700 mb-6">Previous Week</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {previousDates.map(dateStr => {
                      const daySignups = signups.filter(s => s.date === dateStr && s.status === 'registered');
                      if (daySignups.length === 0) return null;
                      
                      const dateObj = new Date(dateStr + "T12:00:00");
                      
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
      )}

      <AdminLoginModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onSuccess={executePendingAction}
      />
    </div>
  );
}
