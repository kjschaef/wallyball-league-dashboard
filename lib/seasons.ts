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

  // Map to SeasonInfo with ids starting at 1 (current = 1)
  const mapped: SeasonInfo[] = seasons.map((s, idx) => ({
    id: idx + 1,
    name: `${s.year} Q${s.quarter}`,
    start_date: s.start_date,
    end_date: s.end_date,
    is_active: idx === 0
  }));

  return mapped;
}

export function getSeasonById(id: number): SeasonInfo | null {
  if (id === 0) return { id: 0, name: 'Lifetime', start_date: '', end_date: '' };
  const seasons = listSeasons(64);
  return seasons.find(s => s.id === id) || null;
}

export function getSeasonIdFromMatch(matchDate: string, seasons: SeasonInfo[]): number | null {
  const date = new Date(matchDate);
  for (const season of seasons) {
    if (!season.start_date || !season.end_date) continue;
    const start = new Date(season.start_date + 'T00:00:00');
    const end = new Date(season.end_date + 'T23:59:59');
    if (date >= start && date <= end) return season.id;
  }
  return null;
}
