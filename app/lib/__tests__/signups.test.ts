import { format } from 'date-fns';
import {
  parseAvailableDays,
  normalizeTimeInputValue,
  getEasternWallTimeNow,
  generateWeekDates,
  getSignupCycleState,
  isDateInSignupWeek,
  getNoResponsePlayers,
  formatSignupExport,
  type SignupSettings,
} from '../signups';

const defaultSettings: SignupSettings = {
  signupOpenDayOfWeek: 0,
  signupOpenTime: '12:00',
  signupCloseDayOfWeek: 0,
  signupCloseTime: '16:00',
  availableDays: ['Monday', 'Tuesday', 'Thursday'],
};

describe('signup cycle utilities', () => {

  it('handles close time that is earlier than open time (rolls over to next week)', () => {
    // Open on day 0 (Sunday) at 16:00, close on day 0 at 12:00
    // This implies it stays open for almost a full week, closing the *next* Sunday at 12:00
    const settings = {
      ...defaultSettings,
      signupOpenTime: '16:00',
      signupCloseTime: '12:00',
    };

    // Now is Sunday 17:00, should be open
    const state = getSignupCycleState(new Date(2026, 0, 11, 17, 0, 0), settings);

    expect(state.isOpen).toBe(true);
    expect(format(state.closeDateTime, 'yyyy-MM-dd HH:mm')).toBe('2026-01-18 12:00');
  });

  it('stays closed before the configured open time', () => {
    const state = getSignupCycleState(new Date(2026, 0, 11, 11, 0, 0), defaultSettings);

    expect(state.isOpen).toBe(false);
    expect(format(state.currentWeekSunday, 'yyyy-MM-dd')).toBe('2026-01-11');
    expect(format(state.nextOpenDateTime, 'yyyy-MM-dd HH:mm')).toBe('2026-01-11 12:00');
  });

  it('opens only inside the configured same-day signup window', () => {
    const state = getSignupCycleState(new Date(2026, 0, 11, 13, 0, 0), defaultSettings);

    expect(state.isOpen).toBe(true);
    expect(format(state.signupWeekSunday!, 'yyyy-MM-dd')).toBe('2026-01-18');
    expect(format(state.currentWeekSunday, 'yyyy-MM-dd')).toBe('2026-01-11');
  });

  it('returns to closed after the close cutoff and advances the countdown', () => {
    const state = getSignupCycleState(new Date(2026, 0, 12, 9, 0, 0), defaultSettings);

    expect(state.isOpen).toBe(false);
    expect(format(state.currentWeekSunday, 'yyyy-MM-dd')).toBe('2026-01-18');
    expect(format(state.nextOpenDateTime, 'yyyy-MM-dd HH:mm')).toBe('2026-01-18 12:00');
  });

  it('matches dates against the active signup week', () => {
    const signupWeekSunday = new Date(2026, 0, 18, 0, 0, 0);

    expect(generateWeekDates(signupWeekSunday, defaultSettings.availableDays)).toEqual([
      '2026-01-19',
      '2026-01-20',
      '2026-01-22',
    ]);
    expect(isDateInSignupWeek('2026-01-19', signupWeekSunday, defaultSettings.availableDays)).toBe(true);
    expect(isDateInSignupWeek('2026-01-21', signupWeekSunday, defaultSettings.availableDays)).toBe(false);
  });

  it('returns false when signupWeekSunday is null', () => {
    expect(isDateInSignupWeek('2026-01-19', null, defaultSettings.availableDays)).toBe(false);
  });
});

describe('parseAvailableDays', () => {
  it('returns default days when input is null or undefined', () => {
    expect(parseAvailableDays(null)).toEqual(['Monday', 'Tuesday', 'Thursday']);
    expect(parseAvailableDays(undefined)).toEqual(['Monday', 'Tuesday', 'Thursday']);
  });

  it('returns default days when input is invalid JSON', () => {
    expect(parseAvailableDays('{invalid}')).toEqual(['Monday', 'Tuesday', 'Thursday']);
  });

  it('returns default days when input is valid JSON but not an array of strings', () => {
    expect(parseAvailableDays('{"Monday": true}')).toEqual(['Monday', 'Tuesday', 'Thursday']);
    expect(parseAvailableDays('["Monday", 123]')).toEqual(['Monday', 'Tuesday', 'Thursday']);
  });

  it('returns parsed array when input is a valid JSON array of strings', () => {
    expect(parseAvailableDays('["Monday", "Friday"]')).toEqual(['Monday', 'Friday']);
    expect(parseAvailableDays('[]')).toEqual([]);
  });
});

describe('normalizeTimeInputValue', () => {
  const fallback = '12:00';

  it('returns fallback for null or undefined input', () => {
    expect(normalizeTimeInputValue(null, fallback)).toBe(fallback);
    expect(normalizeTimeInputValue(undefined, fallback)).toBe(fallback);
  });

  it('returns fallback for invalid string format', () => {
    expect(normalizeTimeInputValue('invalid', fallback)).toBe(fallback);
    expect(normalizeTimeInputValue('12-00', fallback)).toBe(fallback);
  });

  it('returns fallback for out-of-bounds hours', () => {
    expect(normalizeTimeInputValue('-1:00', fallback)).toBe(fallback);
    expect(normalizeTimeInputValue('24:00', fallback)).toBe(fallback);
  });

  it('returns fallback for out-of-bounds minutes', () => {
    expect(normalizeTimeInputValue('12:-1', fallback)).toBe(fallback);
    expect(normalizeTimeInputValue('12:60', fallback)).toBe(fallback);
  });

  it('returns normalized time for valid input', () => {
    expect(normalizeTimeInputValue('09:30', fallback)).toBe('09:30');
    expect(normalizeTimeInputValue('14:45', fallback)).toBe('14:45');
  });
});

describe('getEasternWallTimeNow', () => {
  it('converts a given date to Eastern Time string representation (implicit test via output)', () => {
    // 2024-01-01T12:00:00Z (UTC) is 07:00:00 AM EST
    const dateUTC = new Date('2024-01-01T12:00:00Z');
    const easternTime = getEasternWallTimeNow(dateUTC);
    // getEasternWallTimeNow returns a Date object created from the locale string
    // So its local time representation will match the Eastern Time numbers
    expect(easternTime.getHours()).toBe(7);
  });
});

describe('getNoResponsePlayers', () => {
  const players = [
    { id: 1, name: 'Charlie' },
    { id: 2, name: 'Alice' },
    { id: 3, name: 'Bob' },
    { id: 4, name: 'Dave' },
  ];

  it('returns all players sorted when no one has responded or marked out', () => {
    const noResponse = getNoResponsePlayers(players, [], [], ['2026-01-19', '2026-01-20'], '2026-01-18');
    expect(noResponse.map((p) => p.name)).toEqual(['Alice', 'Bob', 'Charlie', 'Dave']);
  });

  it('filters out players who have signed up for any day in the week', () => {
    const signups = [{ player_id: 2, date: '2026-01-19' }];
    const noResponse = getNoResponsePlayers(players, signups, [], ['2026-01-19', '2026-01-20'], '2026-01-18');
    expect(noResponse.map((p) => p.name)).toEqual(['Bob', 'Charlie', 'Dave']);
  });

  it('filters out players who are marked unavailable for that week', () => {
    const unavailable = [{ player_id: 3, week_start: '2026-01-18' }];
    const noResponse = getNoResponsePlayers(players, [], unavailable, ['2026-01-19', '2026-01-20'], '2026-01-18');
    expect(noResponse.map((p) => p.name)).toEqual(['Alice', 'Charlie', 'Dave']);
  });

  it('filters out both signed up and unavailable players', () => {
    const signups = [{ player_id: 1, date: '2026-01-20' }];
    const unavailable = [{ player_id: 4, week_start: '2026-01-18' }];
    const noResponse = getNoResponsePlayers(players, signups, unavailable, ['2026-01-19', '2026-01-20'], '2026-01-18');
    expect(noResponse.map((p) => p.name)).toEqual(['Alice', 'Bob']);
  });

  it('does not filter out players with signups on different weeks or unavailable on different weeks', () => {
    const signups = [{ player_id: 2, date: '2026-01-12' }];
    const unavailable = [{ player_id: 3, week_start: '2026-01-11' }];
    const noResponse = getNoResponsePlayers(players, signups, unavailable, ['2026-01-19', '2026-01-20'], '2026-01-18');
    expect(noResponse.map((p) => p.name)).toEqual(['Alice', 'Bob', 'Charlie', 'Dave']);
  });
});

describe('formatSignupExport', () => {
  const sunday = new Date('2026-01-18T00:00:00');
  const dates = ['2026-01-19', '2026-01-20'];
  const players = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
    { id: 4, name: 'Dave' },
  ];

  it('includes day breakdowns, Out list, and No Response list', () => {
    const signups = [
      { id: 10, player_id: 1, name: 'Alice', date: '2026-01-19', status: 'registered' as const },
    ];
    const unavailable = [
      { id: 20, player_id: 2, name: 'Bob', week_start: '2026-01-18' },
    ];

    const result = formatSignupExport({
      sunday,
      dates,
      signups,
      unavailablePlayers: unavailable,
      players,
    });

    expect(result).toContain('Week of January 19 // 6:30-8:00 am');
    expect(result).toContain('Monday - OPEN\n- Alice\n-');
    expect(result).toContain('Tuesday - OPEN\n-');
    expect(result).toContain('Out: Bob');
    expect(result).toContain('No Response: Charlie, Dave');
  });

  it('omits Out and No Response sections when empty', () => {
    const signups = [
      { id: 10, player_id: 1, name: 'Alice', date: '2026-01-19', status: 'registered' as const },
      { id: 11, player_id: 2, name: 'Bob', date: '2026-01-19', status: 'registered' as const },
      { id: 12, player_id: 3, name: 'Charlie', date: '2026-01-20', status: 'registered' as const },
      { id: 13, player_id: 4, name: 'Dave', date: '2026-01-20', status: 'registered' as const },
    ];

    const result = formatSignupExport({
      sunday,
      dates,
      signups,
      unavailablePlayers: [],
      players,
    });

    expect(result).not.toContain('Out:');
    expect(result).not.toContain('No Response:');
  });
});

