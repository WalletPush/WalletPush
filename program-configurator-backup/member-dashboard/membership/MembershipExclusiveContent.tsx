import React from 'react'
import { 
  PlayIcon, 
  DocumentTextIcon,
  BookmarkIcon,
  EyeIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid'

interface ContentItem {
  id: string
  title: string
  description: string
  category: 'masterclass' | 'report' | 'interview' | 'webinar' | 'ebook' | 'podcast'
  author: string
  duration?: string
  releaseDate: string
  thumbnail: string
  isNew: boolean
  isBookmarked: boolean
  viewCount: number
  rating: number
  memberLevel: 'silver' | 'gold' | 'platinum' | 'all'
}

interface MembershipExclusiveContentProps {
  categories?: string[]
  newContent?: ContentItem[]
  bookmarks?: ContentItem[]
  recentlyViewed?: ContentItem[]
  memberLevel?: 'silver' | 'gold' | 'platinum'
}

export function MembershipExclusiveContent({ 
  categories = ['Masterclasses', 'Industry Reports', 'Expert Interviews', 'Webinars', 'E-books', 'Podcasts'],
  newContent = [
    {
      id: '1',
      title: 'Advanced Investment Strategies for 2025',
      description: 'Exclusive insights from top portfolio managers on emerging market opportunities.',
      category: 'masterclass',
      author: 'Warren Chen, CFA',
      duration: '45 min',
      releaseDate: '2024-12-15',
      thumbnail: '/images/Yoga.png',
      isNew: true,
      isBookmarked: false,
      viewCount: 234,
      rating: 4.8,
      memberLevel: 'gold'
    },
    {
      id: '2',
      title: 'Q4 2024 Market Analysis Report',
      description: 'Comprehensive analysis of market trends and predictions for the coming quarter.',
      category: 'report',
      author: 'Goldman Research Team',
      releaseDate: '2024-12-10',
      thumbnail: '/images/book.jpg',
      isNew: true,
      isBookmarked: true,
      viewCount: 567,
      rating: 4.9,
      memberLevel: 'silver'
    },
    {
      id: '3',
      title: 'Leadership in Crisis: CEO Roundtable',
      description: 'Fortune 500 CEOs share strategies for navigating uncertain times.',
      category: 'interview',
      author: 'Executive Forum',
      duration: '60 min',
      releaseDate: '2024-12-08',
      thumbnail: '/images/Yoga.png',
      isNew: true,
      isBookmarked: false,
      viewCount: 1203,
      rating: 4.7,
      memberLevel: 'platinum'
    }
  ],
  bookmarks = [],
  recentlyViewed = [],
  memberLevel = 'gold'
}: MembershipExclusiveContentProps) {
  const [selectedCategory, setSelectedCategory] = React.useState('all')
  const [searchTerm, setSearchTerm] = React.useState('')

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'masterclass': return '🎓'
      case 'report': return '📊'
      case 'interview': return '🎙️'
      case 'webinar': return '💻'
      case 'ebook': return '📚'
      case 'podcast': return '🎧'
      default: return '📄'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'masterclass': return 'bg-white/10 text-white border-white/20'
      case 'report': return 'bg-white/10 text-white border-white/20'
      case 'interview': return 'bg-green-500/100/20 text-green-400 border-green-500/30'
      case 'webinar': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'ebook': return 'bg-pink-100 text-pink-700 border-pink-200'
      case 'podcast': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
      default: return 'bg-white/10 text-white border-white/10'
    }
  }

  const getMemberLevelColor = (level: string) => {
    switch (level) {
      case 'silver': return 'text-white'
      case 'gold': return 'text-yellow-600'
      case 'platinum': return 'text-purple-600'
      default: return 'text-white'
    }
  }

  const canAccess = (contentLevel: string) => {
    const levels = ['silver', 'gold', 'platinum']
    const userIndex = levels.indexOf(memberLevel)
    const contentIndex = levels.indexOf(contentLevel)
    return contentLevel === 'all' || userIndex >= contentIndex
  }

  const handleBookmark = (contentId: string) => {
    console.log('Toggling bookmark for:', contentId)
    // Bookmark logic would go here
  }

  const handlePlay = (contentId: string) => {
    console.log('Playing content:', contentId)
    // Content playback logic
  }

  const filteredContent = newContent.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

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
          <DocumentTextIcon className="w-5 h-5 text-white" />
          Exclusive Content Library
        </h2>
        <span className={`text-sm font-medium ${getMemberLevelColor(memberLevel)}`}>
          {memberLevel.charAt(0).toUpperCase() + memberLevel.slice(1)} Access
        </span>
      </div>

      {/* Search and Filter */}
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search content..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 text-sm font-medium rounded-xl transition-colors ${
              selectedCategory === 'all'
                ? 'text-white bg-white/10'
                : 'text-white bg-white/10 hover:bg-slate-200'
            }`}
          >
            All Content
          </button>
          {['masterclass', 'report', 'interview', 'webinar', 'ebook', 'podcast'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-sm font-medium rounded-xl transition-colors ${
                selectedCategory === category
                  ? 'text-white bg-white/10'
                  : 'text-white bg-white/10 hover:bg-slate-200'
              }`}
            >
              {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="space-y-4">
        {filteredContent.map((item) => {
          const hasAccess = canAccess(item.memberLevel)
          
          return (
            <div key={item.id} className={`border rounded-xl overflow-hidden ${hasAccess ? 'border-white/10' : 'border-slate-300 opacity-60'}`}>
              {/* Thumbnail */}
              <div className="relative aspect-video bg-white/10">
                <img 
                  src={item.thumbnail} 
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                {item.isNew && (
                  <span className="absolute top-2 left-2 px-2 py-1 bg-red-500/100 text-white text-xs font-medium rounded">
                    NEW
                  </span>
                )}
                {!hasAccess && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {item.memberLevel.charAt(0).toUpperCase() + item.memberLevel.slice(1)} Only
                    </span>
                  </div>
                )}
                {hasAccess && (
                  <button 
                    onClick={() => handlePlay(item.id)}
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <PlayIcon className="w-12 h-12 text-white" />
                  </button>
                )}
              </div>

              {/* Content Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded border ${getCategoryColor(item.category)}`}>
                        {getCategoryIcon(item.category)} {item.category}
                      </span>
                      <span className={`text-xs font-medium ${getMemberLevelColor(item.memberLevel)}`}>
                        {item.memberLevel.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-white mb-1 line-clamp-2">{item.title}</h3>
                    <p className="text-xs text-white mb-2 line-clamp-2">{item.description}</p>
                  </div>
                  
                  <button 
                    onClick={() => handleBookmark(item.id)}
                    disabled={!hasAccess}
                    className="ml-2 p-1 text-slate-400 hover:text-blue-600 transition-colors disabled:cursor-not-allowed"
                  >
                    {item.isBookmarked ? (
                      <BookmarkSolid className="w-4 h-4 text-blue-600" />
                    ) : (
                      <BookmarkIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-purple-400">
                  <div className="flex items-center gap-3">
                    <span>{item.author}</span>
                    {item.duration && (
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        <span>{item.duration}</span>
                      </div>
                    )}
                  </div>
                  <span>{formatDate(item.releaseDate)}</span>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3 text-xs text-purple-400">
                    <div className="flex items-center gap-1">
                      <EyeIcon className="w-3 h-3" />
                      <span>{item.viewCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StarIcon className="w-3 h-3 text-yellow-500" />
                      <span>{item.rating}</span>
                    </div>
                  </div>
                  
                  {hasAccess ? (
                    <button 
                      onClick={() => handlePlay(item.id)}
                      className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                    >
                      {item.category === 'report' || item.category === 'ebook' ? 'Read' : 'Watch'}
                    </button>
                  ) : (
                    <span className="px-3 py-1 text-xs font-medium text-purple-400 bg-slate-200 rounded">
                      Upgrade
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredContent.length === 0 && (
        <div className="text-center py-8 text-purple-400">
          <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <h3 className="text-sm font-medium text-white mb-1">No Content Found</h3>
          <p className="text-sm">Try adjusting your search or category filter.</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="space-y-3">
          <button className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-blue-200 rounded-xl transition-colors">
            View Bookmarks
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-slate-200 rounded-xl transition-colors">
            Continue Watching
          </button>
        </div>
      </div>
    </div>
  )
}
