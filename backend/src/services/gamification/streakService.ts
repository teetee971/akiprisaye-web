/**
 * Streak Service - Manages daily streaks and activity tracking
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UserStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
  streakStartDate: Date | null;
  isActive: boolean;
}

/**
 * Record user activity and update streak
 */
export async function recordActivity(userId: string): Promise<UserStreak> {
  // Get or create user gamification profile
  let userGamification = await prisma.userGamification.findUnique({
    where: { userId }
  });

  if (!userGamification) {
    userGamification = await prisma.userGamification.create({
      data: { userId }
    });
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const lastActivity = userGamification.lastActiveDate;
  let newStreak = userGamification.currentStreak;
  let newLongestStreak = userGamification.longestStreak;

  // If no previous activity, start streak
  if (!lastActivity) {
    newStreak = 1;
  } else {
    const lastActivityDate = new Date(
      lastActivity.getFullYear(),
      lastActivity.getMonth(),
      lastActivity.getDate()
    );

    const daysSinceLastActivity = Math.floor(
      (today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastActivity === 0) {
      // Same day, no change
      newStreak = userGamification.currentStreak;
    } else if (daysSinceLastActivity === 1) {
      // Consecutive day, increment streak
      newStreak = userGamification.currentStreak + 1;
    } else {
      // Streak broken, reset
      newStreak = 1;
    }
  }

  // Update longest streak if current is higher
  if (newStreak > newLongestStreak) {
    newLongestStreak = newStreak;
  }

  // Update database
  const updated = await prisma.userGamification.update({
    where: { id: userGamification.id },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastActiveDate: now,
    }
  });

  return {
    userId,
    currentStreak: updated.currentStreak,
    longestStreak: updated.longestStreak,
    lastActivityDate: updated.lastActiveDate,
    streakStartDate: null,
    isActive: true
  };
}

/**
 * Get user's streak information
 */
export async function getStreak(userId: string): Promise<UserStreak> {
  const userGamification = await prisma.userGamification.findUnique({
    where: { userId }
  });

  if (!userGamification) {
    return {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      streakStartDate: null,
      isActive: false
    };
  }

  // Check if streak is still active
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let isActive = false;
  if (userGamification.lastActiveDate) {
    const lastActivityDate = new Date(
      userGamification.lastActiveDate.getFullYear(),
      userGamification.lastActiveDate.getMonth(),
      userGamification.lastActiveDate.getDate()
    );

    const daysSinceLastActivity = Math.floor(
      (today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Streak is active if last activity was today or yesterday
    isActive = daysSinceLastActivity <= 1;
  }

  return {
    userId,
    currentStreak: userGamification.currentStreak,
    longestStreak: userGamification.longestStreak,
    lastActivityDate: userGamification.lastActiveDate,
    streakStartDate: null,
    isActive
  };
}

/**
 * Check and expire inactive streaks (to be run daily)
 */
export async function checkStreakExpiry(): Promise<number> {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 2); // 2 days ago to account for timezone

  // Find users whose last activity was more than 1 day ago
  const expiredUsers = await prisma.userGamification.findMany({
    where: {
      AND: [
        { currentStreak: { gt: 0 } },
        {
          OR: [
            { lastActiveDate: { lt: yesterday } },
            { lastActiveDate: null }
          ]
        }
      ]
    }
  });

  // Reset their streaks
  for (const user of expiredUsers) {
    await prisma.userGamification.update({
      where: { id: user.id },
      data: {
        currentStreak: 0,
      }
    });
  }

  return expiredUsers.length;
}

/**
 * Get streak leaderboard
 */
export async function getStreakLeaderboard(limit: number = 10): Promise<Array<{
  userId: string;
  username: string;
  currentStreak: number;
  longestStreak: number;
}>> {
  const users = await prisma.userGamification.findMany({
    where: {
      currentStreak: { gt: 0 }
    },
    orderBy: {
      currentStreak: 'desc'
    },
    take: limit,
  });

  return users.map(u => ({
    userId: u.userId,
    username: u.userId,
    currentStreak: u.currentStreak,
    longestStreak: u.longestStreak
  }));
}

/**
 * Get streak statistics
 */
export async function getStreakStats(): Promise<{
  totalActiveStreaks: number;
  averageStreak: number;
  longestActiveStreak: number;
  usersWithStreaks: number;
}> {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const activeUsers = await prisma.userGamification.findMany({
    where: {
      AND: [
        { currentStreak: { gt: 0 } },
        { lastActiveDate: { gte: yesterday } }
      ]
    }
  });

  const totalActiveStreaks = activeUsers.length;
  const averageStreak = totalActiveStreaks > 0
    ? activeUsers.reduce((sum, u) => sum + u.currentStreak, 0) / totalActiveStreaks
    : 0;

  const longestActiveStreak = totalActiveStreaks > 0
    ? Math.max(...activeUsers.map(u => u.currentStreak))
    : 0;

  const usersWithStreaks = await prisma.userGamification.count({
    where: { currentStreak: { gt: 0 } }
  });

  return {
    totalActiveStreaks,
    averageStreak: Math.round(averageStreak * 10) / 10,
    longestActiveStreak,
    usersWithStreaks
  };
}
