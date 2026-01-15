/**
 * Type augmentation for Express Request
 * Adds custom properties used by various middlewares
 */

import { UserRole, ApiKey, SubscriptionTier } from '@prisma/client';
import { RateLimitInfo } from 'express-rate-limit';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        type: 'access' | 'refresh';
      };
      userRole?: UserRole;
      apiKey?: ApiKey;
      subscriptionTier?: SubscriptionTier;
      rateLimit?: RateLimitInfo;
    }
  }
}

export {};
