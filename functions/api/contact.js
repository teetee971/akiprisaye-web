/**
 * Cloudflare Pages Function: /api/contact
 * Handles contact form submissions
 */

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize input to prevent XSS
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 5000); // Limit length
}

/**
 * POST /api/contact
 * Submit a contact form message
 */
export async function onRequestPost(context) {
  try {
    const { request } = context;
    const data = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'subject', 'message'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return new Response(JSON.stringify({
        error: 'Missing required fields',
        missingFields,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Validate email format
    if (!isValidEmail(data.email)) {
      return new Response(JSON.stringify({
        error: 'Invalid email format',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(data.name),
      email: sanitizeInput(data.email),
      subject: sanitizeInput(data.subject),
      message: sanitizeInput(data.message),
      territory: data.territory ? sanitizeInput(data.territory) : null,
    };
    
    // Validate sanitized data lengths
    if (sanitizedData.name.length < 2 || sanitizedData.name.length > 100) {
      return new Response(JSON.stringify({
        error: 'Name must be between 2 and 100 characters',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (sanitizedData.subject.length < 5 || sanitizedData.subject.length > 200) {
      return new Response(JSON.stringify({
        error: 'Subject must be between 5 and 200 characters',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (sanitizedData.message.length < 10 || sanitizedData.message.length > 5000) {
      return new Response(JSON.stringify({
        error: 'Message must be between 10 and 5000 characters',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Create message object
    const contactMessage = {
      id: Date.now(),
      ...sanitizedData,
      status: 'new',
      createdAt: new Date().toISOString(),
      ip: request.headers.get('CF-Connecting-IP') || 'unknown',
      userAgent: request.headers.get('User-Agent') || 'unknown',
    };
    
    // TODO: PRODUCTION IMPLEMENTATION REQUIRED
    // 1. Save to Firestore collection 'contact_messages'
    // 2. Send email notification to admin using SendGrid/Mailgun
    // 3. Send confirmation email to user
    // 4. Implement rate limiting (max 5 messages per hour per IP)
    // 5. Add CAPTCHA verification for spam prevention
    //
    // For now, just log the message
    console.log('Contact form submission:', contactMessage);
    
    // Mock successful response
    return new Response(JSON.stringify({
      data: {
        id: contactMessage.id,
        status: 'received',
      },
      message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Error in /api/contact:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: 'Une erreur est survenue lors de l\'envoi de votre message. Veuillez réessayer plus tard.',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * GET /api/contact
 * List contact messages (admin only)
 */
export async function onRequestGet(context) {
  try {
    // TODO: In production, verify admin authentication
    
    // Mock response
    return new Response(JSON.stringify({
      error: 'Authentication required',
      message: 'Admin access only',
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in /api/contact GET:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * PATCH /api/contact/:id
 * Update contact message status (admin only)
 */
export async function onRequestPatch(context) {
  try {
    // TODO: In production, verify admin authentication
    
    // Mock response
    return new Response(JSON.stringify({
      error: 'Authentication required',
      message: 'Admin access only',
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in /api/contact PATCH:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
