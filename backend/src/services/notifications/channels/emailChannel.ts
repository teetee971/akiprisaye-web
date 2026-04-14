/**
 * Email Channel
 * Handles sending email notifications
 */

import sgMail from '@sendgrid/mail';
import type { Notification } from '../notificationTypes.js';
import prisma from '../../../database/prisma.js';

// Initialize SendGrid (will be configured via env)
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@akiprisaye.fr';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

class EmailChannel {
  /**
   * Send email notification
   */
  async send(notification: Notification): Promise<void> {
    if (!SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured, skipping email notification');
      return;
    }

    // Get user email
    const user = await this.getUser(notification.userId);
    if (!user || !user.email) {
      throw new Error('User email not found');
    }

    const msg = {
      to: user.email,
      from: FROM_EMAIL,
      subject: notification.title,
      text: notification.body,
      html: this.generateEmailHtml(notification),
    };

    try {
      await sgMail.send(msg);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Generate HTML email content
   */
  private generateEmailHtml(notification: Notification): string {
    const data = notification.data as any;

    let priceInfo = '';
    if (data?.newPrice) {
      priceInfo = `<p><strong>Prix: ${data.newPrice.toFixed(2)}€</strong></p>`;
      
      if (data.oldPrice) {
        const savings = data.oldPrice - data.newPrice;
        const savingsPercent = (savings / data.oldPrice) * 100;
        priceInfo += `<p>Ancien prix: ${data.oldPrice.toFixed(2)}€</p>`;
        priceInfo += `<p style="color: green;">Économie: ${savings.toFixed(2)}€ (-${savingsPercent.toFixed(0)}%)</p>`;
      }
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #4F46E5;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 20px;
              border-radius: 0 0 5px 5px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #4F46E5;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Alerte Prix - A KI PRI SA YÉ</h1>
            </div>
            <div class="content">
              <h2>${notification.title}</h2>
              <p>${notification.body}</p>
              ${priceInfo}
              ${data?.storeName ? `<p><strong>Magasin:</strong> ${data.storeName}</p>` : ''}
              <a href="${process.env.APP_URL || 'https://akiprisaye.fr'}" class="button">
                Voir sur A KI PRI SA YÉ
              </a>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get user data from the database
   */
  private async getUser(userId: string): Promise<{ email: string } | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return user;
  }
}

export const emailChannel = new EmailChannel();
