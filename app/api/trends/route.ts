import { NextResponse } from 'next/server';

// Mock trend data to use as fallback if fetching fails
const mockTrendData = [
  {
    date: '2023-05-04T00:00:00Z',
    'Troy': 57,
    'Nate': 56,
    'Lance': 45,
    'Shortt': 45,
    'Vamsi': 42
  },
  {
    date: '2023-05-11T00:00:00Z',
    'Troy': 55,
    'Nate': 57,
    'Lance': 45,
    'Shortt': 45,
    'Vamsi': 42
  }
];

export async function GET() {
  try {
    // Server-side fetch from the original site
    const response = await fetch('https://cfa-wally-stats.replit.app/api/trends', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store' // Disable caching for now
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching trends data from original API:', error);
    // Return mock data as fallback
    return NextResponse.json(mockTrendData);
  }
}