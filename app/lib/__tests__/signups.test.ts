import { format } from 'date-fns';
import {
  generateWeekDates,
  getSignupCycleState,
  isDateInSignupWeek,
  parseAvailableDays,
  normalizeTimeInputValue,
  getEasternWallTimeNow,
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
});

describe('parseAvailableDays', () => {
  it('returns default available days for null or undefined input', () => {
    expect(parseAvailableDays(null)).toEqual(DEFAULT_SIGNUP_SETTINGS.availableDays);
    expect(parseAvailableDays(undefined)).toEqual(DEFAULT_SIGNUP_SETTINGS.availableDays);
    expect(parseAvailableDays('')).toEqual(DEFAULT_SIGNUP_SETTINGS.availableDays);
  });

  it('parses valid JSON string arrays', () => {
    const expected = ['Monday', 'Wednesday'];
    expect(parseAvailableDays(JSON.stringify(expected))).toEqual(expected);
  });

  it('returns default available days for malformed JSON or non-string arrays', () => {
    expect(parseAvailableDays('malformed')).toEqual(DEFAULT_SIGNUP_SETTINGS.availableDays);
    expect(parseAvailableDays('{"invalid": "format"}')).toEqual(DEFAULT_SIGNUP_SETTINGS.availableDays);
    expect(parseAvailableDays('[1, 2, 3]')).toEqual(DEFAULT_SIGNUP_SETTINGS.availableDays);
  });
});

describe('normalizeTimeInputValue', () => {
  const fallback = '12:00';

  it('returns normalized time for valid input', () => {
    expect(normalizeTimeInputValue('09:30', fallback)).toBe('09:30');
    expect(normalizeTimeInputValue('14:45', fallback)).toBe('14:45');
    expect(normalizeTimeInputValue('00:00', fallback)).toBe('00:00');
    expect(normalizeTimeInputValue('23:59', fallback)).toBe('23:59');
  });

  it('returns fallback for invalid formats or null/undefined', () => {
    expect(normalizeTimeInputValue(null, fallback)).toBe(fallback);
    expect(normalizeTimeInputValue(undefined, fallback)).toBe(fallback);
    expect(normalizeTimeInputValue('', fallback)).toBe(fallback);
    expect(normalizeTimeInputValue('9:30', fallback)).toBe(fallback); // Missing leading zero
    expect(normalizeTimeInputValue('invalid', fallback)).toBe(fallback);
  });

  it('returns fallback for out-of-range values', () => {
    expect(normalizeTimeInputValue('24:00', fallback)).toBe(fallback); // Hour out of range
    expect(normalizeTimeInputValue('12:60', fallback)).toBe(fallback); // Minute out of range
    expect(normalizeTimeInputValue('-1:30', fallback)).toBe(fallback); // Negative
  });
});

describe('getEasternWallTimeNow', () => {
  it('returns correct timezone conversion', () => {
    // 2024-01-01T12:00:00Z in UTC is 2024-01-01T07:00:00-05:00 in Eastern
    const reference = new Date('2024-01-01T12:00:00Z');
    const result = getEasternWallTimeNow(reference);

    // Validate we got a local date correctly adjusted
    // In our CI/test environments, testing exactly what local time object it creates can be tricky,
    // so we verify it converted the specific components to match the NY string output.
    const expectedTimeString = reference.toLocaleString('en-US', { timeZone: 'America/New_York' });
    const resultTimeString = result.toLocaleString('en-US'); // It's created as local time from the NY string

    expect(resultTimeString).toBe(expectedTimeString);
  });
});

describe('parseTime', () => {
  it('parses hours and minutes from string', () => {
    expect(parseTime('14:30')).toEqual({ hours: 14, minutes: 30 });
    expect(parseTime('09:05')).toEqual({ hours: 9, minutes: 5 });
  });

  it('falls back to 0 for missing or invalid components', () => {
    expect(parseTime('')).toEqual({ hours: 0, minutes: 0 });
    expect(parseTime('invalid')).toEqual({ hours: 0, minutes: 0 });
    expect(parseTime('14:')).toEqual({ hours: 14, minutes: 0 });
    expect(parseTime(':30')).toEqual({ hours: 0, minutes: 30 });
  });
});
