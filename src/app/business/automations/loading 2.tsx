export default function AutomationsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-purple-100 rounded animate-pulse"></div>
              <div>
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-48 bg-gray-100 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="h-10 w-36 bg-blue-100 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <span className="text-gray-600">Loading automations...</span>
        </div>
      </div>
    </div>
  )
}
