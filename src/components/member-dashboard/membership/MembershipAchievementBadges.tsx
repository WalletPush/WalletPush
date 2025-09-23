import React from 'react'
import { 
  TrophyIcon, 
  StarIcon,
  FireIcon,
  CalendarIcon,
  UserGroupIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { TrophyIcon as TrophySolid, StarIcon as StarSolid } from '@heroicons/react/24/solid'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'engagement' | 'milestone' | 'social' | 'special' | 'tier'
  earned: boolean
  earnedDate?: string
  progress?: { current: number; required: number }
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
  points: number
}

interface LeaderboardEntry {
  rank: number
  name: string
  avatar: string
  points: number
  badges: number
  isCurrentUser?: boolean
}

interface MembershipAchievementBadgesProps {
  earnedBadges?: Achievement[]
  availableBadges?: Achievement[]
  totalPoints?: number
  currentRank?: number
  leaderboard?: LeaderboardEntry[]
  monthlyGoal?: { current: number; target: number; metric: string }
}

export function MembershipAchievementBadges({ 
  earnedBadges = [
    {
      id: '1',
      name: 'Early Bird',
      description: 'Book 5 morning classes',
      icon: '🌅',
      category: 'engagement',
      earned: true,
      earnedDate: '2024-11-15',
      rarity: 'common',
      points: 50
    },
    {
      id: '2',
      name: 'Fitness Fanatic',
      description: 'Visit the gym 20 times in a month',
      icon: '💪',
      category: 'milestone',
      earned: true,
      earnedDate: '2024-12-01',
      rarity: 'uncommon',
      points: 100
    },
    {
      id: '3',
      name: 'Social Butterfly',
      description: 'Bring 3 different guests',
      icon: '🦋',
      category: 'social',
      earned: true,
      earnedDate: '2024-10-20',
      rarity: 'rare',
      points: 150
    }
  ],
  availableBadges = [
    {
      id: '4',
      name: 'Dedicated Member',
      description: 'Visit 30 times in a month',
      icon: '🏆',
      category: 'milestone',
      earned: false,
      progress: { current: 18, required: 30 },
      rarity: 'rare',
      points: 200
    },
    {
      id: '5',
      name: 'Class Champion',
      description: 'Attend 50 group classes',
      icon: '🎯',
      category: 'engagement',
      earned: false,
      progress: { current: 32, required: 50 },
      rarity: 'uncommon',
      points: 120
    },
    {
      id: '6',
      name: 'Spa Seeker',
      description: 'Book 10 spa services',
      icon: '🧖‍♀️',
      category: 'engagement',
      earned: false,
      progress: { current: 6, required: 10 },
      rarity: 'common',
      points: 75
    }
  ],
  totalPoints = 300,
  currentRank = 12,
  leaderboard = [
    { rank: 1, name: 'Sarah Chen', avatar: '/images/profilepic.png', points: 2450, badges: 24 },
    { rank: 2, name: 'Mike Rodriguez', avatar: '/images/profilepic.png', points: 2380, badges: 22 },
    { rank: 3, name: 'Emily Park', avatar: '/images/profilepic.png', points: 2210, badges: 19 },
    { rank: 10, name: 'David Kim', avatar: '/images/profilepic.png', points: 1850, badges: 16 },
    { rank: 11, name: 'Lisa Wang', avatar: '/images/profilepic.png', points: 1820, badges: 15 },
    { rank: 12, name: 'You', avatar: '/images/profilepic.png', points: 1750, badges: 12, isCurrentUser: true }
  ],
  monthlyGoal = { current: 18, target: 25, metric: 'visits' }
}: MembershipAchievementBadgesProps) {
  const [selectedCategory, setSelectedCategory] = React.useState('all')
  const [showLeaderboard, setShowLeaderboard] = React.useState(false)

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-white/10 text-white border-slate-300'
      case 'uncommon': return 'bg-green-500/100/20 text-green-400 border-green-300'
      case 'rare': return 'bg-white/10 text-white border-blue-300'
      case 'legendary': return 'bg-white/10 text-white border-purple-300'
      default: return 'bg-white/10 text-white border-slate-300'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'engagement': return <FireIcon className="w-4 h-4" />
      case 'milestone': return <TrophyIcon className="w-4 h-4" />
      case 'social': return <UserGroupIcon className="w-4 h-4" />
      case 'special': return <StarIcon className="w-4 h-4" />
      case 'tier': return <TrophySolid className="w-4 h-4" />
      default: return <CheckCircleIcon className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'engagement': return 'text-orange-600'
      case 'milestone': return 'text-yellow-600'
      case 'social': return 'text-blue-600'
      case 'special': return 'text-purple-600'
      case 'tier': return 'text-green-600'
      default: return 'text-white'
    }
  }

  const allBadges = [...earnedBadges, ...availableBadges]
  const filteredBadges = selectedCategory === 'all' 
    ? allBadges 
    : allBadges.filter(badge => badge.category === selectedCategory)

  const monthlyProgress = (monthlyGoal.current / monthlyGoal.target) * 100

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <TrophyIcon className="w-5 h-5 text-white" />
          Achievements & Badges
        </h2>
        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium text-white">{totalPoints} points</span>
          <span className="text-white">Rank #{currentRank}</span>
        </div>
      </div>

      {/* Monthly Goal Progress */}
      <div className="bg-white/10 border border-white/20 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-white">Monthly Goal</h3>
          <span className="text-sm font-bold text-white">{Math.round(monthlyProgress)}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2 mb-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(monthlyProgress, 100)}%` }}
          />
        </div>
        <p className="text-sm text-white">
          {monthlyGoal.current} / {monthlyGoal.target} {monthlyGoal.metric} this month
        </p>
        {monthlyGoal.current >= monthlyGoal.target && (
          <div className="mt-2 flex items-center gap-1 text-green-400">
            <CheckCircleIcon className="w-4 h-4" />
            <span className="text-xs font-medium">Goal achieved! 🎉</span>
          </div>
        )}
      </div>

      {/* Category Filters & Leaderboard Toggle */}
      <div className="space-y-3 mb-4">
        {/* Category Filter Buttons - Single Column to Prevent Overflow */}
        <div className="space-y-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`w-full px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
              selectedCategory === 'all'
                ? 'text-white bg-white/10'
                : 'text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            All Badges
          </button>
          {['engagement', 'milestone', 'social', 'special'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`w-full px-3 py-2 text-sm font-medium rounded-xl transition-colors capitalize ${
                selectedCategory === category
                  ? 'text-white bg-white/10'
                  : 'text-white bg-white/5 hover:bg-white/10'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        {/* Leaderboard Toggle Button */}
        <button 
          onClick={() => setShowLeaderboard(!showLeaderboard)}
          className="w-full px-3 py-2 text-sm font-medium text-yellow-400 bg-yellow-500/100/20 hover:bg-yellow-200 rounded-xl transition-colors"
        >
          {showLeaderboard ? 'Hide' : 'Show'} Leaderboard
        </button>
      </div>

      {/* Leaderboard */}
      {showLeaderboard && (
        <div className="mb-6 border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white mb-3">Monthly Leaderboard</h3>
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div key={entry.rank} className={`flex items-center justify-between p-2 rounded ${
                entry.isCurrentUser ? 'bg-white/10 border border-white/20' : ''
              }`}>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-6 ${
                    entry.rank <= 3 ? 'text-yellow-600' : 'text-white'
                  }`}>
                    #{entry.rank}
                  </span>
                  <img 
                    src={entry.avatar} 
                    alt={entry.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className={`text-sm ${entry.isCurrentUser ? 'font-medium text-white' : 'text-white'}`}>
                    {entry.name}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-white">
                  <span>{entry.points} pts</span>
                  <span>{entry.badges} badges</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges Grid */}
      <div className="space-y-4">
        {filteredBadges.map((badge) => (
          <div key={badge.id} className={`border rounded-xl p-4 ${
            badge.earned 
              ? 'border-green-500/30 bg-green-500/100/10' 
              : 'border-white/10 bg-white/5'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-2xl ${badge.earned ? '' : 'grayscale opacity-50'}`}>
                  {badge.icon}
                </span>
                <div className={`${getCategoryColor(badge.category)}`}>
                  {getCategoryIcon(badge.category)}
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xs px-2 py-0.5 rounded border ${getRarityColor(badge.rarity)}`}>
                  {badge.rarity}
                </span>
                <span className="text-xs font-medium text-white">
                  {badge.points} pts
                </span>
              </div>
            </div>

            <h3 className={`text-sm font-medium mb-1 ${
              badge.earned ? 'text-white' : 'text-white'
            }`}>
              {badge.name}
            </h3>
            
            <p className={`text-xs mb-3 ${
              badge.earned ? 'text-white' : 'text-purple-400'
            }`}>
              {badge.description}
            </p>

            {badge.earned ? (
              <div className="flex items-center gap-1 text-green-400">
                <CheckCircleIcon className="w-4 h-4" />
                <span className="text-xs font-medium text-white">
                  Earned {formatDate(badge.earnedDate!)}
                </span>
              </div>
            ) : badge.progress ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white">Progress</span>
                  <span className="text-xs font-medium text-white">
                    {badge.progress.current} / {badge.progress.required}
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(badge.progress.current / badge.progress.required) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <span className="text-xs text-purple-400">Not started</span>
            )}
          </div>
        ))}
      </div>

      {filteredBadges.length === 0 && (
        <div className="text-center py-8 text-purple-400">
          <TrophyIcon className="w-12 h-12 mx-auto mb-3 text-purple-400" />
          <h3 className="text-sm font-medium text-white mb-1">No Badges Found</h3>
          <p className="text-sm">Try selecting a different category.</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="space-y-3">
          <button className="px-4 py-2 text-sm font-medium text-yellow-400 bg-yellow-500/100/20 hover:bg-yellow-200 rounded-xl transition-colors">
            View All Achievements
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-slate-200 rounded-xl transition-colors">
            Share Progress
          </button>
        </div>
      </div>
    </div>
  )
}
