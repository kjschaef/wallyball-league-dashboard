export interface SeasonInfo {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

function quarterForDate(d: Date) {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const quarter = month >= 10 ? 4 : month >= 7 ? 3 : month >= 4 ? 2 : 1;
  let start_date = '';
  let end_date = '';
  if (quarter === 1) {
    start_date = `${year}-01-01`;
    end_date = `${year}-03-31`;
  } else if (quarter === 2) {
    start_date = `${year}-04-01`;
    end_date = `${year}-06-30`;
  } else if (quarter === 3) {
    start_date = `${year}-07-01`;
    end_date = `${year}-09-30`;
  } else {
    start_date = `${year}-10-01`;
    end_date = `${year}-12-31`;
  }
  return { year, quarter, start_date, end_date };
}

export function getCurrentSeasonByDate(date: Date) {
  const q = quarterForDate(date);
  return { name: `${q.year} Q${q.quarter}`, start_date: q.start_date, end_date: q.end_date };
}

// listSeasons: returns computed quarter seasons between an optional earliestDate and now.
// If earliestDate is omitted, returns the last `numberOfQuarters` quarters (default 8).
export function listSeasons(numberOfQuarters = 8, earliestDate?: string): SeasonInfo[] {
  const now = new Date();
  const current = quarterForDate(now);

  let seasons: Array<{ year: number; quarter: number; start_date: string; end_date: string }> = [];

  if (earliestDate) {
    const d = new Date(earliestDate);
    const start = quarterForDate(d);
    // Build from start (inclusive) forward to current (inclusive)
    let y = start.year;
    let q = start.quarter;
    while (y < current.year || (y === current.year && q <= current.quarter)) {
      const sd = (q === 1) ? `${y}-01-01` : (q === 2) ? `${y}-04-01` : (q === 3) ? `${y}-07-01` : `${y}-10-01`;
      const ed = (q === 1) ? `${y}-03-31` : (q === 2) ? `${y}-06-30` : (q === 3) ? `${y}-09-30` : `${y}-12-31`;
      seasons.push({ year: y, quarter: q, start_date: sd, end_date: ed });
      q++;
      if (q > 4) { q = 1; y++; }
      // safety guard
      if (seasons.length > 200) break;
    }
    // reverse so current quarter is first
    seasons = seasons.reverse();
  } else {
    // build last N quarters
    let y = current.year;
    let q = current.quarter;
    for (let i = 0; i < numberOfQuarters; i++) {
      const sd = (q === 1) ? `${y}-01-01` : (q === 2) ? `${y}-04-01` : (q === 3) ? `${y}-07-01` : `${y}-10-01`;
      const ed = (q === 1) ? `${y}-03-31` : (q === 2) ? `${y}-06-30` : (q === 3) ? `${y}-09-30` : `${y}-12-31`;
      seasons.push({ year: y, quarter: q, start_date: sd, end_date: ed });
      q--;
      if (q < 1) { q = 4; y--; }
    }
  }

  // Create map of quarters with deterministic IDs
  // ID Format: YYYYQ (e.g. 20251 for 2025 Q1)
  const quarterSeasons: SeasonInfo[] = seasons.map((s, idx) => ({
    id: s.year * 10 + s.quarter,
    name: `${s.year} Q${s.quarter}`,
    start_date: s.start_date,
    end_date: s.end_date,
    is_active: idx === 0
  }));

  // Extract unique years and create annual seasons
  // ID Format: YYYY0 (e.g. 20250 for 2025 Full Year)
  const years = Array.from(new Set(seasons.map(s => s.year))).sort((a, b) => b - a);
  const annualSeasons: SeasonInfo[] = years.map(year => ({
    id: year * 10,
    name: `${year}`,
    start_date: `${year}-01-01`,
    end_date: `${year}-12-31`,
    is_active: false
  }));

  // Combine
  return [...quarterSeasons, ...annualSeasons];
}

export function getSeasonById(id: number): SeasonInfo | null {
  if (id === 0) return { id: 0, name: 'Lifetime', start_date: '', end_date: '' };

  // Parse deterministic ID
  const quarter = id % 10;
  const year = Math.floor(id / 10);

  if (quarter === 0) {
    // Annual Season
    return {
      id,
      name: `${year}`,
      start_date: `${year}-01-01`,
      end_date: `${year}-12-31`,
      is_active: false
    };
  } else if (quarter >= 1 && quarter <= 4) {
    // Quarterly Season
    const start_date = (quarter === 1) ? `${year}-01-01` : (quarter === 2) ? `${year}-04-01` : (quarter === 3) ? `${year}-07-01` : `${year}-10-01`;
    const end_date = (quarter === 1) ? `${year}-03-31` : (quarter === 2) ? `${year}-06-30` : (quarter === 3) ? `${year}-09-30` : `${year}-12-31`;
    return {
      id,
      name: `${year} Q${quarter}`,
      start_date,
      end_date,
      is_active: false // We can't easily determine active here without 'now', defaulting false is usually fine for lookup
    };
  }

  return null;
}

export function getSeasonIdFromMatch(matchDate: string, _seasons?: SeasonInfo[]): number | null {
  const date = new Date(matchDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const quarter = month >= 10 ? 4 : month >= 7 ? 3 : month >= 4 ? 2 : 1;

  // Returns the Quarter ID by default as it's the primary unit
  return year * 10 + quarter;
}

