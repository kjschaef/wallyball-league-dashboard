import { NextResponse } from 'next/server';

// Mock match data - in a real app this would come from a database
const mockMatches = [
  {
    id: 1,
    date: '2023-05-10T18:30:00Z',
    teamOnePlayers: ['Troy', 'Nate'],
    teamTwoPlayers: ['Lance', 'Shortt'],
    teamOneGamesWon: 3,
    teamTwoGamesWon: 1
  },
  {
    id: 2,
    date: '2023-05-05T19:00:00Z',
    teamOnePlayers: ['Vamsi', 'Keith'],
    teamTwoPlayers: ['Relly', 'Trevor'],
    teamOneGamesWon: 2,
    teamTwoGamesWon: 3
  },
  {
    id: 3,
    date: '2023-04-28T18:00:00Z',
    teamOnePlayers: ['Prarie', 'Zach'],
    teamTwoPlayers: ['Ambree', 'Smathers'],
    teamOneGamesWon: 3,
    teamTwoGamesWon: 2
  },
  {
    id: 4,
    date: '2023-04-20T17:30:00Z',
    teamOnePlayers: ['Seth J.', 'Andrew Jarrett'],
    teamTwoPlayers: ['Jonathan J.', 'Donna Rolt'],
    teamOneGamesWon: 1,
    teamTwoGamesWon: 3
  },
  {
    id: 5,
    date: '2023-04-15T18:30:00Z',
    teamOnePlayers: ['Troy', 'Lance'],
    teamTwoPlayers: ['Nate', 'Shortt'],
    teamOneGamesWon: 2,
    teamTwoGamesWon: 3
  }
];

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const matchId = parseInt(params.id);

  if (isNaN(matchId)) {
    return NextResponse.json(
      { error: 'Invalid match ID' },
      { status: 400 }
    );
  }

  const match = mockMatches.find(m => m.id === matchId);

  if (!match) {
    return NextResponse.json(
      { error: 'Match not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(match);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const matchId = parseInt(params.id);
  const body = await request.json();

  if (isNaN(matchId)) {
    return NextResponse.json(
      { error: 'Invalid match ID' },
      { status: 400 }
    );
  }

  const matchIndex = mockMatches.findIndex(m => m.id === matchId);

  if (matchIndex === -1) {
    return NextResponse.json(
      { error: 'Match not found' },
      { status: 404 }
    );
  }

  // Update match data
  const updatedMatch = {
    ...mockMatches[matchIndex],
    teamOnePlayers: body.teamOnePlayers || mockMatches[matchIndex].teamOnePlayers,
    teamTwoPlayers: body.teamTwoPlayers || mockMatches[matchIndex].teamTwoPlayers,
    teamOneGamesWon: body.teamOneGamesWon !== undefined ? body.teamOneGamesWon : mockMatches[matchIndex].teamOneGamesWon,
    teamTwoGamesWon: body.teamTwoGamesWon !== undefined ? body.teamTwoGamesWon : mockMatches[matchIndex].teamTwoGamesWon
  };

  // In a real app, this would update the database
  // For this demo, we'll just return the updated match
  return NextResponse.json(updatedMatch);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const matchId = parseInt(params.id);

  if (isNaN(matchId)) {
    return NextResponse.json(
      { error: 'Invalid match ID' },
      { status: 400 }
    );
  }

  const matchIndex = mockMatches.findIndex(m => m.id === matchId);

  if (matchIndex === -1) {
    return NextResponse.json(
      { error: 'Match not found' },
      { status: 404 }
    );
  }

  // In a real app, this would delete from the database
  // For this demo, we'll just return a success message
  return NextResponse.json({ message: 'Match deleted successfully' });
}