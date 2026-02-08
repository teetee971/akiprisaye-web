/**
 * Shared Prisma Client Instance
 * 
 * Single instance to prevent connection pool exhaustion
 */

import { PrismaClient } from '@prisma/client';

const nodeEnv = process.env.NODE_ENV || 'development';

// Create singleton instance
const prisma = new PrismaClient({
  log: nodeEnv === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export default prisma;
