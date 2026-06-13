
"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, UserPlus, Trophy, Users } from "lucide-react";

interface FloatingActionButtonProps {
  onRecordMatch: () => void;
  onAddPlayer?: () => void;
  onTeamSuggestionClick?: () => void;
}

export function FloatingActionButton({ onRecordMatch, onAddPlayer, onTeamSuggestionClick }: FloatingActionButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowDropdown(false);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

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
    <div className="fixed bottom-6 right-6 z-50" ref={containerRef}>
      {showDropdown && (
        <div
          className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px] mb-2 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
          role="menu"
        >
          {onAddPlayer && (
            <button
              onClick={() => handleOptionClick('addPlayer')}
              className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-150 focus-visible:outline-none focus-visible:bg-gray-100 flex items-center gap-3"
              role="menuitem"
            >
              <UserPlus className="h-4 w-4 text-gray-500" />
              <span>Add Player</span>
            </button>
          )}
          <button
            onClick={() => handleOptionClick('recordMatch')}
            className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-150 focus-visible:outline-none focus-visible:bg-gray-100 flex items-center gap-3"
            role="menuitem"
          >
            <Trophy className="h-4 w-4 text-gray-500" />
            <span>Record Match</span>
          </button>
          {onTeamSuggestionClick && (
            <button
              onClick={() => handleOptionClick('teamSuggestion')}
              className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors duration-150 focus-visible:outline-none focus-visible:bg-gray-100 flex items-center gap-3"
              role="menuitem"
            >
              <Users className="h-4 w-4 text-gray-500" />
              <span>Team Suggestions</span>
            </button>
          )}
        </div>
      )}

      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="bg-gray-900 hover:bg-gray-800 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-900/50 flex items-center justify-center"
        title="Actions"
        aria-label={showDropdown ? "Close actions menu" : "Open actions menu"}
        aria-expanded={showDropdown}
        aria-haspopup="menu"
      >
        <Plus className={`h-6 w-6 transition-transform duration-300 ${showDropdown ? 'rotate-45' : ''}`} />
      </button>
    </div>
  );
}
