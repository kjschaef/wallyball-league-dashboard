"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [isExporting, setIsExporting] = useState(false);

  const { data: matches = [] } = useQuery({
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
      .map(id => players.find(p => p.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  const recentMatches = [...matches]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const mostRecentDayWithGames = recentMatches.length > 0 ? new Date(recentMatches[0].date).toLocaleDateString() : null;

  const filteredMatches = recentMatches.filter(match => new Date(match.date).toLocaleDateString() === mostRecentDayWithGames).slice(0,5);

  const shareAsImage = async () => {
    console.log("Share as image functionality will be implemented");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Wallyball Dashboard</h1>
        <Button onClick={shareAsImage} variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share as Image
        </Button>
      </div>

      <div id="dashboard-content">
        {/* PerformanceTrend component will be added later */}
        <p className="text-muted-foreground mb-6">Performance trends will be displayed here</p>

        <Card>
          <CardHeader>
            <CardTitle>Recent Matches - {mostRecentDayWithGames ? format(new Date(mostRecentDayWithGames), "MMM d, yyyy") : "No matches"}</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMatches.length === 0 ? (
              <p className="text-muted-foreground">No matches found</p>
            ) : (
              <div className="grid gap-2">
                {filteredMatches.map((match) => (
                  <div key={match.id} className="flex flex-col py-1.5 px-3 border-b last:border-b-0 hover:bg-muted/50">
                    <div className="grid grid-cols-1 gap-1.5">
                      <div className={cn(
                          "grid grid-cols-[2rem_1fr] items-center gap-2 font-medium text-sm",
                          match.teamOneGamesWon > match.teamTwoGamesWon ? "text-green-600 dark:text-green-500" : ""
                        )}>
                          <div className="font-bold tabular-nums text-center">
                            {match.teamOneGamesWon}
                          </div>
                          <div className="min-w-0">
                            {formatTeam([match.teamOnePlayerOneId, match.teamOnePlayerTwoId, match.teamOnePlayerThreeId])}
                          </div>
                        </div>
                        {/* Team Two */}
                        <div className={cn(
                          "grid grid-cols-[2rem_1fr] items-center gap-2 font-medium text-sm",
                          match.teamTwoGamesWon > match.teamOneGamesWon ? "text-green-600 dark:text-green-500" : ""
                        )}>
                          <div className="font-bold tabular-nums text-center">
                            {match.teamTwoGamesWon}
                          </div>
                          <div className="min-w-0">
                            {formatTeam([match.teamTwoPlayerOneId, match.teamTwoPlayerTwoId, match.teamTwoPlayerThreeId])}
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

      {/* FloatingActionButton will be added later */}
      <div className="fixed bottom-6 right-6">
        <Button className="rounded-full h-14 w-14 shadow-lg">+</Button>
      </div>
    </div>
  );
}
