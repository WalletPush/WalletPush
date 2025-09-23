import React from 'react'
import { 
  UserGroupIcon, 
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  UserPlusIcon,
  BuildingOfficeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import { CheckBadgeIcon } from '@heroicons/react/24/solid'

interface MemberProfile {
  id: string
  name: string
  title: string
  company: string
  industry: string
  location: string
  avatar: string
  isVerified: boolean
  memberSince: string
  interests: string[]
  mutualConnections: number
  isConnected: boolean
  bio?: string
}

interface MembershipNetworkingDirectoryProps {
  memberProfiles?: MemberProfile[]
  industryFilters?: string[]
  connectionRequests?: number
  privateMessaging?: boolean
  memberTier?: 'silver' | 'gold' | 'platinum'
}

export function MembershipNetworkingDirectory({ 
  memberProfiles = [
    {
      id: '1',
      name: 'Sarah Chen',
      title: 'VP of Engineering',
      company: 'TechCorp Inc.',
      industry: 'Technology',
      location: 'San Francisco, CA',
      avatar: '/images/profilepic.png',
      isVerified: true,
      memberSince: '2023-01-15',
      interests: ['AI/ML', 'Leadership', 'Startups'],
      mutualConnections: 5,
      isConnected: false,
      bio: 'Passionate about building scalable systems and leading high-performing teams.'
    },
    {
      id: '2',
      name: 'Michael Rodriguez',
      title: 'Managing Director',
      company: 'Goldman Sachs',
      industry: 'Finance',
      location: 'New York, NY',
      avatar: '/images/profilepic.png',
      isVerified: true,
      memberSince: '2022-08-20',
      interests: ['Investment Banking', 'Real Estate', 'Golf'],
      mutualConnections: 12,
      isConnected: true,
      bio: 'Investment professional with 15+ years in financial markets.'
    },
    {
      id: '3',
      name: 'Dr. Emily Park',
      title: 'Chief Medical Officer',
      company: 'HealthTech Solutions',
      industry: 'Healthcare',
      location: 'Boston, MA',
      avatar: '/images/profilepic.png',
      isVerified: true,
      memberSince: '2023-03-10',
      interests: ['Digital Health', 'Medical Innovation', 'Tennis'],
      mutualConnections: 3,
      isConnected: false,
      bio: 'Transforming healthcare through technology and innovation.'
    }
  ],
  industryFilters = ['Technology', 'Finance', 'Healthcare', 'Legal', 'Consulting', 'Real Estate'],
  connectionRequests = 2,
  privateMessaging = true,
  memberTier = 'gold'
}: MembershipNetworkingDirectoryProps) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedIndustry, setSelectedIndustry] = React.useState('all')
  const [showConnectedOnly, setShowConnectedOnly] = React.useState(false)

  const handleConnect = (memberId: string) => {
    console.log('Sending connection request to:', memberId)
    // Connection logic
  }

  const handleMessage = (memberId: string) => {
    console.log('Starting conversation with:', memberId)
    // Messaging logic
  }

  const handleViewProfile = (memberId: string) => {
    console.log('Viewing profile:', memberId)
    // Profile view logic
  }

  const filteredMembers = memberProfiles.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesIndustry = selectedIndustry === 'all' || member.industry === selectedIndustry
    const matchesConnection = !showConnectedOnly || member.isConnected
    
    return matchesSearch && matchesIndustry && matchesConnection
  })

  const canAccessNetworking = memberTier === 'gold' || memberTier === 'platinum'
  const canMessage = privateMessaging && (memberTier === 'gold' || memberTier === 'platinum')

  if (!canAccessNetworking) {
    return (
      <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-4">
        <div className="text-center py-8">
          <UserGroupIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Member Directory</h3>
          <p className="text-sm text-white mb-4">
            Connect with fellow members in our exclusive networking directory.
          </p>
          <p className="text-sm text-orange-600 mb-4">
            Available for Gold and Platinum members only.
          </p>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">
            Upgrade Membership
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <UserGroupIcon className="w-5 h-5 text-white" />
          Member Directory
        </h2>
        {connectionRequests > 0 && (
          <span className="px-2 py-1 bg-blue-500/100 text-white text-xs font-medium rounded-full">
            {connectionRequests} requests
          </span>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search members by name, company, or title..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Industries</option>
            {industryFilters.map((industry) => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showConnectedOnly}
              onChange={(e) => setShowConnectedOnly(e.target.checked)}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-white">My Connections Only</span>
          </label>
        </div>
      </div>

      {/* Members Grid */}
      <div className="space-y-4">
        {filteredMembers.map((member) => (
          <div key={member.id} className="border border-white/10 rounded-xl p-4">
            <div className="flex items-start gap-4">
              <div className="relative">
                <img 
                  src={member.avatar} 
                  alt={member.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {member.isVerified && (
                  <CheckBadgeIcon className="absolute -bottom-1 -right-1 w-4 h-4 text-blue-500" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-medium text-white">{member.name}</h3>
                  {member.isConnected && (
                    <span className="px-2 py-0.5 bg-green-500/100/20 text-green-400 text-xs rounded">
                      Connected
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-white mb-1">{member.title}</p>
                
                <div className="flex items-center gap-4 text-xs text-white mb-2">
                  <div className="flex items-center gap-1">
                    <BuildingOfficeIcon className="w-3 h-3" />
                    <span>{member.company}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="w-3 h-3" />
                    <span>{member.location}</span>
                  </div>
                </div>

                {member.bio && (
                  <p className="text-xs text-white mb-2 line-clamp-2">{member.bio}</p>
                )}

                <div className="flex flex-wrap gap-1 mb-3">
                  {member.interests.slice(0, 3).map((interest, index) => (
                    <span key={index} className="px-2 py-0.5 bg-white/10 text-white text-xs rounded">
                      {interest}
                    </span>
                  ))}
                </div>

                {member.mutualConnections > 0 && (
                  <p className="text-xs text-purple-400 mb-3">
                    {member.mutualConnections} mutual connection{member.mutualConnections > 1 ? 's' : ''}
                  </p>
                )}

                <div className="flex gap-2">
                  {!member.isConnected ? (
                    <button 
                      onClick={() => handleConnect(member.id)}
                      className="flex-1 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center justify-center gap-1"
                    >
                      <UserPlusIcon className="w-3 h-3" />
                      Connect
                    </button>
                  ) : canMessage ? (
                    <button 
                      onClick={() => handleMessage(member.id)}
                      className="flex-1 px-3 py-1 text-xs font-medium text-white bg-white/10 hover:bg-blue-200 rounded transition-colors flex items-center justify-center gap-1"
                    >
                      <ChatBubbleLeftRightIcon className="w-3 h-3" />
                      Message
                    </button>
                  ) : null}
                  
                  <button 
                    onClick={() => handleViewProfile(member.id)}
                    className="px-3 py-1 text-xs font-medium text-white bg-white/10 hover:bg-slate-200 rounded transition-colors"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-8 text-purple-400">
          <UserGroupIcon className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <h3 className="text-sm font-medium text-white mb-1">No Members Found</h3>
          <p className="text-sm">Try adjusting your search criteria.</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="space-y-3">
          <button className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-blue-200 rounded-xl transition-colors">
            Connection Requests
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-slate-200 rounded-xl transition-colors">
            My Connections
          </button>
        </div>
      </div>
    </div>
  )
}
