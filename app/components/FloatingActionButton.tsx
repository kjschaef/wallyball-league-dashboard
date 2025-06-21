
"use client";

import { useState } from "react";
import { Plus, Brain } from "lucide-react";

interface FloatingActionButtonProps {
  onRecordMatch: () => void;
  onAddPlayer?: () => void;
  onTeamSuggestion?: () => void;
}

export function FloatingActionButton({ onRecordMatch, onAddPlayer, onTeamSuggestion }: FloatingActionButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleOptionClick = (action: 'addPlayer' | 'recordMatch' | 'teamSuggestion') => {
    setShowDropdown(false);
    if (action === 'addPlayer' && onAddPlayer) {
      onAddPlayer();
    } else if (action === 'recordMatch') {
      onRecordMatch();
    } else if (action === 'teamSuggestion' && onTeamSuggestion) {
      onTeamSuggestion();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {showDropdown && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[180px] mb-2">
          <button
            onClick={() => handleOptionClick('teamSuggestion')}
            className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            AI Team Suggestions
          </button>
          <button
            onClick={() => handleOptionClick('addPlayer')}
            className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-150"
          >
            Add Player
          </button>
          <button
            onClick={() => handleOptionClick('recordMatch')}
            className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-150"
          >
            Record Match
          </button>
        </div>
      )}
      
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="bg-gray-900 hover:bg-gray-800 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
        title="Actions"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
