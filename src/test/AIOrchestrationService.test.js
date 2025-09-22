import { describe, it, expect, beforeEach, vi } from 'vitest';
import AIOrchestrationService from '../services/AIOrchestrationService';

// Mock Firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({}))
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ forEach: vi.fn() })),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(),
  deleteDoc: vi.fn()
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn()
}));

describe('AIOrchestrationService', () => {
  beforeEach(() => {
    // Reset service state
    AIOrchestrationService.activeAIs = new Map();
    AIOrchestrationService.deploymentQueue = [];
    vi.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should initialize successfully with valid config', async () => {
      const config = {
        apiKey: 'test-key',
        projectId: 'test-project'
      };

      const result = await AIOrchestrationService.initialize(config);
      expect(result).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      // Mock Firebase to throw error
      const { initializeApp } = await import('firebase/app');
      initializeApp.mockImplementationOnce(() => {
        throw new Error('Firebase initialization failed');
      });

      const result = await AIOrchestrationService.initialize({});
      expect(result).toBe(false);
    });
  });

  describe('AI Deployment Validation', () => {
    it('should validate deployment specification correctly', () => {
      const validSpec = {
        name: 'Test AI',
        type: 'analysis',
        capabilities: ['data_analysis']
      };

      const result = AIOrchestrationService.validateDeployment(validSpec);
      expect(result).toBe(true);
    });

    it('should reject deployment with invalid type', () => {
      const invalidSpec = {
        name: 'Test AI',
        type: 'invalid_type',
        capabilities: ['data_analysis']
      };

      const result = AIOrchestrationService.validateDeployment(invalidSpec);
      expect(result).toBe(false);
    });

    it('should reject deployment when max AI limit reached', () => {
      // Fill up to max limit
      for (let i = 0; i < 10; i++) {
        AIOrchestrationService.activeAIs.set(`ai_${i}`, {
          id: `ai_${i}`,
          type: 'analysis',
          status: 'active'
        });
      }

      const validSpec = {
        name: 'Test AI',
        type: 'analysis',
        capabilities: ['data_analysis']
      };

      const result = AIOrchestrationService.validateDeployment(validSpec);
      expect(result).toBe(false);
    });

    it('should detect conflicting AI capabilities', () => {
      // Add existing AI
      AIOrchestrationService.activeAIs.set('existing_ai', {
        id: 'existing_ai',
        type: 'analysis',
        capabilities: ['data_analysis'],
        status: 'active'
      });

      const conflictingSpec = {
        name: 'Conflicting AI',
        type: 'analysis',
        capabilities: ['data_analysis']
      };

      const result = AIOrchestrationService.validateDeployment(conflictingSpec);
      expect(result).toBe(false);
    });
  });

  describe('Territory Adaptation', () => {
    it('should adapt AI for DOM-TOM territories', () => {
      const spec = {
        name: 'Test AI',
        type: 'analysis',
        capabilities: ['data_analysis']
      };

      // Mock detectTerritory to return Guadeloupe
      vi.spyOn(AIOrchestrationService, 'detectTerritory').mockReturnValue('guadeloupe');

      const adaptedSpec = AIOrchestrationService.adaptForTerritory(spec);

      expect(adaptedSpec.territory).toBe('guadeloupe');
      expect(adaptedSpec.language).toBe('creole');
      expect(adaptedSpec.resources.cache).toBe('enhanced');
      expect(adaptedSpec.resources.compression).toBe('high');
    });

    it('should not modify spec for mainland France', () => {
      const spec = {
        name: 'Test AI',
        type: 'analysis',
        capabilities: ['data_analysis']
      };

      // Mock detectTerritory to return metropole
      vi.spyOn(AIOrchestrationService, 'detectTerritory').mockReturnValue('metropole');

      const adaptedSpec = AIOrchestrationService.adaptForTerritory(spec);

      expect(adaptedSpec.territory).toBe('metropole');
      expect(adaptedSpec.language).toBeUndefined();
    });
  });

  describe('AI Management', () => {
    it('should generate unique AI IDs', () => {
      const id1 = AIOrchestrationService.generateAIId();
      const id2 = AIOrchestrationService.generateAIId();
      
      expect(id1).toMatch(/^ai_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^ai_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should detect active AI by type', () => {
      AIOrchestrationService.activeAIs.set('test_ai', {
        id: 'test_ai',
        type: 'optimization',
        status: 'active'
      });

      expect(AIOrchestrationService.hasActiveAI('optimization')).toBe(true);
      expect(AIOrchestrationService.hasActiveAI('monitoring')).toBe(false);
    });

    it('should get list of active AIs', () => {
      const ai1 = { id: 'ai1', type: 'analysis', status: 'active' };
      const ai2 = { id: 'ai2', type: 'optimization', status: 'active' };
      
      AIOrchestrationService.activeAIs.set('ai1', ai1);
      AIOrchestrationService.activeAIs.set('ai2', ai2);

      const activeAIs = AIOrchestrationService.getActiveAIs();
      expect(activeAIs).toHaveLength(2);
      expect(activeAIs).toContain(ai1);
      expect(activeAIs).toContain(ai2);
    });
  });

  describe('Deployment Queue', () => {
    it('should queue deployment requests', async () => {
      const spec = {
        name: 'Queued AI',
        type: 'analysis',
        capabilities: ['data_analysis']
      };

      await AIOrchestrationService.queueDeployment(spec);
      
      expect(AIOrchestrationService.deploymentQueue).toHaveLength(1);
      expect(AIOrchestrationService.deploymentQueue[0]).toBe(spec);
    });
  });

  describe('Performance Metrics Analysis', () => {
    it('should detect need for optimization AI when performance degrades', async () => {
      // Mock collectMetrics to return poor performance
      vi.spyOn(AIOrchestrationService, 'collectMetrics').mockResolvedValue({
        responseTime: 3000, // > 2000 threshold
        errorRate: 0.02,
        activeUsers: 100,
        cpuUsage: 0.8,
        memoryUsage: 0.7
      });

      // Mock queueDeployment
      const queueSpy = vi.spyOn(AIOrchestrationService, 'queueDeployment').mockImplementation(() => {});

      await AIOrchestrationService.analyzePerformanceMetrics();

      expect(queueSpy).toHaveBeenCalledWith({
        name: 'Optimiseur Performance',
        type: 'optimization',
        capabilities: ['response_optimization', 'cache_management'],
        priority: 'high',
        reason: 'Performance dégradée détectée'
      });
    });

    it('should detect need for monitoring AI when error rate is high', async () => {
      // Mock collectMetrics to return high error rate
      vi.spyOn(AIOrchestrationService, 'collectMetrics').mockResolvedValue({
        responseTime: 1000,
        errorRate: 0.08, // > 0.05 threshold
        activeUsers: 100,
        cpuUsage: 0.5,
        memoryUsage: 0.6
      });

      // Mock queueDeployment
      const queueSpy = vi.spyOn(AIOrchestrationService, 'queueDeployment').mockImplementation(() => {});

      await AIOrchestrationService.analyzePerformanceMetrics();

      expect(queueSpy).toHaveBeenCalledWith({
        name: 'Moniteur Erreurs',
        type: 'monitoring',
        capabilities: ['error_analysis', 'auto_recovery'],
        priority: 'critical',
        reason: 'Taux d\'erreur élevé détecté'
      });
    });

    it('should not queue duplicate AI types', async () => {
      // Add existing optimization AI
      AIOrchestrationService.activeAIs.set('existing_opt', {
        id: 'existing_opt',
        type: 'optimization',
        status: 'active'
      });

      // Mock poor performance
      vi.spyOn(AIOrchestrationService, 'collectMetrics').mockResolvedValue({
        responseTime: 3000,
        errorRate: 0.02,
        activeUsers: 100,
        cpuUsage: 0.8,
        memoryUsage: 0.7
      });

      const queueSpy = vi.spyOn(AIOrchestrationService, 'queueDeployment').mockImplementation(() => {});

      await AIOrchestrationService.analyzePerformanceMetrics();

      // Should not queue optimization AI since one already exists
      expect(queueSpy).not.toHaveBeenCalled();
    });
  });

  describe('Message Generation', () => {
    it('should generate unique message IDs', () => {
      const id1 = AIOrchestrationService.generateMessageId();
      const id2 = AIOrchestrationService.generateMessageId();
      
      expect(id1).toMatch(/^msg_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^msg_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });
});