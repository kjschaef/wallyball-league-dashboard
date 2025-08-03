
import { NextRequest, NextResponse } from "next/server";

// Mock data for API response
const mockTrendsData = [
  { date: new Date(2023, 4, 1).toISOString(), winRate: 40 },
  { date: new Date(2023, 4, 8).toISOString(), winRate: 45 },
  { date: new Date(2023, 4, 15).toISOString(), winRate: 52 },
  { date: new Date(2023, 4, 22).toISOString(), winRate: 55 },
  { date: new Date(2023, 4, 29).toISOString(), winRate: 60 }
];

// Monthly data
const mockMonthlyData = [
  { date: new Date(2023, 1, 1).toISOString(), winRate: 38 },
  { date: new Date(2023, 2, 1).toISOString(), winRate: 42 },
  { date: new Date(2023, 3, 1).toISOString(), winRate: 48 },
  { date: new Date(2023, 4, 1).toISOString(), winRate: 53 }
];

// Player specific trend data
const mockPlayerTrendsData = {
  1: [
    { date: new Date(2023, 4, 1).toISOString(), winRate: 45 },
    { date: new Date(2023, 4, 8).toISOString(), winRate: 48 },
    { date: new Date(2023, 4, 15).toISOString(), winRate: 56 },
    { date: new Date(2023, 4, 22).toISOString(), winRate: 60 },
    { date: new Date(2023, 4, 29).toISOString(), winRate: 65 }
  ],
  2: [
    { date: new Date(2023, 4, 1).toISOString(), winRate: 35 },
    { date: new Date(2023, 4, 8).toISOString(), winRate: 40 },
    { date: new Date(2023, 4, 15).toISOString(), winRate: 45 },
    { date: new Date(2023, 4, 22).toISOString(), winRate: 50 },
    { date: new Date(2023, 4, 29).toISOString(), winRate: 55 }
  ]
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const period = searchParams.get("period") || "weekly";
    const playerIdParam = searchParams.get("playerId");
    const playerId = playerIdParam ? parseInt(playerIdParam) : undefined;

    // Return appropriate mock data based on the parameters
    if (playerId) {
      if (mockPlayerTrendsData[playerId as keyof typeof mockPlayerTrendsData]) {
        return NextResponse.json(mockPlayerTrendsData[playerId as keyof typeof mockPlayerTrendsData]);
      }
      // If player ID doesn't match our mock data, return general data
      return NextResponse.json(mockTrendsData);
    }

    if (period === "monthly") {
      return NextResponse.json(mockMonthlyData);
    }

    return NextResponse.json(mockTrendsData);
  } catch (error) {
    console.error("Error fetching performance trends:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance trends" },
      { status: 500 }
    );
  }
}
