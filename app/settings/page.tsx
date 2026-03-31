'use client';

import { useState, useEffect } from 'react';
import { AdminLoginModal } from '../components/AdminLoginModal';
import { Check } from 'lucide-react';
import { DEFAULT_SIGNUP_SETTINGS, normalizeTimeInputValue } from '../lib/signups';

interface Settings {
  signupOpenDayOfWeek: number;
  signupOpenTime: string;
  signupCloseDayOfWeek: number;
  signupCloseTime: string;
  availableDays: string[];
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    ...DEFAULT_SIGNUP_SETTINGS,
  });
  const [adminPassword, setAdminPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setSettings({
            signupOpenDayOfWeek: data.signupOpenDayOfWeek ?? DEFAULT_SIGNUP_SETTINGS.signupOpenDayOfWeek,
            signupOpenTime: normalizeTimeInputValue(
              data.signupOpenTime,
              DEFAULT_SIGNUP_SETTINGS.signupOpenTime,
            ),
            signupCloseDayOfWeek: data.signupCloseDayOfWeek ?? DEFAULT_SIGNUP_SETTINGS.signupCloseDayOfWeek,
            signupCloseTime: normalizeTimeInputValue(
              data.signupCloseTime,
              DEFAULT_SIGNUP_SETTINGS.signupCloseTime,
            ),
            availableDays: Array.isArray(data.availableDays) ? data.availableDays : DEFAULT_SIGNUP_SETTINGS.availableDays,
          });
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (): Promise<boolean> => {
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const payload: Settings & { adminPassword?: string } = { ...settings };
      payload.signupOpenTime = normalizeTimeInputValue(
        payload.signupOpenTime,
        DEFAULT_SIGNUP_SETTINGS.signupOpenTime,
      );
      payload.signupCloseTime = normalizeTimeInputValue(
        payload.signupCloseTime,
        DEFAULT_SIGNUP_SETTINGS.signupCloseTime,
      );
      if (adminPassword) {
        payload.adminPassword = adminPassword;
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        setShowAdminModal(true);
        setIsSaving(false);
        return false;
      }

      if (response.ok) {
        setMessage({ text: 'Settings saved successfully!', type: 'success' });
        setAdminPassword('');
        return true;
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage({ text: error.message, type: 'error' });
      } else {
        setMessage({ text: String(error), type: 'error' });
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAvailableDay = (day: string) => {
    setSettings(prev => {
      const currentDays = [...prev.availableDays];
      if (currentDays.includes(day)) {
         return { ...prev, availableDays: currentDays.filter(d => d !== day) };
      } else {
         return { ...prev, availableDays: [...currentDays, day] };
      }
    });
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Site Settings</h1>
        <p className="text-gray-500 mt-1">Configure weekly signups and admin controls.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Signup Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="signup-open-day" className="block text-sm font-medium text-gray-700">Signups Open Day</label>
            <select
              id="signup-open-day"
              value={settings.signupOpenDayOfWeek}
              onChange={(e) => setSettings({...settings, signupOpenDayOfWeek: parseInt(e.target.value)})}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {DAYS_OF_WEEK.map((day, idx) => (
                <option key={day} value={idx}>{day}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-open-time" className="block text-sm font-medium text-gray-700">Signups Open Time (EST)</label>
            <input
              id="signup-open-time"
              type="time"
              value={settings.signupOpenTime}
              onChange={(e) => setSettings({...settings, signupOpenTime: e.target.value})}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="signup-close-day" className="block text-sm font-medium text-gray-700">Signups Close Day</label>
            <select
              id="signup-close-day"
              value={settings.signupCloseDayOfWeek}
              onChange={(e) => setSettings({...settings, signupCloseDayOfWeek: parseInt(e.target.value)})}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {DAYS_OF_WEEK.map((day, idx) => (
                <option key={day} value={idx}>{day}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-close-time" className="block text-sm font-medium text-gray-700">Signups Close Time (EST)</label>
            <input
              id="signup-close-time"
              type="time"
              value={settings.signupCloseTime}
              onChange={(e) => setSettings({...settings, signupCloseTime: e.target.value})}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-gray-100">
          <p id="available-days-label" className="block text-sm font-medium text-gray-700">Available Days (Target Play Days)</p>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map(day => {
              const isActive = settings.availableDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={isActive}
                  aria-describedby="available-days-label"
                  onClick={() => handleToggleAvailableDay(day)}
                  className={`px-4 py-2 border rounded-full flex items-center gap-2 transition-colors
                    ${isActive ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'}
                  `}
                >
                  {isActive && <Check className="w-4 h-4" />}
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Admin Controls</h2>
        
        <div className="space-y-2">
          <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700">Change Admin Password</label>
          <input
            id="admin-password"
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Leave blank to keep current password"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none max-w-sm"
          />
          <p className="text-sm text-gray-500 pt-1">You will be prompted for your current admin password when saving changes.</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            void handleSave();
          }}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      <AdminLoginModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onSuccess={async () => {
          return handleSave();
        }}
      />
    </div>
  );
}
