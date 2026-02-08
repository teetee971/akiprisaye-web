# Gamification Frontend Integration Guide

Quick guide to integrate the gamification system into your app.

## 🚀 Quick Start

### 1. Add Routes to Your App

Edit your main routing file (e.g., `frontend/src/App.tsx`):

```tsx
import GamificationProfilePage from './pages/GamificationProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import BadgesPage from './pages/BadgesPage';

// Add to your Routes
<Route path="/gamification/profile" element={<GamificationProfilePage />} />
<Route path="/gamification/leaderboard" element={<LeaderboardPage />} />
<Route path="/gamification/badges" element={<BadgesPage />} />
```

### 2. Wrap App with GamificationProvider

```tsx
import { GamificationProvider } from './context/GamificationContext';

function App() {
  return (
    <GamificationProvider>
      {/* Your app content */}
    </GamificationProvider>
  );
}
```

### 3. Add Gamification to User Menu

```tsx
import { Award, Trophy, Target } from 'lucide-react';

<nav>
  <Link to="/gamification/profile">
    <Award /> Mon Profil
  </Link>
  <Link to="/gamification/leaderboard">
    <Trophy /> Classement
  </Link>
  <Link to="/gamification/badges">
    <Target /> Mes Badges
  </Link>
</nav>
```

### 4. Add XP Notification System

```tsx
import { useGamificationContext } from './context/GamificationContext';
import { XPGainToastContainer } from './components/gamification';

function Layout() {
  const { recentGains } = useGamificationContext();
  
  return (
    <>
      {/* Your layout */}
      <XPGainToastContainer 
        events={recentGains}
        onDismiss={(timestamp) => {/* handle dismiss */}}
      />
    </>
  );
}
```

### 5. Trigger XP Gains

When user performs an action:

```tsx
import { useGamificationContext } from './context/GamificationContext';

function ScanButton() {
  const { notifyXPGain } = useGamificationContext();
  
  const handleScan = async () => {
    // Perform scan
    await scanProduct();
    
    // Notify XP gain
    notifyXPGain({
      points: 10,
      source: 'scan',
      message: 'Produit scanné avec succès !',
      timestamp: Date.now()
    });
  };
  
  return <button onClick={handleScan}>Scanner</button>;
}
```

## 🔧 Configuration

### Get User ID from Authentication

Replace `'demo-user'` with actual user ID:

```tsx
// In your pages
import { useAuth } from './hooks/useAuth'; // Your auth hook

function GamificationProfilePage() {
  const { user } = useAuth();
  const userId = user?.id || '';
  
  const { profile } = useGamification({ userId });
  // ...
}
```

### Customize API Base URL

If your API is at a different URL, update hooks:

```tsx
// In hooks/useGamification.ts
const API_BASE = process.env.REACT_APP_API_URL + '/api/gamification';
// or
const API_BASE = '/api/v1/gamification';
```

### Customize Level Colors

Edit `frontend/src/types/gamification.ts`:

```tsx
export const LEVELS: Level[] = [
  { level: 1, name: 'Débutant', minXP: 0, maxXP: 99, icon: '🌱', color: '#your-color' },
  // ...
];
```

## 🎨 Customization Examples

### Add Gamification Widget to Dashboard

```tsx
import { useGamification } from './hooks/useGamification';
import { LevelBadge, LevelProgressBar, StreakCounter } from './components/gamification';

function Dashboard() {
  const { user } = useAuth();
  const { profile } = useGamification({ userId: user?.id });
  
  if (!profile) return null;
  
  return (
    <div className="dashboard">
      <div className="gamification-widget">
        <LevelBadge level={profile.level} size="lg" showName={true} />
        <LevelProgressBar 
          currentXP={profile.totalXP} 
          level={profile.level}
        />
        <StreakCounter 
          currentStreak={profile.currentStreak}
          longestStreak={profile.longestStreak}
        />
      </div>
      {/* Rest of dashboard */}
    </div>
  );
}
```

### Show Mini Leaderboard in Sidebar

```tsx
import { useLeaderboard } from './hooks/useLeaderboard';
import { LeaderboardCard } from './components/gamification';

function Sidebar() {
  const { user } = useAuth();
  const { leaderboard } = useLeaderboard({ userId: user?.id, limit: 5 });
  
  return (
    <aside>
      <LeaderboardCard 
        entries={leaderboard}
        currentUserId={user?.id}
        onViewAll={() => navigate('/gamification/leaderboard')}
      />
    </aside>
  );
}
```

### Display User Level in Header

```tsx
import { LevelBadge } from './components/gamification';
import { useGamification } from './hooks/useGamification';

function Header() {
  const { user } = useAuth();
  const { profile } = useGamification({ userId: user?.id });
  
  return (
    <header>
      <div className="user-menu">
        {profile && <LevelBadge level={profile.level} size="sm" />}
        <span>{user?.name}</span>
      </div>
    </header>
  );
}
```

### Show Recent Badges in Profile

```tsx
import { useBadges } from './hooks/useBadges';
import { BadgeCard } from './components/gamification';

function UserProfile() {
  const { user } = useAuth();
  const { unlockedBadges } = useBadges({ userId: user?.id });
  
  const recentBadges = unlockedBadges
    .sort((a, b) => 
      new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime()
    )
    .slice(0, 3);
  
  return (
    <div>
      <h3>Badges récents</h3>
      <div className="grid grid-cols-3 gap-4">
        {recentBadges.map(badge => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </div>
    </div>
  );
}
```

## 🔔 Real-time Updates

### Option 1: Polling

```tsx
import { useEffect } from 'react';
import { useGamification } from './hooks/useGamification';

function App() {
  const { user } = useAuth();
  const { refresh } = useGamification({ userId: user?.id });
  
  useEffect(() => {
    // Refresh every 5 minutes
    const interval = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);
  
  return <YourApp />;
}
```

### Option 2: WebSocket (if available)

```tsx
import { useEffect } from 'react';
import { useGamificationContext } from './context/GamificationContext';

function App() {
  const { notifyXPGain, updateProfile } = useGamificationContext();
  
  useEffect(() => {
    const ws = new WebSocket('wss://your-api.com/gamification');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'xp_gain') {
        notifyXPGain(data.event);
      } else if (data.type === 'profile_update') {
        updateProfile(data.profile);
      }
    };
    
    return () => ws.close();
  }, []);
  
  return <YourApp />;
}
```

## 🧪 Testing Integration

### Test with Demo User

```tsx
// Use demo user for testing
const DEMO_USER_ID = 'demo-user';

<GamificationProfilePage />
// URL: /gamification/profile?userId=demo-user
```

### Initialize New Users

```tsx
import { useGamification } from './hooks/useGamification';

function OnboardingComplete() {
  const { user } = useAuth();
  const { initialize } = useGamification({ userId: user?.id, autoFetch: false });
  
  const handleComplete = async () => {
    // Initialize gamification profile
    await initialize();
    
    // Redirect to profile
    navigate('/gamification/profile');
  };
  
  return <button onClick={handleComplete}>Terminer</button>;
}
```

## 🎯 Action-to-XP Mapping

Trigger XP gains for user actions:

```tsx
const XP_ACTIONS = {
  SCAN: { points: 10, message: 'Produit scanné' },
  COMPARE: { points: 5, message: 'Comparaison effectuée' },
  CONTRIBUTE: { points: 20, message: 'Prix contribué' },
  DAILY_LOGIN: { points: 5, message: 'Connexion quotidienne' },
  SHARE: { points: 15, message: 'Partage effectué' },
};

// Usage
notifyXPGain({
  points: XP_ACTIONS.SCAN.points,
  source: 'scan',
  message: XP_ACTIONS.SCAN.message,
  timestamp: Date.now()
});
```

## 📊 Analytics Integration

Track gamification events:

```tsx
import { useGamification } from './hooks/useGamification';

function ProfilePage() {
  const { profile } = useGamification({ userId });
  
  useEffect(() => {
    if (profile) {
      // Track page view
      analytics.track('Gamification Profile Viewed', {
        userId: profile.userId,
        level: profile.level,
        totalXP: profile.totalXP,
        badges: profile.badges.length
      });
    }
  }, [profile]);
  
  return <div>...</div>;
}
```

## 🔒 Authorization

Protect routes if needed:

```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

function ProtectedGamificationRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  
  return children;
}

// Usage
<Route 
  path="/gamification/profile" 
  element={
    <ProtectedGamificationRoute>
      <GamificationProfilePage />
    </ProtectedGamificationRoute>
  } 
/>
```

## ✅ Checklist

- [ ] Add routes to App.tsx
- [ ] Wrap app with GamificationProvider
- [ ] Connect to authentication system
- [ ] Replace demo user with actual user ID
- [ ] Add navigation links
- [ ] Implement XP notification triggers
- [ ] Test with real backend API
- [ ] Add gamification widgets to dashboard
- [ ] Configure API endpoints
- [ ] Test on mobile devices
- [ ] Verify accessibility
- [ ] Add analytics tracking

## 🚨 Troubleshooting

### Issue: "User not found"
**Solution**: Initialize user with POST `/api/gamification/initialize`

### Issue: XP notifications not showing
**Solution**: Ensure GamificationProvider wraps your app and call `notifyXPGain()`

### Issue: Leaderboard not loading
**Solution**: Check API endpoint and user permissions

### Issue: TypeScript errors
**Solution**: Ensure all types are imported from `types/gamification.ts`

## 📚 Additional Resources

- Full Documentation: `GAMIFICATION_FRONTEND_README.md`
- Implementation Summary: `GAMIFICATION_FRONTEND_SUMMARY.md`
- Component Examples: See individual component files
- Hook Documentation: See individual hook files

## 🎉 You're Ready!

Your gamification system is now integrated. Users can:
- 🏆 View their profile and progress
- 🎯 Track and complete challenges
- 🏅 Collect badges
- 📊 See leaderboard rankings
- 🔥 Maintain streaks
- ⚡ Receive XP notifications

Enjoy your gamified app!
