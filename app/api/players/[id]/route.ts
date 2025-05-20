import { NextResponse } from 'next/server';

// Mock player data - in a real app this would come from a database
const mockPlayers = [
  {
    id: 1,
    name: 'Troy',
    startYear: 2020,
    createdAt: new Date(2020, 0, 1).toISOString(),
    matches: Array(15).fill(null).map((_, i) => ({
      id: i + 1,
      date: new Date(2023, 0, i + 1).toISOString(),
      won: Math.random() > 0.3,
      isTeamOne: Math.random() > 0.5,
      teamOneGamesWon: Math.floor(Math.random() * 3) + 1,
      teamTwoGamesWon: Math.floor(Math.random() * 3) + 1,
    })),
    stats: { won: 11, lost: 4, totalGames: 45, totalMatchTime: 540 }
  },
  {
    id: 2,
    name: 'Nate',
    startYear: 2019,
    createdAt: new Date(2019, 0, 1).toISOString(),
    matches: Array(25).fill(null).map((_, i) => ({
      id: i + 100,
      date: new Date(2023, 0, i + 1).toISOString(),
      won: Math.random() > 0.4,
      isTeamOne: Math.random() > 0.5,
      teamOneGamesWon: Math.floor(Math.random() * 3) + 1,
      teamTwoGamesWon: Math.floor(Math.random() * 3) + 1,
    })),
    stats: { won: 14, lost: 11, totalGames: 280, totalMatchTime: 3200 }
  },
  {
    id: 3,
    name: 'Lance',
    startYear: 2021,
    createdAt: new Date(2021, 0, 1).toISOString(),
    matches: Array(10).fill(null).map((_, i) => ({
      id: i + 200,
      date: new Date(2023, 0, i + 1).toISOString(),
      won: Math.random() > 0.45,
      isTeamOne: Math.random() > 0.5,
      teamOneGamesWon: Math.floor(Math.random() * 3) + 1,
      teamTwoGamesWon: Math.floor(Math.random() * 3) + 1,
    })),
    stats: { won: 6, lost: 4, totalGames: 30, totalMatchTime: 360 }
  },
  {
    id: 4,
    name: 'Shortt',
    startYear: 2018,
    createdAt: new Date(2018, 0, 1).toISOString(),
    matches: Array(30).fill(null).map((_, i) => ({
      id: i + 300,
      date: new Date(2023, 0, i + 1).toISOString(),
      won: Math.random() > 0.48,
      isTeamOne: Math.random() > 0.5,
      teamOneGamesWon: Math.floor(Math.random() * 3) + 1,
      teamTwoGamesWon: Math.floor(Math.random() * 3) + 1,
    })),
    stats: { won: 15, lost: 15, totalGames: 90, totalMatchTime: 1080 }
  },
  {
    id: 5,
    name: 'Vamsi',
    startYear: 2021,
    createdAt: new Date(2021, 0, 1).toISOString(),
    matches: Array(12).fill(null).map((_, i) => ({
      id: i + 400,
      date: new Date(2023, 0, i + 1).toISOString(),
      won: Math.random() > 0.5,
      isTeamOne: Math.random() > 0.5,
      teamOneGamesWon: Math.floor(Math.random() * 3) + 1,
      teamTwoGamesWon: Math.floor(Math.random() * 3) + 1,
    })),
    stats: { won: 6, lost: 6, totalGames: 36, totalMatchTime: 432 }
  }
];

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const playerId = parseInt(params.id);

  if (isNaN(playerId)) {
    return NextResponse.json(
      { error: 'Invalid player ID' },
      { status: 400 }
    );
  }

  const player = mockPlayers.find(p => p.id === playerId);

  if (!player) {
    return NextResponse.json(
      { error: 'Player not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(player);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const playerId = parseInt(params.id);
  const body = await request.json();

  if (isNaN(playerId)) {
    return NextResponse.json(
      { error: 'Invalid player ID' },
      { status: 400 }
    );
  }

  const playerIndex = mockPlayers.findIndex(p => p.id === playerId);

  if (playerIndex === -1) {
    return NextResponse.json(
      { error: 'Player not found' },
      { status: 404 }
    );
  }

  // Update player data
  const updatedPlayer = {
    ...mockPlayers[playerIndex],
    name: body.name || mockPlayers[playerIndex].name,
    startYear: body.startYear !== undefined ? body.startYear : mockPlayers[playerIndex].startYear
  };

  // In a real app, this would update the database
  // For this demo, we'll just return the updated player
  return NextResponse.json(updatedPlayer);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const playerId = parseInt(params.id);

  if (isNaN(playerId)) {
    return NextResponse.json(
      { error: 'Invalid player ID' },
      { status: 400 }
    );
  }

  const playerIndex = mockPlayers.findIndex(p => p.id === playerId);

  if (playerIndex === -1) {
    return NextResponse.json(
      { error: 'Player not found' },
      { status: 404 }
    );
  }

  // In a real app, this would delete from the database
  // For this demo, we'll just return a success message
  return NextResponse.json({ message: 'Player deleted successfully' });
}