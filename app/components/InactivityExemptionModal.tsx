"use client";

import { useEffect, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function InactivityExemptionModal({ isOpen, onClose, onSaved }: Props) {
  const [players, setPlayers] = useState<{ id: number; name: string }[]>([]);
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [reason, setReason] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    // Reset form when modal is opened so end date appears blank unless user enters a value
    reset();
    fetch('/api/players').then(r => r.json()).then(setPlayers).catch(() => setPlayers([]));
  }, [isOpen]);

  const reset = () => {
    setPlayerId(null);
    setReason("");
    setStartDate("");
    setEndDate("");
    setError(null);
  };

  const onSubmit = async () => {
    if (!playerId || !startDate) {
      setError('Player and start date are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/inactivity-exemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, reason, startDate, endDate: endDate || null })
      });
      if (!res.ok) throw new Error(await res.text());
      reset();
      // Notify parent so dashboard can refresh charts/lists
      if (onSaved) onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Add Inactivity Exemption</h2>
          <button onClick={() => { reset(); onClose(); }} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        {error && <div className="mb-2 text-sm text-red-600">{error}</div>}
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Player</label>
            <select className="w-full border rounded px-3 py-2 h-10 text-sm" value={playerId ?? ''} onChange={(e) => setPlayerId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">Select player</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Reason (optional)</label>
            <input className="w-full border rounded px-2 py-1" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Injury, Travel" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Start Date</label>
            <input type="date" className="w-full border rounded px-2 py-1 text-gray-500 placeholder:text-gray-300" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">End Date (optional)</label>
            <input type="date" className="w-full border rounded px-2 py-1 text-gray-500 placeholder:text-gray-300" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-1 rounded border" onClick={() => { reset(); onClose(); }} disabled={saving}>Cancel</button>
          <button className="px-3 py-1 rounded bg-gray-900 text-white disabled:opacity-60" onClick={onSubmit} disabled={saving}>Save</button>
        </div>
      </div>
    </div>
  );
}
