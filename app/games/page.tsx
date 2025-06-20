
"use client";

import { useState, useEffect } from "react";
import { Calendar, Trash2, Search, X } from "lucide-react";

interface Match {
  id: number;
  date: string;
  teamOnePlayers: string[];
  teamTwoPlayers: string[];
  teamOneGamesWon: number;
  teamTwoGamesWon: number;
}

export default function GamesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [playerFilter, setPlayerFilter] = useState("");

  useEffect(() => {
    fetchAllMatches();
  }, []);

  async function fetchAllMatches() {
    try {
      const response = await fetch("/api/matches");
      if (!response.ok) {
        throw new Error("Failed to fetch matches");
      }
      const data = await response.json();
      setMatches(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching matches:", error);
      setLoading(false);
      alert("Error fetching match data. Please try again later.");
    }
  }

  // Format date to match the design (e.g., "May 21")
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Format team players (e.g., "Lance and Reily")
  const formatTeam = (players: string[]) => {
    if (players.length === 0) return "No players";
    if (players.length === 1) return players[0];
    if (players.length === 2) return `${players[0]} and ${players[1]}`;
    return `${players[0]}, ${players[1]} and ${players[2]}`;
  };

  // Determine winning team
  const getWinningTeam = (match: Match) => {
    if (match.teamOneGamesWon > match.teamTwoGamesWon) return "teamOne";
    if (match.teamTwoGamesWon > match.teamOneGamesWon) return "teamTwo";
    return "tie";
  };

  // Filter matches by date range and player name
  const filteredMatches = matches.filter((match) => {
    // Date range filter
    const matchDate = new Date(match.date);
    if (fromDate) {
      const fromDateTime = new Date(fromDate);
      if (matchDate < fromDateTime) return false;
    }
    if (toDate) {
      const toDateTime = new Date(toDate);
      toDateTime.setHours(23, 59, 59, 999); // Include the entire end date
      if (matchDate > toDateTime) return false;
    }
    
    // Player filter
    if (playerFilter) {
      const searchTerm = playerFilter.toLowerCase();
      const allPlayers = [...match.teamOnePlayers, ...match.teamTwoPlayers];
      const hasPlayer = allPlayers.some(player => 
        player.toLowerCase().includes(searchTerm)
      );
      if (!hasPlayer) return false;
    }
    
    return true;
  });

  // Sort matches by date (most recent first)
  const sortedMatches = [...filteredMatches].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const handleDeleteMatch = async (matchId: number) => {
    if (!confirm("Are you sure you want to delete this match?")) return;

    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete match");
      }

      // Refresh matches
      fetchAllMatches();
    } catch (error) {
      console.error("Error deleting match:", error);
      alert("Failed to delete match. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with title and filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Match History</h1>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Player Search Filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={playerFilter}
              onChange={(e) => setPlayerFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48"
              placeholder="Player name"
            />
            {playerFilter && (
              <button
                onClick={() => setPlayerFilter("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                title="Clear search"
              >
                <X className="h-3 w-3 text-gray-400" />
              </button>
            )}
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="From date"
            />
            <span className="text-sm text-gray-500">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="To date"
            />
          </div>
        </div>
      </div>

      {/* Filter Summary */}
      {(playerFilter || fromDate || toDate) && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-600">Active filters:</span>
          {playerFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
              Player: &quot;{playerFilter}&quot;
              <button
                onClick={() => setPlayerFilter("")}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {(fromDate || toDate) && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md">
              Date: {fromDate && new Date(fromDate).toLocaleDateString()}{fromDate && toDate && ' - '}{toDate && new Date(toDate).toLocaleDateString()}
              <button
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
                className="hover:bg-green-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <span className="text-gray-500">
            ({sortedMatches.length} of {matches.length} matches)
          </span>
        </div>
      )}

      {/* Match History List */}
      <div className="bg-white rounded-lg border">
        {sortedMatches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No matches found.
          </div>
        ) : (
          <div className="divide-y">
            {sortedMatches.map((match) => {
              const winningTeam = getWinningTeam(match);

              return (
                <div
                  key={match.id}
                  className="p-4 hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    {/* Left side: Date and teams */}
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-500 w-12">
                        {formatDate(match.date)}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            winningTeam === "teamOne"
                              ? "text-green-600"
                              : "text-gray-900"
                          }`}
                        >
                          {formatTeam(match.teamOnePlayers)}
                        </span>

                        <span className="text-gray-500 text-sm">vs</span>

                        <span
                          className={`font-medium ${
                            winningTeam === "teamTwo"
                              ? "text-green-600"
                              : "text-gray-900"
                          }`}
                        >
                          {formatTeam(match.teamTwoPlayers)}
                        </span>
                      </div>
                    </div>

                    {/* Right side: Score and delete button */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-medium">
                          {match.teamOneGamesWon} - {match.teamTwoGamesWon}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteMatch(match.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete match"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
