/**
 * SMS Channel
 * Handles sending SMS notifications
 * Note: This is a placeholder implementation. SMS sending is prepared but not activated.
 */

import type { Notification } from '../notificationTypes.js';

class SmsChannel {
  /**
   * Send SMS notification
   * Currently a placeholder - real implementation would use Twilio, Vonage, etc.
   */
  async send(notification: Notification): Promise<void> {
    console.log('SMS notification (not sent - SMS not configured):', {
      userId: notification.userId,
      title: notification.title,
      body: notification.body,
    });

    // In a real implementation, this would:
    // 1. Get user's phone number from preferences
    // 2. Format the message for SMS (160 chars limit)
    // 3. Send via SMS provider (Twilio, Vonage, etc.)
    // 4. Handle delivery status

    // Example with Twilio (commented out):
    /*
    const twilio = require('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const user = await this.getUser(notification.userId);
    if (!user?.phoneNumber) {
      throw new Error('User phone number not found');
    }

    // Format message for SMS
    const message = `${notification.title}\n${notification.body}`;
    
    await client.messages.create({
      body: message.substring(0, 160), // SMS limit
      from: process.env.TWILIO_PHONE_NUMBER,
      to: user.phoneNumber,
    });
    */
  }

  /**
   * Validate phone number format for DOM-TOM
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // DOM-TOM phone number formats:
    // +590 (Guadeloupe)
    // +596 (Martinique)
    // +594 (Guyane)
    // +262 (La Réunion, Mayotte)
    const domTomPattern = /^\+(?:590|596|594|262)\d{9}$/;
    return domTomPattern.test(phoneNumber);
  }
}

export const smsChannel = new SmsChannel();
