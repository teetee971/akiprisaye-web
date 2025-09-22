import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIOrchestrationEngine } from '../services/aiOrchestration.js';

// Mock Firebase
vi.mock('../firebase.js', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: 'mock-doc-id' }),
  updateDoc: vi.fn().mockResolvedValue({}),
  deleteDoc: vi.fn().mockResolvedValue({}),
  getDocs: vi.fn().mockResolvedValue({
    forEach: vi.fn()
  }),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn().mockReturnValue(new Date())
}));

describe('AIOrchestrationEngine', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new AIOrchestrationEngine();
    // Clear any existing instances
    orchestrator.aiInstances.clear();
  });

  describe('AI Deployment', () => {
    it('should deploy a valid AI instance', async () => {
      const aiSpec = {
        type: 'analyzer',
        specialization: 'price_analysis',
        territory: 'DOM-TOM',
        capabilities: ['price_tracking', 'trend_analysis'],
        config: { testMode: true }
      };

      const deployedAI = await orchestrator.deployAI(aiSpec);

      expect(deployedAI).toBeDefined();
      expect(deployedAI.id).toMatch(/^ai_\d+_[a-z0-9]+$/);
      expect(deployedAI.type).toBe('analyzer');
      expect(deployedAI.specialization).toBe('price_analysis');
      expect(deployedAI.territory).toBe('DOM-TOM');
      expect(deployedAI.status).toBe('running');
    });

    it('should reject invalid AI specification', async () => {
      const invalidSpec = {
        // Missing required fields
        territory: 'DOM-TOM'
      };

      await expect(orchestrator.deployAI(invalidSpec))
        .rejects.toThrow('Invalid AI deployment specification');
    });

    it('should validate security constraints', () => {
      const validSpec = {
        type: 'analyzer',
        specialization: 'price_analysis',
        capabilities: ['price_tracking'],
        territory: 'DOM-TOM'
      };

      const invalidSpec = {
        type: 'analyzer',
        specialization: 'price_analysis',
        capabilities: [], // Empty capabilities with high security
        territory: 'DOM-TOM'
      };

      expect(orchestrator.validateDeployment(validSpec)).toBe(true);
      expect(orchestrator.validateDeployment(invalidSpec)).toBe(false);
    });

    it('should validate territorial constraints', () => {
      const validSpec = {
        type: 'analyzer',
        specialization: 'price_analysis',
        capabilities: ['price_tracking'],
        territory: 'DOM-TOM'
      };

      const invalidSpec = {
        type: 'analyzer',
        specialization: 'price_analysis',
        capabilities: ['price_tracking'],
        territory: 'Invalid-Territory'
      };

      expect(orchestrator.validateDeployment(validSpec)).toBe(true);
      expect(orchestrator.validateDeployment(invalidSpec)).toBe(false);
    });
  });

  describe('AI Management', () => {
    it('should track active AI instances', async () => {
      const aiSpec = {
        type: 'analyzer',
        specialization: 'price_analysis',
        territory: 'DOM-TOM',
        capabilities: ['price_tracking']
      };

      await orchestrator.deployAI(aiSpec);
      const activeAIs = orchestrator.getActiveAIs();

      expect(activeAIs).toHaveLength(1);
      expect(activeAIs[0].status).toBe('running');
    });

    it('should filter AIs by territory', async () => {
      const domtomSpec = {
        type: 'analyzer',
        specialization: 'price_analysis',
        territory: 'DOM-TOM',
        capabilities: ['price_tracking']
      };

      const metropoleSpec = {
        type: 'analyzer',
        specialization: 'market_analysis',
        territory: 'Métropole',
        capabilities: ['market_tracking']
      };

      await orchestrator.deployAI(domtomSpec);
      await orchestrator.deployAI(metropoleSpec);

      const domtomAIs = orchestrator.getAIsByTerritory('DOM-TOM');
      const metropoleAIs = orchestrator.getAIsByTerritory('Métropole');

      expect(domtomAIs).toHaveLength(1);
      expect(metropoleAIs).toHaveLength(1);
      expect(domtomAIs[0].territory).toBe('DOM-TOM');
      expect(metropoleAIs[0].territory).toBe('Métropole');
    });

    it('should filter AIs by specialization', async () => {
      const priceAnalysisSpec = {
        type: 'analyzer',
        specialization: 'price_analysis',
        territory: 'DOM-TOM',
        capabilities: ['price_tracking']
      };

      const marketAnalysisSpec = {
        type: 'analyzer',
        specialization: 'market_analysis',
        territory: 'DOM-TOM',
        capabilities: ['market_tracking']
      };

      await orchestrator.deployAI(priceAnalysisSpec);
      await orchestrator.deployAI(marketAnalysisSpec);

      const priceAIs = orchestrator.getAIsBySpecialization('price_analysis');
      const marketAIs = orchestrator.getAIsBySpecialization('market_analysis');

      expect(priceAIs).toHaveLength(1);
      expect(marketAIs).toHaveLength(1);
      expect(priceAIs[0].specialization).toBe('price_analysis');
      expect(marketAIs[0].specialization).toBe('market_analysis');
    });
  });

  describe('AI Destruction', () => {
    it('should destroy an existing AI instance', async () => {
      const aiSpec = {
        type: 'analyzer',
        specialization: 'price_analysis',
        territory: 'DOM-TOM',
        capabilities: ['price_tracking']
      };

      const deployedAI = await orchestrator.deployAI(aiSpec);
      expect(orchestrator.aiInstances.size).toBe(1);

      await orchestrator.destroyAI(deployedAI.id, 'test');
      expect(orchestrator.aiInstances.size).toBe(0);
    });

    it('should handle destruction of non-existent AI', async () => {
      await expect(orchestrator.destroyAI('non-existent-id'))
        .rejects.toThrow('AI instance non-existent-id not found');
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        maxInstances: 100,
        autoDeployment: false,
        securityLevel: 'medium'
      };

      orchestrator.updateConfig(newConfig);

      expect(orchestrator.config.maxInstances).toBe(100);
      expect(orchestrator.config.autoDeployment).toBe(false);
      expect(orchestrator.config.securityLevel).toBe('medium');
      expect(orchestrator.config.territorialScope).toEqual(['DOM-TOM', 'Métropole']); // Should preserve existing values
    });
  });

  describe('Need Detection', () => {
    it('should detect AI needs based on analysis', async () => {
      // Mock specific conditions to get predictable results
      vi.spyOn(orchestrator, 'checkPriceAnalysisLoad')
        .mockResolvedValue({ cpuUsage: 90, territory: 'DOM-TOM' });
      vi.spyOn(orchestrator, 'checkShrinkflationEvents')
        .mockResolvedValue({ count: 5 }); // Below threshold
      vi.spyOn(orchestrator, 'checkTerritorialLoad')
        .mockResolvedValue({ requiresSpecializedAI: false }); // No territorial needs

      const needs = await orchestrator.detectAINeeds();

      expect(needs.length).toBeGreaterThan(0);
      const performanceNeed = needs.find(need => need.type === 'performance');
      expect(performanceNeed).toBeDefined();
      expect(performanceNeed.priority).toBe(0.8);
      expect(performanceNeed.specification.specialization).toBe('price_analysis');
    });

    it('should detect shrinkflation analysis needs', async () => {
      // Mock high shrinkflation events to trigger need detection
      vi.spyOn(orchestrator, 'checkShrinkflationEvents')
        .mockResolvedValue({ count: 15 });

      const needs = await orchestrator.detectAINeeds();

      expect(needs.length).toBeGreaterThan(0);
      const shrinkflationNeed = needs.find(need => 
        need.specification.specialization === 'shrinkflation_analysis'
      );
      expect(shrinkflationNeed).toBeDefined();
      expect(shrinkflationNeed.priority).toBe(0.9);
    });

    it('should detect territorial specialist needs', async () => {
      // Mock territorial load requirement
      vi.spyOn(orchestrator, 'checkTerritorialLoad')
        .mockResolvedValue({ requiresSpecializedAI: true });

      const needs = await orchestrator.detectAINeeds();

      expect(needs.length).toBeGreaterThan(0);
      const territorialNeed = needs.find(need => 
        need.type === 'territorial'
      );
      expect(territorialNeed).toBeDefined();
      expect(territorialNeed.specification.type).toBe('territorial_specialist');
    });
  });

  describe('Conflict Detection', () => {
    it('should detect conflicts between AI instances', async () => {
      const spec1 = {
        type: 'analyzer',
        specialization: 'price_analysis',
        territory: 'DOM-TOM',
        capabilities: ['price_tracking']
      };

      const spec2 = {
        type: 'analyzer',
        specialization: 'price_analysis', // Same specialization
        territory: 'DOM-TOM', // Same territory
        capabilities: ['price_tracking']
      };

      await orchestrator.deployAI(spec1);
      const conflict = await orchestrator.checkConflicts(spec2);

      expect(conflict.hasConflict).toBe(true);
      expect(conflict.conflictWith).toBeDefined();
    });

    it('should not detect conflicts for different territories', async () => {
      const spec1 = {
        type: 'analyzer',
        specialization: 'price_analysis',
        territory: 'DOM-TOM',
        capabilities: ['price_tracking']
      };

      const spec2 = {
        type: 'analyzer',
        specialization: 'price_analysis', // Same specialization
        territory: 'Métropole', // Different territory
        capabilities: ['price_tracking']
      };

      await orchestrator.deployAI(spec1);
      const conflict = await orchestrator.checkConflicts(spec2);

      expect(conflict.hasConflict).toBe(false);
    });
  });
});