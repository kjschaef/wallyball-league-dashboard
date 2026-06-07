import { format } from "date-fns";
import { parseAvailableDays, normalizeTimeInputValue, parseTime,
  generateWeekDates,
  getSignupCycleState,
  isDateInSignupWeek,
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
  it('returns default available days when given null or undefined', () => {
    expect(parseAvailableDays(null)).toEqual(defaultSettings.availableDays);
    expect(parseAvailableDays(undefined)).toEqual(defaultSettings.availableDays);
    expect(parseAvailableDays('')).toEqual(defaultSettings.availableDays);
  });

  it('returns parsed array when given valid JSON array of strings', () => {
    const validJson = JSON.stringify(['Monday', 'Wednesday', 'Friday']);
    expect(parseAvailableDays(validJson)).toEqual(['Monday', 'Wednesday', 'Friday']);
  });

  it('returns default available days when given invalid JSON', () => {
    expect(parseAvailableDays('invalid json')).toEqual(defaultSettings.availableDays);
  });

  it('returns default available days when given a non-array JSON object', () => {
    expect(parseAvailableDays(JSON.stringify({ day: 'Monday' }))).toEqual(defaultSettings.availableDays);
  });

  it('returns default available days when given an array with non-string elements', () => {
    expect(parseAvailableDays(JSON.stringify(['Monday', 1, true]))).toEqual(defaultSettings.availableDays);
  });
});

describe('normalizeTimeInputValue', () => {
  it('returns fallback for null, undefined, or empty string', () => {
    expect(normalizeTimeInputValue(null, '12:00')).toBe('12:00');
    expect(normalizeTimeInputValue(undefined, '12:00')).toBe('12:00');
    expect(normalizeTimeInputValue('', '12:00')).toBe('12:00');
  });

  it('returns fallback for completely invalid formats', () => {
    expect(normalizeTimeInputValue('invalid', '12:00')).toBe('12:00');
    expect(normalizeTimeInputValue('12-00', '12:00')).toBe('12:00');
    expect(normalizeTimeInputValue('1:00', '12:00')).toBe('12:00'); // Requires HH:MM
  });

  it('normalizes valid HH:MM strings', () => {
    expect(normalizeTimeInputValue('14:30', '12:00')).toBe('14:30');
    expect(normalizeTimeInputValue('09:05', '12:00')).toBe('09:05');
  });

  it('returns fallback for out-of-range times', () => {
    expect(normalizeTimeInputValue('25:00', '12:00')).toBe('12:00');
    expect(normalizeTimeInputValue('-1:00', '12:00')).toBe('12:00');
    expect(normalizeTimeInputValue('12:60', '12:00')).toBe('12:00');
  });
});

describe('parseTime', () => {
  it('parses basic HH:MM strings into numbers', () => {
    expect(parseTime('14:30')).toEqual({ hours: 14, minutes: 30 });
    expect(parseTime('09:05')).toEqual({ hours: 9, minutes: 5 });
  });

  it('handles empty strings by returning zeros', () => {
    expect(parseTime('')).toEqual({ hours: 0, minutes: 0 });
  });

  it('handles invalid numbers by returning zeros', () => {
    expect(parseTime('aa:bb')).toEqual({ hours: 0, minutes: 0 });
    expect(parseTime('NaN:NaN')).toEqual({ hours: 0, minutes: 0 });
  });
});
