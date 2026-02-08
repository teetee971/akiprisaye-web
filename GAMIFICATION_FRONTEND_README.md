# Gamification Frontend System

Complete React/TypeScript frontend implementation for the gamification system.

## 📁 Structure

```
frontend/src/
├── components/gamification/
│   ├── LevelBadge.tsx              # Level badge display
│   ├── LevelProgressBar.tsx        # XP progress bar
│   ├── BadgeCard.tsx               # Single badge card
│   ├── BadgeGrid.tsx               # Badge collection grid
│   ├── BadgeUnlockModal.tsx        # Badge unlock modal
│   ├── StreakFlame.tsx             # Animated flame icon
│   ├── StreakCounter.tsx           # Streak display
│   ├── ChallengeCard.tsx           # Challenge card
│   ├── ChallengeList.tsx           # Challenge list
│   ├── LeaderboardTable.tsx        # Full leaderboard table
│   ├── LeaderboardCard.tsx         # Compact leaderboard
│   ├── XPGainToast.tsx             # XP notification toast
│   ├── UserRankBadge.tsx           # Rank badges (#1, #2, #3)
│   ├── StatsOverview.tsx           # Stats overview
│   └── index.ts                    # Component exports
├── hooks/
│   ├── useGamification.ts          # Main gamification hook
│   ├── useLeaderboard.ts           # Leaderboard hook
│   ├── useBadges.ts                # Badges hook
│   └── useChallenges.ts            # Challenges hook
├── pages/
│   ├── GamificationProfilePage.tsx # User profile page
│   ├── LeaderboardPage.tsx         # Leaderboard page
│   └── BadgesPage.tsx              # Badges collection page
├── context/
│   └── GamificationContext.tsx     # Real-time XP context
└── types/
    └── gamification.ts             # TypeScript types
```

## 🎯 Components

### Core Components

#### LevelBadge
Displays user's level badge with icon and level number.

```tsx
<LevelBadge level={5} size="lg" showName={true} />
```

Props:
- `level`: User's level (1-50)
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `showName`: Show level name below badge
- `className`: Additional CSS classes

#### LevelProgressBar
Shows XP progress to next level.

```tsx
<LevelProgressBar currentXP={1500} level={10} showDetails={true} />
```

#### BadgeCard & BadgeGrid
Display badges with locked/unlocked states.

```tsx
<BadgeGrid 
  badges={badges} 
  showProgress={true}
  onBadgeClick={(badge) => console.log(badge)}
/>
```

#### StreakCounter
Display current streak with animated flame.

```tsx
<StreakCounter 
  currentStreak={7} 
  longestStreak={15}
  todayCompleted={true}
  size="lg"
/>
```

#### ChallengeList
List of active challenges with progress.

```tsx
<ChallengeList 
  challenges={challenges}
  showFilters={true}
/>
```

#### LeaderboardTable
Full leaderboard with rankings.

```tsx
<LeaderboardTable 
  entries={leaderboard}
  currentUserId={userId}
  showTerritory={true}
/>
```

### Notification Components

#### XPGainToast
Toast notification for XP gains.

```tsx
<XPGainToast 
  event={{
    points: 10,
    source: 'scan',
    message: 'Produit scanné',
    timestamp: Date.now()
  }}
  onDismiss={() => {}}
/>
```

#### BadgeUnlockModal
Animated modal when badge is unlocked.

```tsx
<BadgeUnlockModal 
  badge={badge}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
/>
```

## 🎣 Hooks

### useGamification
Main hook for gamification data.

```tsx
const { 
  profile,           // User profile
  dashboard,         // Dashboard data
  pointsSummary,     // Points summary
  loading,           // Loading state
  error,             // Error message
  refresh,           // Refresh function
  initialize         // Initialize profile
} = useGamification({ userId, autoFetch: true });
```

### useLeaderboard
Leaderboard data and rankings.

```tsx
const {
  leaderboard,       // Leaderboard entries
  userRank,          // User's rank
  neighbors,         // Nearby users
  loading,
  error,
  refresh,
  updateFilters      // Update filters
} = useLeaderboard({ 
  userId,
  period: 'all_time',
  territory: 'GP',
  limit: 100
});
```

### useBadges
Badge management.

```tsx
const {
  badges,            // All badges
  unlockedBadges,    // Unlocked badges
  lockedBadges,      // Locked badges
  loading,
  error,
  refresh,
  getBadgeProgress   // Get badge progress
} = useBadges({ userId });
```

### useChallenges
Challenge tracking.

```tsx
const {
  challenges,          // All challenges
  activeChallenges,    // Active challenges
  completedChallenges, // Completed challenges
  challengeHistory,    // Challenge history
  loading,
  error,
  refresh
} = useChallenges({ userId });
```

## 🌐 Context

### GamificationContext
Provides real-time XP tracking across the app.

```tsx
// Wrap your app
<GamificationProvider initialProfile={profile}>
  <App />
</GamificationProvider>

// Use in components
const { 
  currentXP,
  currentLevel,
  recentGains,
  notifyXPGain,
  clearGains,
  updateProfile
} = useGamificationContext();

// Notify XP gain
notifyXPGain({
  points: 10,
  source: 'scan',
  message: 'Produit scanné',
  timestamp: Date.now()
});
```

## 📄 Pages

### GamificationProfilePage
Complete user profile with stats, badges, challenges.

**Route**: `/gamification/profile?userId={id}`

Features:
- Level badge and progress
- Streak counter
- Active challenges
- Badge collection preview
- Statistics overview
- Leaderboard preview

### LeaderboardPage
Full leaderboard with filters.

**Route**: `/gamification/leaderboard?userId={id}`

Features:
- Filter by period (all-time, monthly, weekly)
- Filter by territory
- User's current rank
- Top 100 rankings
- Stats summary

### BadgesPage
Badge collection page.

**Route**: `/gamification/badges?userId={id}`

Features:
- All badges grid
- Filter by category/tier/status
- Progress tracking
- Badge unlock modal
- Category grouping

## 🔌 API Integration

All hooks use the backend API at `/api/gamification/`:

```typescript
// Profile
GET /api/gamification/profile?userId={id}
GET /api/gamification/dashboard?userId={id}

// Points
GET /api/gamification/points?userId={id}
GET /api/gamification/points/history?userId={id}
GET /api/gamification/points/summary?userId={id}

// Badges
GET /api/gamification/badges?userId={id}
GET /api/gamification/badges/all
GET /api/gamification/badges/{id}/progress?userId={id}

// Challenges
GET /api/gamification/challenges?userId={id}
GET /api/gamification/challenges/history?userId={id}

// Leaderboard
GET /api/gamification/leaderboard?period={period}&territory={territory}
GET /api/gamification/leaderboard/rank?userId={id}&period={period}
GET /api/gamification/leaderboard/neighbors?userId={id}&range=3

// Initialize
POST /api/gamification/initialize
Body: { userId: string }
```

## 🎨 Design System

### Colors
- **Blue**: Primary actions, progress
- **Purple**: Secondary, badges
- **Yellow/Orange**: Streaks, achievements
- **Green**: Success, completed
- **Red**: Errors, warnings

### Sizes
- `sm`: Small components (mobile)
- `md`: Default size
- `lg`: Large displays
- `xl`: Hero elements

### Animations
- Pulse effects for active elements
- Smooth transitions (300ms)
- Loading spinners
- Toast notifications
- Badge unlock animations

## 📱 Responsive Design

All components are fully responsive:
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly buttons (min 44x44px)
- Scrollable lists and grids
- Collapsible sections on mobile

## ♿ Accessibility

- ARIA labels and roles
- Keyboard navigation
- Focus indicators
- Screen reader support
- Color contrast compliance (WCAG AA)
- Semantic HTML

## 🚀 Usage Example

```tsx
import React from 'react';
import { GamificationProvider } from './context/GamificationContext';
import GamificationProfilePage from './pages/GamificationProfilePage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <GamificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/gamification/profile" element={<GamificationProfilePage />} />
          <Route path="/gamification/leaderboard" element={<LeaderboardPage />} />
          <Route path="/gamification/badges" element={<BadgesPage />} />
        </Routes>
      </BrowserRouter>
    </GamificationProvider>
  );
}
```

## 🔄 State Management

- React hooks for local state
- Context for global XP tracking
- Automatic refresh on mount
- Manual refresh support
- Error handling and retries

## 🎯 Key Features

✅ Real-time XP notifications
✅ Animated badge unlocks
✅ Progress tracking
✅ Leaderboard rankings
✅ Challenge management
✅ Streak tracking
✅ Statistics dashboard
✅ Territory filters
✅ Period filters
✅ Responsive design
✅ Accessibility compliant
✅ TypeScript support
✅ Error handling
✅ Loading states
✅ Empty states

## 🧪 Testing

To test components in isolation:

```tsx
import { render, screen } from '@testing-library/react';
import { LevelBadge } from './components/gamification';

test('displays level badge', () => {
  render(<LevelBadge level={5} showName={true} />);
  expect(screen.getByText('Contributeur')).toBeInTheDocument();
});
```

## 🐛 Troubleshooting

### Badge not showing
- Check userId is valid
- Verify API endpoint is accessible
- Check badge data structure

### Progress not updating
- Call `refresh()` after actions
- Check WebSocket connection (if implemented)
- Verify API returns updated data

### Styles not applying
- Ensure Tailwind CSS is configured
- Check for CSS conflicts
- Verify Lucide React is installed

## 📦 Dependencies

Required npm packages:
- `react` ^18.3.1
- `react-dom` ^18.3.1
- `react-router-dom` ^7.13.0
- `lucide-react` ^0.468.0
- `tailwindcss` (configured)

## 🔐 Security

- No sensitive data in localStorage
- API calls require authentication
- XSS protection via React
- CSRF tokens for mutations
- Input validation

## 📈 Performance

- Lazy loading for pages
- Memoization for expensive computations
- Virtual scrolling for large lists
- Debounced filters
- Image optimization

## 🎓 Best Practices

1. Always provide userId
2. Handle loading and error states
3. Use TypeScript types
4. Follow accessibility guidelines
5. Test on mobile devices
6. Use semantic HTML
7. Optimize images
8. Keep components small
9. Document complex logic
10. Monitor performance

## 📝 License

Part of the A Ki Pri Sa Yé platform.
