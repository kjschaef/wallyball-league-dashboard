
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onRecordMatch: () => void;
  onAddPlayer?: () => void;
  onTeamSuggestionClick?: () => void;
}

export function FloatingActionButton({ onRecordMatch, onAddPlayer, onTeamSuggestionClick }: FloatingActionButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleOptionClick = (action: 'addPlayer' | 'recordMatch' | 'teamSuggestion') => {
    setShowDropdown(false);
    if (action === 'addPlayer' && onAddPlayer) {
      onAddPlayer();
    } else if (action === 'recordMatch') {
      onRecordMatch();
    } else if (action === 'teamSuggestion' && onTeamSuggestionClick) {
      onTeamSuggestionClick();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {showDropdown && (
        <div
          className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[180px] mb-2"
          role="menu"
        >
          <button
            onClick={() => handleOptionClick('addPlayer')}
            className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-900"
            role="menuitem"
          >
            Add Player
          </button>
          <button
            onClick={() => handleOptionClick('recordMatch')}
            className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-900"
            role="menuitem"
          >
            Record Match
          </button>
        </div>
      )}

      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="bg-gray-900 hover:bg-gray-800 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-900/50 flex items-center justify-center"
        title="Actions"
        aria-label="Actions"
        aria-expanded={showDropdown}
        aria-haspopup="menu"
      >
        <Plus className={`h-6 w-6 transition-transform duration-300 ${showDropdown ? 'rotate-45' : ''}`} />
      </button>
    </div>
  );
}
