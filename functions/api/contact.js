/**
 * Cloudflare Pages Function: /api/contact
 * Handles contact form submissions with rate limiting and Firestore integration
 */

import { logInfo, logError, logSecurity } from '../utils/logger.js';
import { checkRateLimit } from '../utils/rateLimit.js';
import { saveContactMessage } from '../utils/firestore.js';

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
    
    // Get client IP for rate limiting
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    
    // Check rate limit: 5 messages per hour per IP
    const rateLimit = checkRateLimit(clientIp, 5, 60 * 60 * 1000);
    
    if (!rateLimit.allowed) {
      logSecurity('Rate limit exceeded for contact form', { 
        ip: clientIp,
        resetTime: new Date(rateLimit.resetTime).toISOString(),
      });
      
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Trop de messages envoyés. Veuillez réessayer plus tard.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
      }), {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
        },
      });
    }
    
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
      ...sanitizedData,
      status: 'new',
      ip: clientIp,
      userAgent: request.headers.get('User-Agent') || 'unknown',
    };
    
    // Save to Firestore
    try {
      const messageId = await saveContactMessage(contactMessage);
      
      logInfo('Contact form submission saved', { 
        messageId,
        email: sanitizedData.email,
        subject: sanitizedData.subject,
      });
      
      // TODO: Send email notifications (requires email service integration)
      // 1. Send email notification to admin using SendGrid/Mailgun
      // 2. Send confirmation email to user
      
      return new Response(JSON.stringify({
        data: {
          id: messageId,
          status: 'received',
        },
        message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (firestoreError) {
      // Fallback: Log the message even if Firestore fails
      logError('Failed to save to Firestore, using fallback', firestoreError, contactMessage);
      
      // Still return success to user (message is logged)
      return new Response(JSON.stringify({
        data: {
          id: Date.now().toString(),
          status: 'received',
        },
        message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
  } catch (error) {
    logError('Error in /api/contact:', error);
    
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
export async function onRequestGet(_context) {
  try {
    // TODO: In production, verify admin authentication and fetch from Firestore
    
    return new Response(JSON.stringify({
      error: 'Authentication required',
      message: 'Admin access only',
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    logError('Error in /api/contact GET:', error);
    
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
export async function onRequestPatch(_context) {
  try {
    // TODO: In production, verify admin authentication and update in Firestore
    
    return new Response(JSON.stringify({
      error: 'Authentication required',
      message: 'Admin access only',
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    logError('Error in /api/contact PATCH:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
