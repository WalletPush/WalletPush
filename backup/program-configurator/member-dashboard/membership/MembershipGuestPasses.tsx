import React from 'react'
import { 
  UserPlusIcon, 
  QrCodeIcon,
  ShareIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

interface GuestPass {
  id: string
  guestName: string
  guestEmail?: string
  generatedDate: string
  expiryDate: string
  used: boolean
  usedDate?: string
  qrCode: string
  accessLevel: 'basic' | 'full' | 'premium'
  restrictions?: string[]
}

interface MembershipGuestPassesProps {
  allowedGuests?: number
  usedThisMonth?: number
  guestHistory?: GuestPass[]
  passValidDays?: number
  accessLevels?: {
    basic: string[]
    full: string[]
    premium: string[]
  }
  resetDate?: string
}

export function MembershipGuestPasses({ 
  allowedGuests = 3,
  usedThisMonth = 1,
  guestHistory = [
    {
      id: '1',
      guestName: 'Sarah Johnson',
      guestEmail: 'sarah@email.com',
      generatedDate: '2024-12-10',
      expiryDate: '2024-12-17',
      used: true,
      usedDate: '2024-12-12',
      qrCode: 'GUEST-12345-ABCDE',
      accessLevel: 'full',
      restrictions: ['No spa access after 8 PM']
    },
    {
      id: '2',
      guestName: 'Mike Chen',
      guestEmail: 'mike@email.com',
      generatedDate: '2024-12-15',
      expiryDate: '2024-12-22',
      used: false,
      qrCode: 'GUEST-67890-FGHIJ',
      accessLevel: 'basic',
      restrictions: ['Fitness area only', 'Peak hours excluded']
    }
  ],
  passValidDays = 7,
  accessLevels = {
    basic: ['Fitness area', 'Locker rooms', 'Water stations'],
    full: ['All fitness areas', 'Pool', 'Locker rooms', 'Cafe'],
    premium: ['Full facility access', 'Spa', 'Premium classes', 'Concierge services']
  },
  resetDate = "Jan 1, 2025"
}: MembershipGuestPassesProps) {
  const [newGuestName, setNewGuestName] = React.useState('')
  const [newGuestEmail, setNewGuestEmail] = React.useState('')
  const [selectedAccessLevel, setSelectedAccessLevel] = React.useState<'basic' | 'full' | 'premium'>('full')
  const [showGenerateForm, setShowGenerateForm] = React.useState(false)

  const remainingPasses = allowedGuests - usedThisMonth
  const canGeneratePass = remainingPasses > 0

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'basic': return 'bg-white/10 text-white border-white/10'
      case 'full': return 'bg-white/10 text-white border-white/20'
      case 'premium': return 'bg-white/10 text-white border-white/20'
      default: return 'bg-white/10 text-white border-white/10'
    }
  }

  const handleGeneratePass = () => {
    if (!newGuestName.trim()) return
    
    console.log('Generating guest pass for:', {
      name: newGuestName,
      email: newGuestEmail,
      accessLevel: selectedAccessLevel
    })
    
    // Reset form
    setNewGuestName('')
    setNewGuestEmail('')
    setShowGenerateForm(false)
    
    // Pass generation logic would go here
  }

  const handleSharePass = (passId: string) => {
    console.log('Sharing guest pass:', passId)
    // Share logic (email, SMS, etc.)
  }

  const handleRevokePass = (passId: string) => {
    console.log('Revoking guest pass:', passId)
    // Revoke logic
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date()
  }

  const daysUntilExpiry = (expiryDate: string) => {
    const diff = new Date(expiryDate).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <UserPlusIcon className="w-5 h-5 text-white" />
          Guest Passes
        </h2>
        <span className="text-sm text-white">
          {remainingPasses} of {allowedGuests} remaining
        </span>
      </div>

      {/* Usage Summary */}
      <div className="bg-white/5 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-white">Monthly Usage</h3>
          <span className="text-sm font-bold text-white">
            {usedThisMonth} / {allowedGuests}
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(usedThisMonth / allowedGuests) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-white">
          <span>Resets {resetDate}</span>
          <span>{remainingPasses} passes available</span>
        </div>
      </div>

      {/* Generate New Pass */}
      <div className="mb-6">
        {!showGenerateForm ? (
          <div className="text-center">
            <button 
              onClick={() => setShowGenerateForm(true)}
              disabled={!canGeneratePass}
              className={`px-6 py-3 text-sm font-medium rounded-xl transition-colors ${
                canGeneratePass
                  ? 'text-white bg-blue-600 hover:bg-blue-700'
                  : 'text-slate-400 bg-slate-200 cursor-not-allowed'
              }`}
            >
              {canGeneratePass ? 'Generate Guest Pass' : 'Monthly Limit Reached'}
            </button>
            {!canGeneratePass && (
              <p className="text-xs text-purple-400 mt-2">
                Resets {resetDate}
              </p>
            )}
          </div>
        ) : (
          <div className="border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-medium text-white mb-4">Generate New Guest Pass</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Guest Name *
                </label>
                <input
                  type="text"
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  placeholder="Enter guest's full name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Guest Email (Optional)
                </label>
                <input
                  type="email"
                  value={newGuestEmail}
                  onChange={(e) => setNewGuestEmail(e.target.value)}
                  placeholder="guest@email.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Access Level
                </label>
                <div className="space-y-2">
                  {Object.entries(accessLevels).map(([level, permissions]) => (
                    <label key={level} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="accessLevel"
                        value={level}
                        checked={selectedAccessLevel === level}
                        onChange={(e) => setSelectedAccessLevel(e.target.value as any)}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white capitalize">{level}</span>
                          <span className={`text-xs px-2 py-0.5 rounded border ${getAccessLevelColor(level)}`}>
                            {level.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-white mt-1">
                          {permissions.join(', ')}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-blue-500/10 border border-white/20 rounded p-3 text-xs text-white">
                Pass valid for {passValidDays} days from generation
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleGeneratePass}
                  disabled={!newGuestName.trim()}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-colors"
                >
                  Generate Pass
                </button>
                <button 
                  onClick={() => setShowGenerateForm(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Guest Pass History */}
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Recent Guest Passes</h3>
        {guestHistory.length === 0 ? (
          <div className="text-center py-8 text-purple-400">
            <UserPlusIcon className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <h3 className="text-sm font-medium text-white mb-1">No Guest Passes Yet</h3>
            <p className="text-sm">Generate your first guest pass to bring friends!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {guestHistory.map((pass) => {
              const expired = isExpired(pass.expiryDate)
              const daysLeft = daysUntilExpiry(pass.expiryDate)
              
              return (
                <div key={pass.id} className="border border-white/10 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-white">{pass.guestName}</h4>
                        {pass.used ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        ) : expired ? (
                          <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                        ) : (
                          <ClockIcon className="w-4 h-4 text-blue-500" />
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded border ${getAccessLevelColor(pass.accessLevel)}`}>
                          {pass.accessLevel.toUpperCase()}
                        </span>
                      </div>
                      
                      {pass.guestEmail && (
                        <p className="text-xs text-white mb-1">{pass.guestEmail}</p>
                      )}
                      
                      <div className="space-y-2 text-xs text-white mb-2">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          <span>Generated {formatDate(pass.generatedDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          <span>Expires {formatDate(pass.expiryDate)}</span>
                        </div>
                      </div>

                      {pass.used && pass.usedDate && (
                        <p className="text-xs text-green-600">
                          Used on {formatDate(pass.usedDate)}
                        </p>
                      )}
                      
                      {!pass.used && !expired && daysLeft <= 2 && (
                        <p className="text-xs text-orange-600">
                          Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                        </p>
                      )}
                      
                      {expired && !pass.used && (
                        <p className="text-xs text-red-600">Expired</p>
                      )}

                      {pass.restrictions && pass.restrictions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-purple-400">Restrictions:</p>
                          <ul className="text-xs text-white ml-2">
                            {pass.restrictions.map((restriction, index) => (
                              <li key={index}>• {restriction}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {!pass.used && !expired && (
                        <>
                          <button 
                            onClick={() => handleSharePass(pass.id)}
                            className="px-3 py-1 text-xs font-medium text-white bg-white/10 hover:bg-blue-200 rounded transition-colors flex items-center gap-1"
                          >
                            <ShareIcon className="w-3 h-3" />
                            Share
                          </button>
                          <button 
                            onClick={() => handleRevokePass(pass.id)}
                            className="px-3 py-1 text-xs font-medium text-red-400 bg-red-500/100/20 hover:bg-red-200 rounded transition-colors"
                          >
                            Revoke
                          </button>
                        </>
                      )}
                      
                      <button className="px-3 py-1 text-xs font-medium text-white bg-white/10 hover:bg-slate-200 rounded transition-colors flex items-center gap-1">
                        <QrCodeIcon className="w-3 h-3" />
                        QR
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="space-y-3">
          <button className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-blue-200 rounded-xl transition-colors">
            Guest Guidelines
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-slate-200 rounded-xl transition-colors">
            Pass History
          </button>
        </div>
      </div>
    </div>
  )
}
