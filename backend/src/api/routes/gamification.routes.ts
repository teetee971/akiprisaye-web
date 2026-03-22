/**
 * Gamification API Routes
 * Endpoints for gamification features
 */

import express, { Request, Response } from 'express';
import * as gamification from '../../services/gamification/index';
import { PointAction } from '@prisma/client';

const router = express.Router();

/**
 * GET /api/gamification/profile
 * Get user's complete gamification profile
 */
router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return void res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    const profile = await gamification.getUserGamificationProfile(userId);
    res.json({ success: true, profile });
  } catch (error) {
    console.error('Error fetching gamification profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gamification profile'
    });
  }
});

/**
 * GET /api/gamification/profile/:userId
 * Get specific user's gamification profile
 */
router.get('/profile/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const profile = await gamification.getUserGamificationProfile(userId);
    res.json({ success: true, profile });
  } catch (error) {
    console.error('Error fetching gamification profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gamification profile'
    });
  }
});

/**
 * GET /api/gamification/dashboard
 * Get user's dashboard summary
 */
router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return void res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    const dashboard = await gamification.getDashboardSummary(userId);
    res.json({ success: true, dashboard });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard'
    });
  }
});

/**
 * GET /api/gamification/points
 * Get user's points
 */
router.get('/points', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return void res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    const totalPoints = await gamification.points.getUserTotalPoints(userId);
    res.json({ success: true, points: totalPoints });
  } catch (error) {
    console.error('Error fetching points:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch points'
    });
  }
});

/**
 * GET /api/gamification/points/history
 * Get user's points history
 */
router.get('/points/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    if (!userId) {
      return void res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    const history = await gamification.points.getPointsHistory(userId, limit);
    res.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching points history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch points history'
    });
  }
});

/**
 * GET /api/gamification/points/summary
 * Get user's points summary
 */
router.get('/points/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return void res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    const summary = await gamification.points.getPointsSummary(userId);
    res.json({ success: true, summary });
  } catch (error) {
    console.error('Error fetching points summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch points summary'
    });
  }
});

/**
 * POST /api/gamification/points/award
 * Award points to user (internal use)
 */
router.post('/points/award', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, action, metadata } = req.body;

    if (!userId || !action) {
      return void res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, action'
      });
    }

    const result = await gamification.handleUserAction(
      userId,
      action as PointAction,
      metadata
    );

    res.json({ success: true, result });
  } catch (error) {
    console.error('Error awarding points:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to award points'
    });
  }
});

/**
 * GET /api/gamification/level
 * Get user's level
 */
router.get('/level', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return void res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    const totalXP = await gamification.points.getUserTotalPoints(userId);
    const levelData = gamification.levels.calculateLevel(totalXP);

    res.json({ success: true, level: levelData });
  } catch (error) {
    console.error('Error fetching level:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch level'
    });
  }
});

/**
 * GET /api/gamification/levels
 * Get all levels
 */
router.get('/levels', (_req: Request, res: Response) => {
  try {
    const levels = gamification.levels.getAllLevels();
    res.json({ success: true, levels });
  } catch (error) {
    console.error('Error fetching levels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch levels'
    });
  }
});

/**
 * GET /api/gamification/badges
 * Get user's badges
 */
router.get('/badges', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return void res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    const badges = await gamification.badges.getUserBadges(userId);
    res.json({ success: true, badges });
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch badges'
    });
  }
});

/**
 * GET /api/gamification/badges/all
 * Get all available badges
 */
router.get('/badges/all', (_req: Request, res: Response) => {
  try {
    const badges = gamification.badges.getAllBadges();
    res.json({ success: true, badges });
  } catch (error) {
    console.error('Error fetching all badges:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch all badges'
    });
  }
});

/**
 * GET /api/gamification/badges/:id/progress
 * Get badge progress for user
 */
router.get('/badges/:id/progress', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.query.userId as string;

    if (!userId) {
      return void res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    const progress = await gamification.badges.getBadgeProgress(userId, id);
    res.json({ success: true, progress });
  } catch (error) {
    console.error('Error fetching badge progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch badge progress'
    });
  }
});

/**
 * POST /api/gamification/badges/check
 * Check and award badges (internal use)
 */
router.post('/badges/check', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return void res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    const newBadges = await gamification.badges.checkAndAwardBadges(userId);
    res.json({ success: true, newBadges });
  } catch (error) {
    console.error('Error checking badges:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check badges'
    });
  }
});

/**
 * GET /api/gamification/streak
 * Get user's streak
 */
router.get('/streak', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return void res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    const streak = await gamification.streaks.getStreak(userId);
    res.json({ success: true, streak });
  } catch (error) {
    console.error('Error fetching streak:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch streak'
    });
  }
});

/**
 * GET /api/gamification/streak/leaderboard
 * Get streak leaderboard
 */
router.get('/streak/leaderboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const leaderboard = await gamification.streaks.getStreakLeaderboard(limit);
    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('Error fetching streak leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch streak leaderboard'
    });
  }
});

/**
 * GET /api/gamification/challenges
 * Get active challenges
 */
router.get('/challenges', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return void res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    const challenges = await gamification.challenges.getActiveChallenges(userId);
    res.json({ success: true, challenges });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch challenges'
    });
  }
});

/**
 * GET /api/gamification/challenges/history
 * Get completed challenges
 */
router.get('/challenges/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return void res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    const history = await gamification.challenges.getCompletedChallenges(userId);
    res.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching challenge history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch challenge history'
    });
  }
});

/**
 * GET /api/gamification/leaderboard
 * Get leaderboard
 */
router.get('/leaderboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const territory = req.query.territory as string | undefined;
    const period = (req.query.period as 'all_time' | 'monthly' | 'weekly') || 'all_time';
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    const leaderboard = await gamification.leaderboard.getLeaderboard({
      territory,
      period,
      limit
    });

    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

/**
 * GET /api/gamification/leaderboard/rank
 * Get user's rank
 */
router.get('/leaderboard/rank', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string;
    const territory = req.query.territory as string | undefined;
    const period = (req.query.period as 'all_time' | 'monthly' | 'weekly') || 'all_time';

    if (!userId) {
      return void res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    const rank = await gamification.leaderboard.getUserRank(userId, {
      territory,
      period
    });

    res.json({ success: true, rank });
  } catch (error) {
    console.error('Error fetching user rank:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user rank'
    });
  }
});

/**
 * GET /api/gamification/leaderboard/neighbors
 * Get user's neighbors on leaderboard
 */
router.get('/leaderboard/neighbors', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string;
    const range = req.query.range ? parseInt(req.query.range as string) : 3;

    if (!userId) {
      return void res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    const neighbors = await gamification.leaderboard.getLeaderboardNeighbors(userId, range);
    res.json({ success: true, neighbors });
  } catch (error) {
    console.error('Error fetching leaderboard neighbors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard neighbors'
    });
  }
});

/**
 * GET /api/gamification/leaderboard/stats
 * Get leaderboard statistics
 */
router.get('/leaderboard/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await gamification.leaderboard.getLeaderboardStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching leaderboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard stats'
    });
  }
});

/**
 * GET /api/gamification/leaderboard/top-contributors
 * Get top contributors
 */
router.get('/leaderboard/top-contributors', async (req: Request, res: Response): Promise<void> => {
  try {
    const metric = (req.query.metric as 'prices' | 'verifications' | 'photos') || 'prices';
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const contributors = await gamification.leaderboard.getTopContributors(metric, limit);
    res.json({ success: true, contributors });
  } catch (error) {
    console.error('Error fetching top contributors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top contributors'
    });
  }
});

/**
 * POST /api/gamification/initialize
 * Initialize gamification for a user
 */
router.post('/initialize', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return void res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    await gamification.initializeUserGamification(userId);
    res.json({ success: true, message: 'Gamification initialized' });
  } catch (error) {
    console.error('Error initializing gamification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize gamification'
    });
  }
});

export default router;
