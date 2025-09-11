import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AgencyDashboard() {
  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="p-6">
          <div className="flex items-center justify-center mb-8">
            <img 
              src="/images/walletpush-logo.png" 
              alt="WalletPush" 
              className="h-10 w-auto"
            />
          </div>

          <nav className="space-y-2">
            <a href="#" className="sidebar-item active">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0a2 2 0 01-2 2H10a2 2 0 01-2-2v0z" />
              </svg>
              <span>Dashboard</span>
            </a>
            
            <a href="#" className="sidebar-item">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Sub-Accounts</span>
            </a>

            <a href="#" className="sidebar-item">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Contacts</span>
            </a>

            <a href="#" className="sidebar-item">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Opportunities</span>
            </a>

            <a href="#" className="sidebar-item">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span>Payments</span>
            </a>

            <div className="pt-6 mt-6 border-t border-slate-700">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                WalletPush
              </h3>
              
              <a href="#" className="sidebar-item">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>WalletPush</span>
              </a>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-700">
              <a href="#" className="sidebar-item">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Settings</span>
              </a>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Agency Dashboard</h1>
              <p className="text-slate-600">Overview of your business performance</p>
            </div>
            <div className="flex items-center gap-4">
              <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option>2025-08-12 - 2025-09-11</option>
              </select>
              <button className="p-2 text-slate-600 hover:text-slate-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {/* Revenue & Customers Overview */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Revenue & Customers Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Revenue Last Month</CardTitle>
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$8,450</div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <span className="mr-1">↗</span>
                    +12% vs last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Monthly Recurring Revenue</CardTitle>
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$2,970</div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <span className="mr-1">↗</span>
                    +8% vs last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">New Customers</CardTitle>
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">127</div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <span className="mr-1">↗</span>
                    +15% vs last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Customers</CardTitle>
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">2,847</div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <span className="mr-1">↗</span>
                    +5% vs last month
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Growth Rate</CardTitle>
                <CardDescription>Customer acquisition and revenue trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
                  <p className="text-slate-500">Chart Component Here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
                <CardDescription>Breakdown by subscription type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
                  <p className="text-slate-500">Pie Chart Component Here</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Sub-Account Activity</CardTitle>
              <CardDescription>Latest updates from your managed accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { business: 'Coffee Shop Pro', action: 'Created new loyalty program', time: '2 hours ago' },
                  { business: 'Fitness First', action: 'Issued 45 new membership passes', time: '4 hours ago' },
                  { business: 'Restaurant Deluxe', action: 'Updated store card design', time: '6 hours ago' },
                  { business: 'Spa Wellness', action: 'Added new offer campaign', time: '1 day ago' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-medium text-sm">
                          {activity.business.split(' ').map(word => word[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{activity.business}</p>
                        <p className="text-sm text-slate-600">{activity.action}</p>
                      </div>
                    </div>
                    <span className="text-sm text-slate-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
