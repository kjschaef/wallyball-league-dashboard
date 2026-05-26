import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { format } from 'date-fns';
import {
  DEFAULT_SIGNUP_SETTINGS,
  getEasternWallTimeNow,
  getSignupCycleState,
  generateWeekDates,
  parseAvailableDays,
  parseTime,
  type SignupSettings,
} from '../../../lib/signups';
import { sendTwilioMessage } from '../../../lib/twilio';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SignupSettingsRow = {
  signup_open_day_of_week: number | null;
  signup_open_time: string | null;
  signup_close_day_of_week: number | null;
  signup_close_time: string | null;
  available_days: string | null;
  sms_reminders_enabled: boolean | null;
  sms_reminders_day_of_week: number | null;
  sms_reminders_time: string | null;
};

interface FullSignupSettings extends SignupSettings {
  smsRemindersEnabled: boolean;
  smsRemindersDayOfWeek: number;
  smsRemindersTime: string;
}

function buildFullSignupSettings(settingsRows: SignupSettingsRow[]): FullSignupSettings {
  if (settingsRows.length === 0) {
    return {
      ...DEFAULT_SIGNUP_SETTINGS,
      smsRemindersEnabled: false,
      smsRemindersDayOfWeek: 3,
      smsRemindersTime: '12:00',
    };
  }

  const row = settingsRows[0];
  return {
    signupOpenDayOfWeek: row.signup_open_day_of_week ?? DEFAULT_SIGNUP_SETTINGS.signupOpenDayOfWeek,
    signupOpenTime: row.signup_open_time ?? DEFAULT_SIGNUP_SETTINGS.signupOpenTime,
    signupCloseDayOfWeek: row.signup_close_day_of_week ?? DEFAULT_SIGNUP_SETTINGS.signupCloseDayOfWeek,
    signupCloseTime: row.signup_close_time ?? DEFAULT_SIGNUP_SETTINGS.signupCloseTime,
    availableDays: parseAvailableDays(row.available_days),
    smsRemindersEnabled: row.sms_reminders_enabled ?? false,
    smsRemindersDayOfWeek: row.sms_reminders_day_of_week ?? 3,
    smsRemindersTime: row.sms_reminders_time ?? '12:00',
  };
}

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }
    const sql = neon(process.env.DATABASE_URL);

    // Get URL search parameters (e.g. ?manual=true)
    const { searchParams } = new URL(request.url);
    const isManual = searchParams.get('manual') === 'true';

    // 1. Fetch site settings
    const settings = await sql`
      SELECT 
        signup_open_day_of_week, 
        signup_open_time, 
        signup_close_day_of_week, 
        signup_close_time, 
        available_days,
        sms_reminders_enabled,
        sms_reminders_day_of_week,
        sms_reminders_time
      FROM site_settings
      LIMIT 1
    ` as SignupSettingsRow[];

    const signupSettings = buildFullSignupSettings(settings);

    // 2. Schedule Check (skip if not manual and settings don't match)
    if (!isManual) {
      if (!signupSettings.smsRemindersEnabled) {
        return NextResponse.json({ status: 'skipped', reason: 'SMS reminders are disabled in settings' });
      }

      const now = getEasternWallTimeNow();
      const currentDayOfWeek = now.getDay();
      const currentHour = now.getHours();

      const { hours: targetHour } = parseTime(signupSettings.smsRemindersTime);

      // Verify day and hour window match
      if (currentDayOfWeek !== signupSettings.smsRemindersDayOfWeek || currentHour !== targetHour) {
        return NextResponse.json({
          status: 'skipped',
          reason: `Current time (${currentDayOfWeek} at ${currentHour}h) does not match schedule (${signupSettings.smsRemindersDayOfWeek} at ${targetHour}h)`,
        });
      }
    }

    // 3. Get Signup Cycle State
    const now = getEasternWallTimeNow();
    const signupState = getSignupCycleState(now, signupSettings);

    if (!signupState.isOpen || !signupState.signupWeekSunday) {
      return NextResponse.json({ status: 'skipped', reason: 'Signups are closed or no active week' });
    }

    const weekStart = format(signupState.signupWeekSunday, 'yyyy-MM-dd');
    const openDates = generateWeekDates(signupState.signupWeekSunday, signupSettings.availableDays);

    if (openDates.length === 0) {
      return NextResponse.json({ status: 'skipped', reason: 'No open game days for this week' });
    }

    // 4. Find players who have already RSVP'd (signed up or marked unavailable)
    const unavailablePlayers = await sql`
      SELECT player_id FROM weekly_unavailable WHERE week_start = ${weekStart}
    ` as { player_id: number }[];

    const signedUpPlayers = await sql`
      SELECT DISTINCT player_id FROM weekly_signups WHERE date = ANY(${openDates})
    ` as { player_id: number }[];

    const activePlayerIds = new Set<number>([
      ...unavailablePlayers.map((p) => p.player_id),
      ...signedUpPlayers.map((p) => p.player_id),
    ]);

    // 5. Fetch opted-in players who haven't RSVP'd yet
    const playersToRemind = await sql`
      SELECT id, name, phone_number 
      FROM players 
      WHERE sms_opt_in = true AND phone_number IS NOT NULL AND phone_number != ''
    ` as { id: number; name: string; phone_number: string }[];

    const targets = playersToRemind.filter((p) => !activePlayerIds.has(p.id));

    if (targets.length === 0) {
      return NextResponse.json({ status: 'success', sentCount: 0, message: 'All active players have already RSVPd' });
    }

    // 6. Send SMS Reminders
    // Format dates nicely: "Tue, May 26"
    const formattedDates = openDates.map((dateStr, idx) => {
      // Append midday time to avoid local timezone offset shifting the day
      const dateObj = new Date(`${dateStr}T12:00:00`);
      return `${idx + 1}: ${format(dateObj, 'EEE, MMM d')}`;
    });

    const smsResults = [];
    for (const target of targets) {
      const body = `Wallyball League:
Hey ${target.name}! Signups are open for this week:
${formattedDates.join('\n')}

Reply with the numbers you CAN play (e.g. '1 2'), or reply 'NONE' to skip.`;

      const success = await sendTwilioMessage(target.phone_number, body);
      smsResults.push({ name: target.name, phone: target.phone_number, success });
    }

    return NextResponse.json({
      status: 'success',
      sentCount: smsResults.filter((r) => r.success).length,
      results: smsResults,
    });
  } catch (error) {
    console.error('Error running reminders cron:', error);
    return NextResponse.json({ error: 'Failed to dispatch reminders' }, { status: 500 });
  }
}
