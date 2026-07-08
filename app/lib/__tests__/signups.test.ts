import { format } from 'date-fns';
import {
  generateWeekDates,
  getSignupCycleState,
  isDateInSignupWeek,
  parseAvailableDays,
  normalizeTimeInputValue,
  getEasternWallTimeNow,
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

describe('parseAvailableDays', () => {
  it('returns default available days when input is null or undefined', () => {
    expect(parseAvailableDays(null)).toEqual(DEFAULT_SIGNUP_SETTINGS.availableDays);
    expect(parseAvailableDays(undefined)).toEqual(DEFAULT_SIGNUP_SETTINGS.availableDays);
  });

  it('returns parsed array when input is valid JSON string array of strings', () => {
    expect(parseAvailableDays(JSON.stringify(['Monday', 'Wednesday']))).toEqual(['Monday', 'Wednesday']);
  });

  it('returns default available days when JSON is malformed', () => {
    expect(parseAvailableDays('invalid-json')).toEqual(DEFAULT_SIGNUP_SETTINGS.availableDays);
  });

  it('returns default available days when parsed JSON is not an array of strings', () => {
    expect(parseAvailableDays(JSON.stringify([1, 2, 3]))).toEqual(DEFAULT_SIGNUP_SETTINGS.availableDays);
    expect(parseAvailableDays(JSON.stringify({ day: 'Monday' }))).toEqual(DEFAULT_SIGNUP_SETTINGS.availableDays);
  });
});

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

describe('normalizeTimeInputValue', () => {
  it('returns fallback when input is null or undefined', () => {
    expect(normalizeTimeInputValue(null, '12:00')).toBe('12:00');
    expect(normalizeTimeInputValue(undefined, '12:00')).toBe('12:00');
  });

  it('returns normalized match when input is a valid HH:mm string', () => {
    expect(normalizeTimeInputValue('09:30', '12:00')).toBe('09:30');
    expect(normalizeTimeInputValue('14:45', '12:00')).toBe('14:45');
  });

  it('returns fallback when input has invalid format without match', () => {
    expect(normalizeTimeInputValue('invalid', '12:00')).toBe('12:00');
    expect(normalizeTimeInputValue('9:30', '12:00')).toBe('12:00'); // missing leading zero
    expect(normalizeTimeInputValue('09-30', '12:00')).toBe('12:00');
  });

  it('returns fallback when hours or minutes are out of bounds', () => {
    expect(normalizeTimeInputValue('25:00', '12:00')).toBe('12:00');
    expect(normalizeTimeInputValue('12:60', '12:00')).toBe('12:00');
    expect(normalizeTimeInputValue('-1:30', '12:00')).toBe('12:00');
  });
});

describe('getEasternWallTimeNow', () => {
  it('correctly returns current time in America/New_York timezone based on a reference date', () => {
    // A UTC date that differs from Eastern Time.
    // E.g., Jan 1st 2026, 17:00 UTC is 12:00 PM EST.
    const reference = new Date('2026-01-01T17:00:00Z');
    const etDate = getEasternWallTimeNow(reference);

    expect(format(etDate, 'yyyy-MM-dd HH:mm')).toBe('2026-01-01 12:00');
  });
});

describe('getSignupCycleState - edge cases', () => {
  it('handles rolling close time past open time correctly', () => {
    // Open on Sunday 12:00, Close on Sunday 10:00 (which rolls to next Sunday 10:00)
    const rolloverSettings: SignupSettings = {
      ...defaultSettings,
      signupOpenDayOfWeek: 0,
      signupOpenTime: '12:00',
      signupCloseDayOfWeek: 0,
      signupCloseTime: '10:00',
    };

    // Sunday Jan 11 2026, 13:00 -> should be open, closes on Jan 18 2026, 10:00
    const now = new Date(2026, 0, 11, 13, 0, 0);
    const state = getSignupCycleState(now, rolloverSettings);

    expect(state.isOpen).toBe(true);
    expect(format(state.openDateTime!, 'yyyy-MM-dd HH:mm')).toBe('2026-01-11 12:00');
    expect(format(state.closeDateTime, 'yyyy-MM-dd HH:mm')).toBe('2026-01-18 10:00');
  });
});

describe('isDateInSignupWeek - edge cases', () => {
  it('returns false when signupWeekSunday is null', () => {
    expect(isDateInSignupWeek('2026-01-19', null, defaultSettings.availableDays)).toBe(false);
  });
});
