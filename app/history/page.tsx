"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { cn } from "../lib/utils";
import { CalendarIcon, Trash2 } from "lucide-react";

export default function GameHistory() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const { data: matches = [], refetch } = useQuery({
    queryKey: ["/api/matches"],
    queryFn: () => fetch("/api/matches").then(res => res.json())
  });

  const { data: players = [] } = useQuery({
    queryKey: ["/api/players"],
    queryFn: () => fetch("/api/players").then(res => res.json())
  });

  const formatTeam = (playerIds: (number | null)[]) => {
    return playerIds
      .filter((id): id is number => id !== null)
      .map(id => players.find((p: any) => p.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  const filteredMatches = matches.filter((match: any) => {
    if (!selectedDate) return true;
    const matchDate = new Date(match.date);
    return (
      matchDate.getDate() === selectedDate.getDate() &&
      matchDate.getMonth() === selectedDate.getMonth() &&
      matchDate.getFullYear() === selectedDate.getFullYear()
    );
  }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const deleteMatch = async (matchId: number) => {
    if (window.confirm("Are you sure you want to delete this match?")) {
      try {
        await fetch(`/api/matches/${matchId}`, {
          method: "DELETE",
        });
        refetch();
      } catch (error) {
        console.error("Error deleting match:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Game History</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Filter by date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate
              ? `Matches on ${format(selectedDate, "MMMM d, yyyy")}`
              : "All Matches"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMatches.length === 0 ? (
            <p className="text-muted-foreground">No matches found</p>
          ) : (
            <div className="space-y-4">
              {filteredMatches.map((match: any) => (
                <div
                  key={match.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(match.date), "MMMM d, yyyy")}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMatch(match.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <div
                      className={cn(
                        "grid grid-cols-[2rem_1fr] items-center gap-2 font-medium",
                        match.teamOneGamesWon > match.teamTwoGamesWon
                          ? "text-green-600 dark:text-green-500"
                          : ""
                      )}
                    >
                      <div className="font-bold tabular-nums text-center">
                        {match.teamOneGamesWon}
                      </div>
                      <div className="min-w-0">
                        {formatTeam([
                          match.teamOnePlayerOneId,
                          match.teamOnePlayerTwoId,
                          match.teamOnePlayerThreeId,
                        ])}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "grid grid-cols-[2rem_1fr] items-center gap-2 font-medium",
                        match.teamTwoGamesWon > match.teamOneGamesWon
                          ? "text-green-600 dark:text-green-500"
                          : ""
                      )}
                    >
                      <div className="font-bold tabular-nums text-center">
                        {match.teamTwoGamesWon}
                      </div>
                      <div className="min-w-0">
                        {formatTeam([
                          match.teamTwoPlayerOneId,
                          match.teamTwoPlayerTwoId,
                          match.teamTwoPlayerThreeId,
                        ])}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
