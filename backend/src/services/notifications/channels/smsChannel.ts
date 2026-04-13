/**
 * SMS Channel
 * Handles sending SMS notifications via Twilio.
 *
 * Required environment variables:
 *   TWILIO_ACCOUNT_SID   – Twilio account SID
 *   TWILIO_AUTH_TOKEN    – Twilio auth token
 *   TWILIO_PHONE_NUMBER  – Sender phone number (E.164 format)
 *
 * When the variables are absent the channel logs a warning and skips sending
 * so that the rest of the notification pipeline continues to work in dev/staging.
 */

import twilio from 'twilio';
import type { Notification } from '../notificationTypes.js';
import prisma from '../../../database/prisma.js';

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
} = process.env;

/** Lazily-created Twilio client (only instantiated when credentials are present). */
function getTwilioClient(): ReturnType<typeof twilio> | null {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return null;
  }
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

class SmsChannel {
  /**
   * Send an SMS notification to the user associated with the notification.
   *
   * Steps:
   *  1. Look up the user's phone number from their notification preferences.
   *  2. Validate it is a DOM-TOM number.
   *  3. Format the message to fit within 160 characters.
   *  4. Send via Twilio; log a warning instead of throwing when credentials
   *     are missing (graceful degradation).
   */
  async send(notification: Notification): Promise<void> {
    const client = getTwilioClient();

    if (!client || !TWILIO_PHONE_NUMBER) {
      console.warn('[SMS] Twilio credentials not configured – SMS skipped', {
        userId: notification.userId,
        title: notification.title,
      });
      return;
    }

    // Retrieve the user's phone number from notification preferences.
    const pref = await prisma.notificationPreference.findUnique({
      where: { userId: notification.userId },
    });

    const phoneNumber = (pref as { phoneNumber?: string } | null)?.phoneNumber;

    if (!phoneNumber) {
      console.warn('[SMS] No phone number found for user', notification.userId);
      return;
    }

    if (!this.validatePhoneNumber(phoneNumber)) {
      console.warn('[SMS] Invalid DOM-TOM phone number', phoneNumber);
      return;
    }

    // Build the message body (SMS limit: 160 chars per segment).
    const body = `${notification.title}\n${notification.body}`.substring(0, 160);

    try {
      const message = await client.messages.create({
        body,
        from: TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });
      console.info('[SMS] Message sent', { sid: message.sid, userId: notification.userId });
    } catch (err) {
      console.error('[SMS] Failed to send message', { userId: notification.userId, err });
      throw err;
    }
  }

  /**
   * Validate phone number format for DOM-TOM territories.
   *
   * Accepted country codes (E.164):
   *   +590 – Guadeloupe / Saint-Martin / Saint-Barthélemy
   *   +596 – Martinique
   *   +594 – Guyane
   *   +262 – La Réunion / Mayotte
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    const domTomPattern = /^\+(?:590|596|594|262)\d{9}$/;
    return domTomPattern.test(phoneNumber);
  }
}

export const smsChannel = new SmsChannel();
