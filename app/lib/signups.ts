import { addDays, format } from 'date-fns';

export interface SignupSettings {
  signupOpenDayOfWeek: number;
  signupOpenTime: string;
  signupCloseDayOfWeek: number;
  signupCloseTime: string;
  availableDays: string[];
}

interface SignupWindow {
  weekSunday: Date;
  openDateTime: Date;
  closeDateTime: Date;
}

export interface SignupCycleState {
  isOpen: boolean;
  signupWeekSunday: Date | null;
  currentWeekSunday: Date;
  nextOpenDateTime: Date;
  openDateTime: Date | null;
  closeDateTime: Date;
}

export function getEasternWallTimeNow(reference: Date = new Date()): Date {
  return new Date(reference.toLocaleString('en-US', { timeZone: 'America/New_York' }));
}

export function generateWeekDates(weekSunday: Date, availableDays: string[]): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const date = addDays(weekSunday, i);
    if (availableDays.includes(format(date, 'EEEE'))) {
      dates.push(format(date, 'yyyy-MM-dd'));
    }
  }
  return dates;
}

export function getSunday(date: Date): Date {
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - date.getDay());
  sunday.setHours(0, 0, 0, 0);
  return sunday;
}

export function parseTime(time: string): { hours: number; minutes: number } {
  const [rawHours = '0', rawMinutes = '0'] = time.split(':');
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);

  return {
    hours: Number.isFinite(hours) ? hours : 0,
    minutes: Number.isFinite(minutes) ? minutes : 0,
  };
}

function getDateTimeInWeek(weekSunday: Date, dayOfWeek: number, time: string): Date {
  const target = addDays(weekSunday, dayOfWeek);
  const { hours, minutes } = parseTime(time);
  target.setHours(hours, minutes, 0, 0);
  return target;
}

function getSignupWindow(weekSunday: Date, settings: SignupSettings): SignupWindow {
  const openDateTime = getDateTimeInWeek(weekSunday, settings.signupOpenDayOfWeek, settings.signupOpenTime);
  const closeDateTime = getDateTimeInWeek(weekSunday, settings.signupCloseDayOfWeek, settings.signupCloseTime);

  // Support close times that roll past the configured open point.
  if (closeDateTime <= openDateTime) {
    closeDateTime.setDate(closeDateTime.getDate() + 7);
  }

  return {
    weekSunday: new Date(weekSunday),
    openDateTime,
    closeDateTime,
  };
}

function isWithinSignupWindow(now: Date, window: SignupWindow): boolean {
  return now >= window.openDateTime && now < window.closeDateTime;
}

export function getSignupCycleState(now: Date, settings: SignupSettings): SignupCycleState {
  const currentSunday = getSunday(now);
  const nextSunday = addDays(currentSunday, 7);
  const currentWindow = getSignupWindow(currentSunday, settings);
  const nextWindow = getSignupWindow(nextSunday, settings);

  if (isWithinSignupWindow(now, currentWindow)) {
    return {
      isOpen: true,
      signupWeekSunday: nextSunday,
      currentWeekSunday: currentSunday,
      nextOpenDateTime: nextWindow.openDateTime,
      openDateTime: currentWindow.openDateTime,
      closeDateTime: currentWindow.closeDateTime,
    };
  }

  if (now < currentWindow.openDateTime) {
    return {
      isOpen: false,
      signupWeekSunday: null,
      currentWeekSunday: currentSunday,
      nextOpenDateTime: currentWindow.openDateTime,
      openDateTime: null,
      closeDateTime: currentWindow.closeDateTime,
    };
  }

  return {
    isOpen: false,
    signupWeekSunday: null,
    currentWeekSunday: nextSunday,
    nextOpenDateTime: nextWindow.openDateTime,
    openDateTime: null,
    closeDateTime: currentWindow.closeDateTime,
  };
}

export function isDateInSignupWeek(
  date: string,
  signupWeekSunday: Date | null,
  availableDays: string[],
): boolean {
  if (!signupWeekSunday) {
    return false;
  }

  return generateWeekDates(signupWeekSunday, availableDays).includes(date);
}
