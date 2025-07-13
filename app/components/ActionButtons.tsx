'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus, Trophy, Brain } from 'lucide-react';

interface ActionButtonsProps {
  onRecordMatch: () => void;
  onAddPlayer: () => void;
  onTeamSuggestion: () => void;
}

export function ActionButtons({ onRecordMatch, onAddPlayer, onTeamSuggestion }: ActionButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px] mb-2">
          <button
            onClick={() => handleAction(onTeamSuggestion)}
            className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center gap-3"
          >
            <Brain className="h-4 w-4 text-blue-600" />
            <span>AI Team Suggestions</span>
          </button>
          <div className="border-t border-gray-100 my-1"></div>
          <button
            onClick={() => handleAction(onRecordMatch)}
            className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center gap-3"
          >
            <Trophy className="h-4 w-4 text-green-600" />
            <span>Record Match</span>
          </button>
          <button
            onClick={() => handleAction(onAddPlayer)}
            className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center gap-3"
          >
            <UserPlus className="h-4 w-4 text-purple-600" />
            <span>Add Player</span>
          </button>
        </div>
      )}

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full shadow-lg bg-gray-900 hover:bg-gray-800 transition-all duration-200 transform hover:scale-105"
        size="icon"
      >
        <Plus className={`h-6 w-6 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`} />
      </Button>
    </div>
  );
}