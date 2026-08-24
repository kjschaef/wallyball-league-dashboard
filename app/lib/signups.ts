import { addDays, format } from 'date-fns';

export interface SignupSettings {
  signupOpenDayOfWeek: number;
  signupOpenTime: string;
  signupCloseDayOfWeek: number;
  signupCloseTime: string;
  availableDays: string[];
}

export const DEFAULT_SIGNUP_SETTINGS: SignupSettings = {
  signupOpenDayOfWeek: 0,
  signupOpenTime: '12:00',
  signupCloseDayOfWeek: 0,
  signupCloseTime: '16:00',
  availableDays: ['Monday', 'Tuesday', 'Thursday'],
};

export function parseAvailableDays(rawAvailableDays: string | null | undefined): string[] {
  if (!rawAvailableDays) {
    return DEFAULT_SIGNUP_SETTINGS.availableDays;
  }

  try {
    const parsed = JSON.parse(rawAvailableDays);
    if (Array.isArray(parsed) && parsed.every((day) => typeof day === 'string')) {
      return parsed;
    }
  } catch {
    // Fall through to defaults when stored JSON is malformed.
  }

  return DEFAULT_SIGNUP_SETTINGS.availableDays;
}

export function normalizeTimeInputValue(
  rawTime: string | null | undefined,
  fallback: string,
): string {
  if (!rawTime) {
    return fallback;
  }

  const match = rawTime.match(/(\d{2}):(\d{2})/);
  if (!match) {
    return fallback;
  }

  const [, hours, minutes] = match;
  const normalized = `${hours}:${minutes}`;
  const normalizedHours = Number(hours);
  const normalizedMinutes = Number(minutes);

  if (
    !Number.isInteger(normalizedHours) ||
    !Number.isInteger(normalizedMinutes) ||
    normalizedHours < 0 ||
    normalizedHours > 23 ||
    normalizedMinutes < 0 ||
    normalizedMinutes > 59
  ) {
    return fallback;
  }

  return normalized;
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

export interface PlayerLike {
  id: number;
  name: string;
}

export interface SignupLike {
  id?: number;
  player_id: number;
  name?: string;
  date: string;
  status?: 'registered' | 'waitlisted' | string;
}

export interface UnavailableLike {
  id?: number;
  player_id: number;
  name?: string;
  week_start: string;
}

export function getNoResponsePlayers<T extends PlayerLike>(
  players: T[],
  signups: SignupLike[],
  unavailablePlayers: UnavailableLike[],
  weekDates: string[],
  weekStart: string,
): T[] {
  const dateSet = new Set(weekDates);
  const respondedPlayerIds = new Set<number>();

  for (const s of signups) {
    if (dateSet.has(s.date)) {
      respondedPlayerIds.add(s.player_id);
    }
  }

  for (const u of unavailablePlayers) {
    if (u.week_start === weekStart) {
      respondedPlayerIds.add(u.player_id);
    }
  }

  return players
    .filter((p) => !respondedPlayerIds.has(p.id))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function formatSignupExport({
  sunday,
  dates,
  signups,
  unavailablePlayers = [],
  players = [],
}: {
  sunday: Date;
  dates: string[];
  signups: SignupLike[];
  unavailablePlayers?: UnavailableLike[];
  players?: PlayerLike[];
}): string {
  if (!sunday || dates.length === 0) return '';

  const monday = addDays(sunday, 1);
  const weekStart = format(sunday, 'yyyy-MM-dd');
  let text = `Week of ${format(monday, 'MMMM d')} // 6:30-8:00 am\n\n`;

  dates.forEach((dateStr) => {
    const dateObj = new Date(dateStr + 'T12:00:00');
    const dayName = format(dateObj, 'EEEE');
    const daySignups = signups.filter((s) => s.date === dateStr);
    const registered = daySignups.filter((s) => s.status === 'registered');
    const waitlisted = daySignups.filter((s) => s.status === 'waitlisted');
    const count = registered.length;
    let status = 'OPEN';
    if (count >= 6) {
      status = 'CLOSED';
    } else if (count >= 4) {
      status = 'PLAYABLE';
    }

    text += `${dayName} - ${status}\n`;
    registered.forEach((s) => {
      text += `- ${s.name}\n`;
    });
    if (count < 6) {
      text += `- \n`;
    }
    if (waitlisted.length > 0) {
      text += `Waitlist: ${waitlisted.map((s) => s.name).join(', ')}\n`;
    }
    text += `\n`;
  });

  const unavailableThisWeek = unavailablePlayers
    .filter((u) => u.week_start === weekStart)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  if (unavailableThisWeek.length > 0) {
    text += `Out: ${unavailableThisWeek.map((u) => u.name).filter(Boolean).join(', ')}\n`;
  }

  if (players.length > 0) {
    const noResponse = getNoResponsePlayers(players, signups, unavailablePlayers, dates, weekStart);
    if (noResponse.length > 0) {
      text += `No Response: ${noResponse.map((p) => p.name).join(', ')}\n`;
    }
  }

  return text.trim();
}

