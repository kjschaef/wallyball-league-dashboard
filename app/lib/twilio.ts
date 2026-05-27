import twilio from 'twilio';

/**
 * Sends an SMS message using the Twilio client.
 */
export async function sendTwilioMessage(to: string, body: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio environment variables are not configured.');
    return false;
  }

  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({
      body,
      from: fromNumber,
      to,
    });
    return true;
  } catch (error) {
    console.error('Failed to send Twilio SMS:', error);
    return false;
  }
}

/**
 * Parses an SMS reply to extract playing days and out days.
 * Returns null if the response is unrecognized.
 */
export function parseSmsResponse(
  body: string,
  openDaysCount: number
): { rsvpIn: number[]; rsvpOut: number[] } | null {
  const clean = body.trim().toUpperCase();

  // Handle opting out of all days
  if (clean === 'NONE' || clean === 'OUT' || clean === 'NO' || clean === 'N') {
    return {
      rsvpIn: [],
      rsvpOut: Array.from({ length: openDaysCount }, (_, i) => i),
    };
  }

  // Handle opting into all days
  if (clean === 'ALL' || clean === 'YES' || clean === 'Y') {
    return {
      rsvpIn: Array.from({ length: openDaysCount }, (_, i) => i),
      rsvpOut: [],
    };
  }

  // Extract all numbers
  const matches = clean.match(/\d+/g);
  if (!matches) {
    return null; // Unrecognized format
  }

  const selectedIndices: number[] = [];
  for (const match of matches) {
    // Split sequence of digits (e.g. "12" becomes "1" and "2")
    const digits = match.split('');
    for (const digitChar of digits) {
      const val = parseInt(digitChar, 10);
      if (val >= 1 && val <= openDaysCount) {
        const index = val - 1;
        if (!selectedIndices.includes(index)) {
          selectedIndices.push(index);
        }
      }
    }
  }

  if (selectedIndices.length === 0) {
    return null; // No valid option numbers found
  }

  const rsvpIn = selectedIndices.sort((a, b) => a - b);
  const rsvpOut = Array.from({ length: openDaysCount }, (_, i) => i).filter(
    (i) => !rsvpIn.includes(i)
  );

  return { rsvpIn, rsvpOut };
}
