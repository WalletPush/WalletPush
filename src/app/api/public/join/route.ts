import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get the form data
    const formData = await request.formData()
    
    // Convert FormData to JSON object
    const data: any = {}
    for (const [key, value] of formData.entries()) {
      data[key] = value
    }
    
    console.log('🔄 Public join request, redirecting to customer-signup:', data)
    console.log('🔄 Original form data keys:', Object.keys(data))
    
    // Clean up and map the data before forwarding
    const cleanData: any = {}
    
    // Map form field names to API field names
    if (data.firstName) cleanData.first_name = data.firstName
    if (data.lastName) cleanData.last_name = data.lastName
    if (data.email) cleanData.email = data.email
    if (data.phone) cleanData.phone = data.phone
    if (data.dateOfBirth) cleanData.date_of_birth = data.dateOfBirth
    if (data.address) cleanData.address = data.address
    if (data.city) cleanData.city = data.city
    if (data.state) cleanData.state = data.state
    if (data.zipCode) cleanData.zip_code = data.zipCode
    if (data.company) cleanData.company = data.company
    
    // Handle template placeholders that weren't replaced
    if (data.tenant_id && data.tenant_id !== '{{TENANT_ID}}') {
      cleanData.tenant_id = data.tenant_id
    }
    if (data.program_id && data.program_id !== '{{PROGRAM_ID}}') {
      cleanData.program_id = data.program_id
    }
    
    // Handle landing page ID
    if (data.landing_page_id && data.landing_page_id !== 'LANDING_PAGE_ID_PLACEHOLDER') {
      cleanData.landing_page_id = data.landing_page_id
    }
    
    // For demo purposes, use a hardcoded template if no landing page ID
    if (!cleanData.landing_page_id && !cleanData.template_id) {
      cleanData.template_id = 'ae76dc2a-e295-4219-b5ce-f6ecd8961de1' // Blue Karma Membership template
    }
    
    console.log('🧹 Mapped and cleaned data:', cleanData)
    
    // Forward to our existing customer-signup API
    const baseUrl = request.nextUrl.origin
    const response = await fetch(`${baseUrl}/api/customer-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanData)
    })
    
    console.log('📡 Customer signup response status:', response.status)
    
    let result
    
    // Check if response is JSON by content type
    const contentType = response.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      try {
        result = await response.json()
      } catch (parseError) {
        console.error('❌ Failed to parse JSON despite content-type:', parseError)
        result = { 
          success: false, 
          error: 'Invalid JSON response from server' 
        }
      }
    } else {
      // Response is not JSON (probably HTML error page)
      const textResponse = await response.text()
      console.error('❌ Customer signup returned non-JSON response:', {
        status: response.status,
        contentType,
        firstChars: textResponse.substring(0, 200)
      })
      
      // Extract error message from HTML if possible
      let errorMessage = 'Server error occurred'
      if (textResponse.includes('error') || textResponse.includes('Error')) {
        // Try to extract a meaningful error message
        const errorMatch = textResponse.match(/<h1[^>]*>([^<]+)<\/h1>|<title[^>]*>([^<]+)<\/title>/i)
        if (errorMatch) {
          errorMessage = errorMatch[1] || errorMatch[2] || errorMessage
        }
      }
      
      result = { 
        success: false, 
        error: errorMessage
      }
    }
    
    if (result.success) {
      // Return success HTML page
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Welcome!</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f0f9ff; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            h1 { color: #10b981; margin-bottom: 20px; }
            p { color: #6b7280; line-height: 1.6; }
            .pass-link { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎉 Welcome to the Program!</h1>
            <p>Your pass has been created successfully and sent to your email.</p>
            ${result.passUrl ? `<a href="${result.passUrl}" class="pass-link">Add to Apple Wallet</a>` : ''}
            <p><small>You can also check your email for the pass link.</small></p>
          </div>
        </body>
        </html>
      `, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      })
    } else {
      // Return error HTML page
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Oops!</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #fef2f2; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            h1 { color: #ef4444; margin-bottom: 20px; }
            p { color: #6b7280; line-height: 1.6; }
            .retry-link { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #6b7280; color: white; text-decoration: none; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⚠️ Something went wrong</h1>
            <p>We couldn't process your request: ${result.error || 'Unknown error'}</p>
            <a href="javascript:history.back()" class="retry-link">Go Back & Try Again</a>
          </div>
        </body>
        </html>
      `, {
        status: 400,
        headers: {
          'Content-Type': 'text/html',
        },
      })
    }
    
  } catch (error) {
    console.error('Error in public join endpoint:', error)
    
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #fef2f2; }
          .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          h1 { color: #ef4444; margin-bottom: 20px; }
          p { color: #6b7280; line-height: 1.6; }
          .retry-link { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #6b7280; color: white; text-decoration: none; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⚠️ Server Error</h1>
          <p>We're experiencing technical difficulties. Please try again later.</p>
          <a href="javascript:history.back()" class="retry-link">Go Back</a>
        </div>
      </body>
      </html>
    `, {
      status: 500,
      headers: {
        'Content-Type': 'text/html',
      },
    })
  }
}
