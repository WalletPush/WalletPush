import React from 'react'
import { 
  CalendarDaysIcon, 
  ClockIcon,
  UserIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface BookingSlot {
  id: string
  service: string
  instructor: string
  date: string
  time: string
  duration: string
  location: string
  spotsAvailable: number
  totalSpots: number
  memberPriority?: 'standard' | 'priority' | 'vip'
  price?: string
  category: 'fitness' | 'spa' | 'dining' | 'consultation' | 'class'
}

interface UpcomingBooking {
  id: string
  service: string
  date: string
  time: string
  location: string
  instructor: string
  status: 'confirmed' | 'pending' | 'cancelled'
  cancellationDeadline: string
}

interface MembershipBookingSystemProps {
  availableSlots?: BookingSlot[]
  upcomingBookings?: UpcomingBooking[]
  memberPriority?: string
  cancellationPolicy?: string
  bookingWindow?: string
}

export function MembershipBookingSystem({ 
  availableSlots = [
    {
      id: '1',
      service: 'Personal Training',
      instructor: 'Sarah Johnson',
      date: '2024-12-20',
      time: '9:00 AM',
      duration: '1 hour',
      location: 'Gym Floor 2',
      spotsAvailable: 1,
      totalSpots: 1,
      memberPriority: 'priority',
      category: 'fitness'
    },
    {
      id: '2',
      service: 'Yoga Class',
      instructor: 'Maria Garcia',
      date: '2024-12-20',
      time: '6:00 PM',
      duration: '90 min',
      location: 'Studio A',
      spotsAvailable: 3,
      totalSpots: 15,
      memberPriority: 'standard',
      category: 'fitness'
    },
    {
      id: '3',
      service: 'Massage Therapy',
      instructor: 'David Kim',
      date: '2024-12-21',
      time: '2:00 PM',
      duration: '60 min',
      location: 'Spa Level 3',
      spotsAvailable: 1,
      totalSpots: 1,
      memberPriority: 'vip',
      price: 'Included',
      category: 'spa'
    },
    {
      id: '4',
      service: 'Nutrition Consultation',
      instructor: 'Dr. Emily Chen',
      date: '2024-12-22',
      time: '11:00 AM',
      duration: '45 min',
      location: 'Wellness Center',
      spotsAvailable: 1,
      totalSpots: 1,
      memberPriority: 'priority',
      category: 'consultation'
    }
  ],
  upcomingBookings = [
    {
      id: '1',
      service: 'Pilates Class',
      date: '2024-12-18',
      time: '7:00 AM',
      location: 'Studio B',
      instructor: 'Lisa Park',
      status: 'confirmed',
      cancellationDeadline: '2024-12-17 7:00 PM'
    },
    {
      id: '2',
      service: 'Spa Facial',
      date: '2024-12-19',
      time: '3:00 PM',
      location: 'Spa Suite 2',
      instructor: 'Jennifer Wu',
      status: 'confirmed',
      cancellationDeadline: '2024-12-18 3:00 PM'
    }
  ],
  memberPriority = "Gold members get 24-hour advance booking",
  cancellationPolicy = "Cancel up to 24 hours before without penalty",
  bookingWindow = "Up to 30 days in advance"
}: MembershipBookingSystemProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'fitness': return '💪'
      case 'spa': return '🧖‍♀️'
      case 'dining': return '🍽️'
      case 'consultation': return '👩‍⚕️'
      case 'class': return '🧘‍♀️'
      default: return '📅'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'fitness': return 'bg-green-500/100/20 text-green-400 border-green-500/30'
      case 'spa': return 'bg-white/10 text-white border-white/20'
      case 'dining': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'consultation': return 'bg-white/10 text-white border-white/20'
      case 'class': return 'bg-pink-100 text-pink-700 border-pink-200'
      default: return 'bg-white/10 text-white border-white/10'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'vip': return 'bg-white/10 text-white'
      case 'priority': return 'bg-white/10 text-white'
      default: return 'bg-white/10 text-white'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600'
      case 'pending': return 'text-yellow-600'
      case 'cancelled': return 'text-red-600'
      default: return 'text-white'
    }
  }

  const handleBookSlot = (slotId: string) => {
    console.log('Booking slot:', slotId)
    // Booking logic would go here
  }

  const handleCancelBooking = (bookingId: string) => {
    console.log('Cancelling booking:', bookingId)
    // Cancellation logic would go here
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <CalendarDaysIcon className="w-5 h-5 text-purple-400" />
          Booking & Reservations
        </h2>
        <span className="text-sm text-purple-400 font-medium">
          {bookingWindow}
        </span>
      </div>

      {/* Member Priority Info */}
      <div className="bg-blue-500/10 border border-white/20 rounded-xl p-3 mb-6">
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-white">{memberPriority}</span>
        </div>
        <p className="text-sm text-white mt-1">{cancellationPolicy}</p>
      </div>

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-white mb-3">Your Upcoming Bookings</h3>
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="border border-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-white">{booking.service}</h4>
                      <span className={`text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-xs mb-2" style={{ color: 'white !important' }}>
                      <div className="flex items-center gap-1">
                        <CalendarDaysIcon className="w-3 h-3 text-purple-400" />
                        <span style={{ color: 'white !important' }}>{formatDate(booking.date)} at {booking.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="w-3 h-3 text-purple-400" />
                        <span style={{ color: 'white !important' }}>{booking.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UserIcon className="w-3 h-3 text-purple-400" />
                        <span style={{ color: 'white !important' }}>{booking.instructor}</span>
                      </div>
                    </div>

                    <p className="text-xs text-purple-400">
                      Cancel by: {formatDateTime(booking.cancellationDeadline)}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button 
                      onClick={() => handleCancelBooking(booking.id)}
                      className="px-3 py-1 text-xs font-medium text-red-400 bg-red-500/100/20 hover:bg-red-200 rounded transition-colors"
                    >
                      Cancel
                    </button>
                    <button className="px-3 py-1 text-xs font-medium text-white bg-white/10 hover:bg-blue-200 rounded transition-colors">
                      Reschedule
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Slots */}
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Available Slots</h3>
        <div className="space-y-3">
          {availableSlots.map((slot) => (
            <div key={slot.id} className="border border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-lg">{getCategoryIcon(slot.category)}</span>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-white">{slot.service}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded border ${getCategoryColor(slot.category)}`}>
                        {slot.category}
                      </span>
                      {slot.memberPriority !== 'standard' && (
                        <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(slot.memberPriority || 'standard')}`}>
                          {slot.memberPriority?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-xs mb-2" style={{ color: 'white !important' }}>
                      <div className="flex items-center gap-1">
                        <CalendarDaysIcon className="w-3 h-3 text-purple-400" />
                        <span style={{ color: 'white !important' }}>{formatDate(slot.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3 text-purple-400" />
                        <span style={{ color: 'white !important' }}>{slot.time} ({slot.duration})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="w-3 h-3 text-purple-400" />
                        <span style={{ color: 'white !important' }}>{slot.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UserIcon className="w-3 h-3 text-purple-400" />
                        <span style={{ color: 'white !important' }}>{slot.instructor}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs text-white">
                        {slot.spotsAvailable} of {slot.totalSpots} spots available
                      </span>
                      {slot.price && (
                        <span className="text-xs font-medium text-green-400">
                          {slot.price}
                        </span>
                      )}
                      {slot.spotsAvailable <= 2 && slot.spotsAvailable > 0 && (
                        <span className="flex items-center gap-1 text-xs text-orange-600">
                          <ExclamationTriangleIcon className="w-3 h-3" />
                          Almost full
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleBookSlot(slot.id)}
                  disabled={slot.spotsAvailable === 0}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                    slot.spotsAvailable === 0
                      ? 'text-slate-400 bg-slate-200 cursor-not-allowed'
                      : 'text-white bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {slot.spotsAvailable === 0 ? 'Full' : 'Book Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="space-y-3">
          <button className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-blue-200 rounded-xl transition-colors">
            View Calendar
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-slate-200 rounded-xl transition-colors">
            Booking History
          </button>
        </div>
      </div>
    </div>
  )
}
