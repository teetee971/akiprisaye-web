/**
 * Tests for Preparedness Service
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as preparednessService from '../preparednessService';
import type { PreparednessChecklist } from '../../types/cycloneComparison';

describe('PreparednessService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getChecklistByPhase', () => {
    it('should return a checklist for the "before" phase', () => {
      const checklist = preparednessService.getChecklistByPhase('before');
      
      expect(checklist).toBeDefined();
      expect(checklist.phase).toBe('before');
      expect(checklist.items.length).toBeGreaterThan(0);
      expect(checklist.score).toBe(0); // No items completed initially
    });

    it('should return a checklist for the "during" phase', () => {
      const checklist = preparednessService.getChecklistByPhase('during');
      
      expect(checklist).toBeDefined();
      expect(checklist.phase).toBe('during');
      expect(checklist.items.length).toBeGreaterThan(0);
    });

    it('should return a checklist for the "after" phase', () => {
      const checklist = preparednessService.getChecklistByPhase('after');
      
      expect(checklist).toBeDefined();
      expect(checklist.phase).toBe('after');
      expect(checklist.items.length).toBeGreaterThan(0);
    });
  });

  describe('calculatePreparednessScore', () => {
    it('should return 0 for an empty checklist', () => {
      const checklist: PreparednessChecklist = {
        id: 'test-1',
        phase: 'before',
        items: [],
        score: 0,
        lastUpdated: new Date().toISOString()
      };
      
      const score = preparednessService.calculatePreparednessScore(checklist);
      expect(score).toBe(0);
    });

    it('should calculate score based on completed critical tasks', () => {
      const checklist = preparednessService.getChecklistByPhase('before');
      
      // Initially should be 0
      let score = preparednessService.calculatePreparednessScore(checklist);
      expect(score).toBe(0);
      
      // Complete first item (should be critical)
      checklist.items[0].completed = true;
      score = preparednessService.calculatePreparednessScore(checklist);
      expect(score).toBeGreaterThan(0);
      
      // Complete all items
      checklist.items.forEach(item => item.completed = true);
      score = preparednessService.calculatePreparednessScore(checklist);
      expect(score).toBe(100);
    });
  });

  describe('toggleChecklistItem', () => {
    it('should toggle an item from uncompleted to completed', () => {
      const checklist = preparednessService.getChecklistByPhase('before');
      const itemId = checklist.items[0].id;
      
      expect(checklist.items[0].completed).toBe(false);
      
      const updated = preparednessService.toggleChecklistItem(checklist, itemId);
      
      expect(updated.items[0].completed).toBe(true);
      expect(updated.items[0].completedAt).toBeDefined();
      expect(updated.score).toBeGreaterThan(0);
    });

    it('should toggle an item from completed to uncompleted', () => {
      const checklist = preparednessService.getChecklistByPhase('before');
      const itemId = checklist.items[0].id;
      
      // First complete it
      let updated = preparednessService.toggleChecklistItem(checklist, itemId);
      expect(updated.items[0].completed).toBe(true);
      
      // Then uncomplete it
      updated = preparednessService.toggleChecklistItem(updated, itemId);
      expect(updated.items[0].completed).toBe(false);
      expect(updated.items[0].completedAt).toBeUndefined();
    });
  });

  describe('saveChecklist and loadChecklist', () => {
    it('should save and load a checklist', async () => {
      const checklist = preparednessService.getChecklistByPhase('before');
      checklist.items[0].completed = true;
      
      await preparednessService.saveChecklist(checklist);
      
      const loaded = preparednessService.loadChecklist('before');
      
      expect(loaded).toBeDefined();
      expect(loaded?.phase).toBe('before');
      expect(loaded?.items[0].completed).toBe(true);
    });

    it('should return null when loading a non-existent checklist', () => {
      const loaded = preparednessService.loadChecklist('before');
      expect(loaded).toBeNull();
    });
  });

  describe('getPersonalizedRecommendations', () => {
    it('should provide recommendations for low preparedness score', () => {
      const checklist = preparednessService.getChecklistByPhase('before');
      const householdProfile = {
        size: 4,
        hasBabies: false,
        hasElderly: false,
        hasPets: false,
        hasVehicle: false,
        territory: 'GP' as const
      };
      
      const recommendations = preparednessService.getPersonalizedRecommendations(
        checklist,
        householdProfile
      );
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('peu préparé'))).toBe(true);
    });

    it('should provide baby-specific recommendations', () => {
      const checklist = preparednessService.getChecklistByPhase('before');
      const householdProfile = {
        size: 4,
        hasBabies: true,
        hasElderly: false,
        hasPets: false,
        hasVehicle: false,
        territory: 'GP' as const
      };
      
      const recommendations = preparednessService.getPersonalizedRecommendations(
        checklist,
        householdProfile
      );
      
      expect(recommendations.some(r => r.includes('bébé'))).toBe(true);
    });

    it('should provide excellent preparation feedback at high score', () => {
      const checklist = preparednessService.getChecklistByPhase('before');
      // Complete all items
      checklist.items.forEach(item => item.completed = true);
      checklist.score = preparednessService.calculatePreparednessScore(checklist);
      
      const householdProfile = {
        size: 4,
        hasBabies: false,
        hasElderly: false,
        hasPets: false,
        hasVehicle: false,
        territory: 'GP' as const
      };
      
      const recommendations = preparednessService.getPersonalizedRecommendations(
        checklist,
        householdProfile
      );
      
      expect(recommendations.some(r => r.includes('Excellente'))).toBe(true);
    });
  });

  describe('exportChecklistAsText', () => {
    it('should export checklist as formatted text', () => {
      const checklist = preparednessService.getChecklistByPhase('before');
      checklist.items[0].completed = true;
      checklist.score = preparednessService.calculatePreparednessScore(checklist);
      
      const text = preparednessService.exportChecklistAsText(checklist);
      
      expect(text).toContain('Checklist Préparation Cyclone');
      expect(text).toContain('Phase: before');
      expect(text).toContain('Score:');
      expect(text).toContain('✓'); // Completed item marker
      expect(text).toContain('☐'); // Uncompleted item marker
    });
  });
});
