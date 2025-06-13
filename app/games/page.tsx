
"use client";

import { useState, useEffect } from "react";
import { Calendar, Trash2 } from "lucide-react";

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
  const [dateFilter, setDateFilter] = useState("");

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

  // Filter matches by date if filter is applied
  const filteredMatches = matches.filter((match) => {
    if (!dateFilter) return true;
    const matchDate = new Date(match.date).toISOString().split("T")[0];
    return matchDate === dateFilter;
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
      {/* Header with title and date filter */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Match History</h1>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Filter by date"
          />
          <span className="text-sm text-gray-500">Filter by date</span>
        </div>
      </div>

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
                  className="p-4 hover:bg-gray-50 transition-colors"
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
