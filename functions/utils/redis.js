/**
 * Redis client utility for Cloudflare Pages Functions
 * Uses Upstash Redis for serverless Redis compatibility
 */

import { Redis } from '@upstash/redis/cloudflare';

/**
 * Initialize Redis client from environment variables
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in env
 * 
 * @param {Object} env - Cloudflare environment object
 * @returns {Redis|null} Redis client instance or null if not configured
 */
export function getRedisClient(env) {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('Redis not configured - UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing');
    return null;
  }

  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
}

/**
 * Track a product selection in Redis
 * Uses ZINCRBY to increment the score in a sorted set per territory
 * Stores product metadata in a hash
 * 
 * @param {Redis} redis - Redis client instance
 * @param {Object} data - Selection data
 * @param {string} data.ean - Product EAN code
 * @param {string} data.territory - Territory code (default: 'Guadeloupe')
 * @param {string} [data.name] - Product name
 * @param {string} [data.brand] - Product brand
 * @param {string|null} [data.image] - Product image URL
 * @returns {Promise<Object>} Result with newScore
 */
export async function trackProductSelection(redis, data) {
  const { ean, territory = 'Guadeloupe', name, brand, image } = data;
  
  // Key for the trending sorted set per territory
  const trendingKey = `trendingZ:${territory}`;
  
  // Key for product metadata hash
  const productKey = `product:${ean}`;
  
  // Increment the score for this EAN in the sorted set
  const newScore = await redis.zincrby(trendingKey, 1, ean);
  
  // Store or update product metadata if provided
  if (name || brand || image !== undefined) {
    const metadata = {};
    if (name) metadata.name = name;
    if (brand) metadata.brand = brand;
    if (image !== undefined) metadata.image = image || '';
    
    if (Object.keys(metadata).length > 0) {
      await redis.hset(productKey, metadata);
    }
  }
  
  return { newScore };
}

/**
 * Get top trending products for a territory
 * 
 * @param {Redis} redis - Redis client instance
 * @param {string} territory - Territory code (default: 'Guadeloupe')
 * @param {number} limit - Number of products to return (default: 10)
 * @returns {Promise<Array>} Array of trending products with metadata
 */
export async function getTrendingProducts(redis, territory = 'Guadeloupe', limit = 10) {
  const trendingKey = `trendingZ:${territory}`;
  
  // Get top EANs from sorted set (highest scores first)
  const topEans = await redis.zrevrange(trendingKey, 0, limit - 1, { withScores: true });
  
  // topEans is an array like: [ean1, score1, ean2, score2, ...]
  const products = [];
  
  for (let i = 0; i < topEans.length; i += 2) {
    const ean = topEans[i];
    const score = topEans[i + 1];
    
    // Get product metadata
    const productKey = `product:${ean}`;
    const metadata = await redis.hgetall(productKey);
    
    products.push({
      ean,
      score,
      name: metadata?.name || null,
      brand: metadata?.brand || null,
      image: metadata?.image || null,
    });
  }
  
  return products;
}
