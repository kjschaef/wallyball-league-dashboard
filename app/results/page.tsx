"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { PlayerCards } from "../components/PlayerCards";
import { QuarterlyChampions, AnnualChampions } from "../components/SeasonWinners";
import { TopTeams } from "../components/TopTeams";

interface SeasonStats {
  totalMatches: number;
  totalGames: number;
  totalDaysPlayed: number;
}

function SeasonStatistics({ stats }: { stats: SeasonStats | null }) {
  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lifetime Games</CardTitle>
        </CardHeader>
        <CardContent>
          <div data-testid="loading-stats" className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-300 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-300 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <CardTitle>Lifetime Games</CardTitle>
        <Link
          href="/games"
          className="text-sm font-medium text-blue-600 transition hover:text-blue-700 hover:underline"
        >
          View all games
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Total Matches</p>
            <p className="text-2xl font-bold">{stats.totalMatches}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Total Games</p>
            <p className="text-2xl font-bold">{stats.totalGames}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Total Days Played</p>
            <p className="text-2xl font-bold">{stats.totalDaysPlayed}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResultsPage() {
  const { data: seasonStats } = useQuery<SeasonStats>({
    queryKey: ["/api/matches", { stats: true }],
    queryFn: () => fetch("/api/matches?stats=true").then((res) => res.json()),
  });

  return (
    <div className="space-y-10 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Results & Standings</h1>

      <SeasonStatistics stats={seasonStats || null} />

      <QuarterlyChampions />

      <TopTeams />

      <AnnualChampions />

      <PlayerCards />
    </div>
  );
}

