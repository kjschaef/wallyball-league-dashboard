import { format } from 'date-fns';
import {
  parseAvailableDays,
  normalizeTimeInputValue,
  getEasternWallTimeNow,
  generateWeekDates,
  getSignupCycleState,
  isDateInSignupWeek,
  parseTime,
  DEFAULT_SIGNUP_SETTINGS,
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

// Testing improvement: Added robust coverage for individual signup utility functions
// covering both expected formats and resilient error handling for malformed data.
describe('parseAvailableDays', () => {
  it('returns default available days when input is null or undefined', () => {
    expect(parseAvailableDays(null)).toEqual(DEFAULT_SIGNUP_SETTINGS.availableDays);
    expect(parseAvailableDays(undefined)).toEqual(DEFAULT_SIGNUP_SETTINGS.availableDays);
    expect(parseAvailableDays('')).toEqual(DEFAULT_SIGNUP_SETTINGS.availableDays);
  });

  it('returns parsed array when given valid JSON', () => {
    expect(parseAvailableDays('["Monday", "Wednesday"]')).toEqual(['Monday', 'Wednesday']);
  });

  // Verify graceful degradation when database stores invalid JSON configuration
  it('falls back to default available days when given malformed JSON', () => {
    expect(parseAvailableDays('["Monday", "Wednes')).toEqual(DEFAULT_SIGNUP_SETTINGS.availableDays);
    expect(parseAvailableDays('{"day": "Monday"}')).toEqual(DEFAULT_SIGNUP_SETTINGS.availableDays);
    expect(parseAvailableDays('[123]')).toEqual(DEFAULT_SIGNUP_SETTINGS.availableDays);
  });
});

describe('normalizeTimeInputValue', () => {
  it('returns fallback for null or empty input', () => {
    expect(normalizeTimeInputValue(null, '12:00')).toBe('12:00');
    expect(normalizeTimeInputValue('', '12:00')).toBe('12:00');
  });

  it('returns normalized time for valid input', () => {
    expect(normalizeTimeInputValue('09:30', '12:00')).toBe('09:30');
    expect(normalizeTimeInputValue('23:59', '12:00')).toBe('23:59');
  });

  // Ensure invalid string patterns correctly trigger fallback behavior
  it('returns fallback for invalid time formats', () => {
    expect(normalizeTimeInputValue('9:30', '12:00')).toBe('12:00'); // missing leading zero
    expect(normalizeTimeInputValue('abcd', '12:00')).toBe('12:00');
    expect(normalizeTimeInputValue('12-00', '12:00')).toBe('12:00');
  });

  // Ensure out-of-bounds inputs gracefully default instead of crashing Date parsing
  it('returns fallback for out of bounds hours or minutes', () => {
    expect(normalizeTimeInputValue('24:00', '12:00')).toBe('12:00');
    expect(normalizeTimeInputValue('12:60', '12:00')).toBe('12:00');
    expect(normalizeTimeInputValue('-1:30', '12:00')).toBe('12:00');
  });
});

describe('parseTime', () => {
  it('parses valid time string', () => {
    expect(parseTime('14:30')).toEqual({ hours: 14, minutes: 30 });
    expect(parseTime('09:05')).toEqual({ hours: 9, minutes: 5 });
  });

  // Ensure time parsing does not throw exceptions when input is missing or malformed
  it('handles missing or malformed input gracefully', () => {
    expect(parseTime('14')).toEqual({ hours: 14, minutes: 0 });
    expect(parseTime('')).toEqual({ hours: 0, minutes: 0 });
    expect(parseTime('ab:cd')).toEqual({ hours: 0, minutes: 0 });
  });
});

describe('isDateInSignupWeek null handling', () => {
  // Edge case coverage for null signupWeekSunday
  it('returns false when signupWeekSunday is null', () => {
    expect(isDateInSignupWeek('2026-01-19', null, defaultSettings.availableDays)).toBe(false);
  });
});
