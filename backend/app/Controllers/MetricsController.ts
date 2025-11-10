// MetricsController.ts - Controller for Prometheus metrics endpoint
// Exposes /metrics endpoint in Prometheus text exposition format

import { register } from '../../start/metrics';

class MetricsController {
  /**
   * GET /metrics
   * Returns Prometheus metrics in text exposition format
   * This endpoint should be protected in production (e.g., via reverse proxy or IP allowlist)
   */
  async index({ response }) {
    try {
      const metrics = await register.metrics();
      
      return response.status(200).header('Content-Type', register.contentType).send(metrics);
    } catch (error) {
      console.error('Error collecting metrics:', error);
      return response.status(500).send({ error: 'Failed to collect metrics' });
    }
  }
}

export default MetricsController;
