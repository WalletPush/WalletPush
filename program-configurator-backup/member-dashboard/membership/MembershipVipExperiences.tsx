import React from 'react'
import { 
  SparklesIcon, 
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import { SparklesIcon as SparklesSolid } from '@heroicons/react/24/solid'

interface VipExperience {
  id: string
  name: string
  description: string
  category: 'dining' | 'wellness' | 'entertainment' | 'travel' | 'networking' | 'education'
  date: string
  time: string
  location: string
  spotsAvailable: number
  totalSpots: number
  price?: string
  isExclusive: boolean
  memberLevel: 'gold' | 'platinum' | 'all'
  earlyAccess?: string
  image: string
  benefits: string[]
}

interface BookedExperience {
  id: string
  experienceName: string
  date: string
  time: string
  location: string
  status: 'confirmed' | 'waitlist' | 'cancelled'
  confirmationCode?: string
  guestCount: number
}

interface MembershipVipExperiencesProps {
  exclusiveEvents?: VipExperience[]
  pastExperiences?: BookedExperience[]
  upcomingBookings?: BookedExperience[]
  memberLevel?: 'silver' | 'gold' | 'platinum'
  earlyAccessHours?: number
}

export function MembershipVipExperiences({ 
  exclusiveEvents = [
    {
      id: '1',
      name: 'Wine Tasting with Celebrity Chef',
      description: 'Intimate evening with Michelin-starred chef Marcus Laurent featuring rare vintage wines.',
      category: 'dining',
      date: '2024-12-20',
      time: '7:00 PM',
      location: 'Private Dining Room',
      spotsAvailable: 3,
      totalSpots: 12,
      price: 'Included',
      isExclusive: true,
      memberLevel: 'platinum',
      earlyAccess: '48 hours',
      image: '/images/Yoga.png',
      benefits: ['5-course tasting menu', 'Wine pairings', 'Chef meet & greet', 'Recipe book']
    },
    {
      id: '2',
      name: 'Executive Networking Mixer',
      description: 'Connect with C-suite executives from Fortune 500 companies in an intimate setting.',
      category: 'networking',
      date: '2025-01-05',
      time: '6:30 PM',
      location: 'Rooftop Lounge',
      spotsAvailable: 8,
      totalSpots: 25,
      price: 'Included',
      isExclusive: false,
      memberLevel: 'gold',
      earlyAccess: '24 hours',
      image: '/images/book.jpg',
      benefits: ['Premium cocktails', 'Gourmet canapés', 'Business card exchange', 'Professional photographer']
    },
    {
      id: '3',
      name: 'Private Yoga with Wellness Guru',
      description: 'Exclusive session with renowned wellness expert and bestselling author Sarah Meditation.',
      category: 'wellness',
      date: '2025-01-15',
      time: '9:00 AM',
      location: 'Zen Garden Studio',
      spotsAvailable: 6,
      totalSpots: 8,
      price: 'Included',
      isExclusive: true,
      memberLevel: 'platinum',
      image: '/images/Yoga.png',
      benefits: ['1-on-1 consultation', 'Personalized routine', 'Organic breakfast', 'Signed book']
    }
  ],
  pastExperiences = [
    {
      id: '1',
      experienceName: 'Art Gallery Opening',
      date: '2024-11-15',
      time: '7:00 PM',
      location: 'Gallery District',
      status: 'confirmed',
      confirmationCode: 'VIP-ART-2024-1115',
      guestCount: 2
    }
  ],
  upcomingBookings = [
    {
      id: '1',
      experienceName: 'Wine Tasting with Celebrity Chef',
      date: '2024-12-20',
      time: '7:00 PM',
      location: 'Private Dining Room',
      status: 'confirmed',
      confirmationCode: 'VIP-WINE-2024-1220',
      guestCount: 1
    }
  ],
  memberLevel = 'gold',
  earlyAccessHours = 24
}: MembershipVipExperiencesProps) {
  const [selectedCategory, setSelectedCategory] = React.useState('all')

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'dining': return '🍽️'
      case 'wellness': return '🧘‍♀️'
      case 'entertainment': return '🎭'
      case 'travel': return '✈️'
      case 'networking': return '🤝'
      case 'education': return '📚'
      default: return '✨'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'dining': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'wellness': return 'bg-green-500/100/20 text-green-400 border-green-500/30'
      case 'entertainment': return 'bg-white/10 text-white border-white/20'
      case 'travel': return 'bg-white/10 text-white border-white/20'
      case 'networking': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
      case 'education': return 'bg-pink-100 text-pink-700 border-pink-200'
      default: return 'bg-white/10 text-white border-white/10'
    }
  }

  const getMemberLevelColor = (level: string) => {
    switch (level) {
      case 'gold': return 'text-yellow-600'
      case 'platinum': return 'text-purple-600'
      default: return 'text-white'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600'
      case 'waitlist': return 'text-yellow-600'
      case 'cancelled': return 'text-red-600'
      default: return 'text-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircleIcon className="w-4 h-4 text-green-500" />
      case 'waitlist': return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
      case 'cancelled': return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
      default: return null
    }
  }

  const canAccess = (experienceLevel: string) => {
    if (experienceLevel === 'all') return true
    const levels = ['silver', 'gold', 'platinum']
    const userIndex = levels.indexOf(memberLevel)
    const experienceIndex = levels.indexOf(experienceLevel)
    return userIndex >= experienceIndex
  }

  const handleBookExperience = (experienceId: string) => {
    console.log('Booking experience:', experienceId)
    // Booking logic
  }

  const handleJoinWaitlist = (experienceId: string) => {
    console.log('Joining waitlist for:', experienceId)
    // Waitlist logic
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string, timeString: string) => {
    return `${formatDate(dateString)} at ${timeString}`
  }

  const filteredEvents = selectedCategory === 'all' 
    ? exclusiveEvents 
    : exclusiveEvents.filter(event => event.category === selectedCategory)

  const hasEarlyAccess = memberLevel === 'gold' || memberLevel === 'platinum'

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-purple-400" />
          VIP Experiences
        </h2>
        <span className={`text-sm font-medium ${getMemberLevelColor(memberLevel)}`}>
          {memberLevel.charAt(0).toUpperCase() + memberLevel.slice(1)} Access
        </span>
      </div>

      {/* Early Access Info */}
      {hasEarlyAccess && (
        <div className="bg-purple-50 border border-white/20 rounded-xl p-3 mb-6">
          <div className="flex items-center gap-2">
            <SparklesSolid className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">
              Early Access: {earlyAccessHours} hours before general booking
            </span>
          </div>
        </div>
      )}

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-white mb-3">Your Upcoming Experiences</h3>
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="border border-white/10 rounded-xl p-4">
                <div className="space-y-4">
                  {/* Experience Header */}
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-white">{booking.experienceName}</h4>
                    {getStatusIcon(booking.status)}
                    <span className={`text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Experience Details */}
                  <div className="space-y-2 text-xs" style={{ color: 'white !important' }}>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3 text-purple-400" />
                      <span style={{ color: 'white !important' }}>{formatDateTime(booking.date, booking.time)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="w-3 h-3 text-purple-400" />
                      <span style={{ color: 'white !important' }}>{booking.location}</span>
                    </div>
                    {booking.confirmationCode && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-purple-400">
                          Confirmation: {booking.confirmationCode}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons - Single Column */}
                  <div className="space-y-2">
                    <button className="w-full px-3 py-2 text-xs font-medium text-white bg-white/10 hover:bg-blue-200 rounded-xl transition-colors">
                      View Details
                    </button>
                    <button className="w-full px-3 py-2 text-xs font-medium text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                      Cancel Booking
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
            selectedCategory === 'all'
              ? 'text-white bg-white/10'
              : 'text-white bg-white/10 hover:bg-slate-200'
          }`}
        >
          All Experiences
        </button>
        {['dining', 'wellness', 'entertainment', 'networking', 'education', 'travel'].map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors capitalize ${
              selectedCategory === category
                ? 'text-white bg-white/10'
                : 'text-white bg-white/10 hover:bg-white/20'
            }`}
          >
            {getCategoryIcon(category)} {category}
          </button>
        ))}
      </div>

      {/* Experiences Grid */}
      <div className="space-y-6">
        {filteredEvents.map((experience) => {
          const hasAccess = canAccess(experience.memberLevel)
          const isAlmostFull = experience.spotsAvailable <= 2 && experience.spotsAvailable > 0
          const isFull = experience.spotsAvailable === 0
          
          return (
            <div key={experience.id} className={`border rounded-xl overflow-hidden ${
              hasAccess ? 'border-white/10' : 'border-slate-300 opacity-75'
            }`}>
              {/* Image */}
              <div className="relative aspect-video bg-white/10">
                <img 
                  src={experience.image} 
                  alt={experience.name}
                  className="w-full h-full object-cover"
                />
                {experience.isExclusive && (
                  <span className="absolute top-2 left-2 px-2 py-1 bg-purple-500 text-white text-xs font-medium rounded">
                    EXCLUSIVE
                  </span>
                )}
                {!hasAccess && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {experience.memberLevel.charAt(0).toUpperCase() + experience.memberLevel.slice(1)} Only
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded border ${getCategoryColor(experience.category)}`}>
                        {getCategoryIcon(experience.category)} {experience.category}
                      </span>
                      <span className={`text-xs font-medium ${getMemberLevelColor(experience.memberLevel)}`}>
                        {experience.memberLevel.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-white mb-1">{experience.name}</h3>
                    <p className="text-xs text-white mb-3 line-clamp-2">{experience.description}</p>
                  </div>
                </div>

                {/* Event Details */}
                <div className="space-y-2 text-xs mb-3" style={{ color: 'white !important' }}>
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3 text-purple-400" />
                    <span style={{ color: 'white !important' }}>{formatDate(experience.date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ClockIcon className="w-3 h-3 text-purple-400" />
                    <span style={{ color: 'white !important' }}>{experience.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="w-3 h-3 text-purple-400" />
                    <span style={{ color: 'white !important' }}>{experience.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <UserIcon className="w-3 h-3 text-purple-400" />
                    <span style={{ color: 'white !important' }}>{experience.spotsAvailable} spots left</span>
                  </div>
                </div>

                {/* Benefits */}
                {experience.benefits.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-white mb-1">Includes:</p>
                    <ul className="text-xs text-white space-y-0.5">
                      {experience.benefits.slice(0, 3).map((benefit, index) => (
                        <li key={index} className="flex items-center gap-1">
                          <CheckCircleIcon className="w-3 h-3 text-green-500 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Availability Status */}
                {hasAccess && (
                  <div className="mb-3">
                    {isFull ? (
                      <span className="text-xs text-red-600 font-medium">Fully Booked</span>
                    ) : isAlmostFull ? (
                      <span className="text-xs text-orange-600 font-medium">Almost Full - {experience.spotsAvailable} spots left</span>
                    ) : (
                      <span className="text-xs text-green-600 font-medium">Available</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {hasAccess ? (
                    <>
                      {!isFull ? (
                        <button 
                          onClick={() => handleBookExperience(experience.id)}
                          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                        >
                          {experience.price || 'Book Now'}
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleJoinWaitlist(experience.id)}
                          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-white/10 hover:bg-purple-200 rounded transition-colors"
                        >
                          Join Waitlist
                        </button>
                      )}
                      <button className="px-3 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded transition-colors">
                        Details
                      </button>
                    </>
                  ) : (
                    <button className="flex-1 px-3 py-2 text-sm font-medium text-purple-400 bg-slate-200 rounded cursor-not-allowed">
                      Upgrade Required
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-8 text-purple-400">
          <SparklesIcon className="w-12 h-12 mx-auto mb-3 text-purple-400" />
          <h3 className="text-sm font-medium text-white mb-1">No Experiences Found</h3>
          <p className="text-sm">Try selecting a different category.</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="space-y-3">
          <button className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-purple-200 rounded-xl transition-colors">
            My Bookings
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
            Experience History
          </button>
        </div>
      </div>
    </div>
  )
}
