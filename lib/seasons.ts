export interface SeasonInfo {
  name: string;
  start_date: string;
  end_date: string;
}

export function getCurrentSeasonByDate(date: Date): SeasonInfo {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() is 0-indexed
  
  if (month >= 1 && month <= 3) {
    return {
      name: `${year} Q1`,
      start_date: `${year}-01-01`,
      end_date: `${year}-03-31`
    };
  } else if (month >= 4 && month <= 6) {
    return {
      name: `${year} Q2`,
      start_date: `${year}-04-01`,
      end_date: `${year}-06-30`
    };
  } else if (month >= 7 && month <= 9) {
    return {
      name: `${year} Q3`,
      start_date: `${year}-07-01`,
      end_date: `${year}-09-30`
    };
  } else {
    return {
      name: `${year} Q4`,
      start_date: `${year}-10-01`,
      end_date: `${year}-12-31`
    };
  }
}

export function getSeasonIdFromMatch(matchDate: string, seasons: any[]): number | null {
  const date = new Date(matchDate);
  
  for (const season of seasons) {
    const startDate = new Date(season.start_date);
    const endDate = new Date(season.end_date);
    
    if (date >= startDate && date <= endDate) {
      return season.id;
    }
  }
  
  return null;
}