// ContactController.ts - Controller for contact form and support requests

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  territory?: string;
  status: 'new' | 'processing' | 'resolved';
  createdAt: string;
}

class ContactController {
  /**
   * POST /api/contact
   * Submit a contact form message
   */
  async store({ request, response }) {
    try {
      const data = request.body();

      // Validate required fields
      const required = ['name', 'email', 'subject', 'message'];
      for (const field of required) {
        if (!data[field]) {
          return response.badRequest({
            error: `Field ${field} is required`
          });
        }
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return response.badRequest({
          error: 'Invalid email format'
        });
      }

      const newMessage: ContactMessage = {
        id: Date.now(),
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        territory: data.territory || null,
        status: 'new',
        createdAt: new Date().toISOString()
      };

      // In production:
      // 1. Save to database
      // 2. Send email notification to admin
      // 3. Send confirmation email to user
      // 4. Log the contact request

      console.log('New contact message:', newMessage);

      return response.created({
        data: {
          id: newMessage.id,
          status: 'received'
        },
        message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.'
      });
    } catch (error) {
      return response.internalServerError({
        error: 'Error submitting contact form',
        message: error.message
      });
    }
  }

  /**
   * GET /api/contact (admin only)
   * Retrieve contact messages
   */
  async index({ request, response }) {
    try {
      const { status, limit = 20 } = request.qs();

      // In production: Fetch from database with filters
      // This is a mock response
      const messages = this.getMockMessages();

      let filtered = messages;
      if (status) {
        filtered = messages.filter(m => m.status === status);
      }

      filtered = filtered.slice(0, parseInt(limit));

      return response.ok({
        data: filtered,
        meta: {
          total: filtered.length,
          status: status || 'all'
        }
      });
    } catch (error) {
      return response.internalServerError({
        error: 'Error fetching messages',
        message: error.message
      });
    }
  }

  /**
   * PATCH /api/contact/:id (admin only)
   * Update contact message status
   */
  async update({ params, request, response }) {
    try {
      const { id } = params;
      const { status } = request.body();

      const validStatuses = ['new', 'processing', 'resolved'];
      if (!validStatuses.includes(status)) {
        return response.badRequest({
          error: 'Invalid status. Must be: new, processing, or resolved'
        });
      }

      // In production: Update in database
      const updatedMessage = {
        id: parseInt(id),
        status,
        updatedAt: new Date().toISOString()
      };

      return response.ok({
        data: updatedMessage,
        message: 'Status updated successfully'
      });
    } catch (error) {
      return response.internalServerError({
        error: 'Error updating message',
        message: error.message
      });
    }
  }

  /**
   * Mock messages for testing
   */
  private getMockMessages(): ContactMessage[] {
    return [
      {
        id: 1,
        name: 'Marie Dupont',
        email: 'marie.dupont@example.com',
        subject: 'Question sur le comparateur',
        message: 'Bonjour, comment puis-je ajouter un nouveau magasin ?',
        territory: 'Guadeloupe',
        status: 'new',
        createdAt: '2025-11-08T10:30:00Z'
      },
      {
        id: 2,
        name: 'Jean Martin',
        email: 'jean.martin@example.com',
        subject: 'Signalement prix incorrect',
        message: 'Le prix affiché pour le produit EAN 123456 est incorrect.',
        territory: 'Martinique',
        status: 'processing',
        createdAt: '2025-11-07T14:15:00Z'
      }
    ];
  }
}

export default ContactController;
