/**
 * Vercel Domains API utilities for automatic domain registration
 * Handles domain addition, SSL provisioning, and verification
 */

export interface VercelDomain {
  name: string
  apexName: string
  projectId: string
  redirect?: string
  redirectStatusCode?: number
  gitBranch?: string
  updatedAt?: number
  createdAt?: number
  /** Domain verification status */
  verified: boolean
  /** SSL certificate status */
  verification?: Array<{
    type: string
    domain: string
    value: string
    reason: string
  }>
}

export interface VercelDomainResponse {
  name: string
  apexName: string
  projectId: string
  redirect?: string
  redirectStatusCode?: number
  gitBranch?: string
  updatedAt: number
  createdAt: number
  verified: boolean
  verification?: Array<{
    type: string
    domain: string
    value: string
    reason: string
  }>
}

class VercelAPI {
  private token: string | null = null
  private projectId: string | null = null
  private teamId: string | null = null
  private baseUrl = 'https://api.vercel.com'
  private deployHookUrl: string | null = null

  private initialize() {
    if (this.token && this.projectId) {
      return // Already initialized
    }

    this.token = process.env.VERCEL_TOKEN || ''
    this.projectId = process.env.VERCEL_PROJECT_ID || ''
    this.teamId = process.env.VERCEL_TEAM_ID || ''
    this.deployHookUrl = process.env.VERCEL_DEPLOY_HOOK_URL || ''
    
    // DEBUG: Log what we're actually reading
    console.log('🔍 VERCEL ENV DEBUG:', {
      token: this.token ? `${this.token.substring(0, 8)}...` : 'MISSING',
      projectId: this.projectId || 'MISSING',
      teamId: this.teamId || 'MISSING'
    })
    
    if (!this.token) {
      throw new Error('VERCEL_TOKEN is required')
    }
    if (!this.projectId) {
      throw new Error('VERCEL_PROJECT_ID is required')
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    this.initialize() // Ensure API credentials are loaded
    
    const url = `${this.baseUrl}${endpoint}`
    
    // Add team ID to query params if available (optional for personal accounts)
    const urlWithTeam = this.teamId && this.teamId.trim()
      ? `${url}${url.includes('?') ? '&' : '?'}teamId=${this.teamId}`
      : url
    
    const response = await fetch(urlWithTeam, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ Vercel API Error:', {
        status: response.status,
        statusText: response.statusText,
        data
      })
      throw new Error(`Vercel API error: ${response.status} - ${JSON.stringify(data)}`)
    }

    return data
  }

  /**
   * Add a domain to the Vercel project
   */
  async addDomain(domain: string): Promise<VercelDomainResponse> {
    console.log(`🌐 Adding domain to Vercel: ${domain}`)
    
    const response = await this.makeRequest(`/v9/projects/${this.projectId}/domains`, {
      method: 'POST',
      body: JSON.stringify({
        name: domain,
      }),
    })

    console.log(`✅ Domain added to Vercel successfully:`, response.name)
    return response
  }

  /**
   * Remove a domain from the Vercel project
   */
  async removeDomain(domain: string): Promise<void> {
    console.log(`🗑️ Removing domain from Vercel: ${domain}`)
    console.log(`🔍 Using projectId: ${this.projectId}`)
    console.log(`🔍 Using teamId: ${this.teamId}`)
    console.log(`🔍 Token exists: ${!!this.token}`)
    
    const endpoint = `/v9/projects/${this.projectId}/domains/${domain}`
    console.log(`🌐 DELETE endpoint: ${endpoint}`)
    
    await this.makeRequest(endpoint, {
      method: 'DELETE',
    })

    console.log(`✅ Domain removed from Vercel successfully`)
  }

  /**
   * Get domain information from Vercel
   */
  async getDomain(domain: string): Promise<VercelDomainResponse> {
    console.log(`🔍 Getting domain info from Vercel: ${domain}`)
    
    const response = await this.makeRequest(`/v9/projects/${this.projectId}/domains/${domain}`)
    return response
  }

  /**
   * List all domains for the project
   */
  async listDomains(): Promise<VercelDomainResponse[]> {
    console.log(`📋 Listing all domains for project: ${this.projectId}`)
    
    const response = await this.makeRequest(`/v9/projects/${this.projectId}/domains`)
    return response.domains || []
  }

  /**
   * Check if there is at least one production deployment for the project
   */
  async hasProductionDeployment(): Promise<boolean> {
    console.log(`🔎 Checking for production deployments for project: ${this.projectId}`)
    const response = await this.makeRequest(`/v13/deployments?projectId=${this.projectId}&target=production&limit=1`)
    const deployments = Array.isArray(response.deployments) ? response.deployments : []
    console.log(`📦 Found ${deployments.length} production deployment(s)`)
    return deployments.length > 0
  }

  /**
   * Trigger a production deployment using a Vercel Deploy Hook
   */
  async triggerDeployment(): Promise<{ triggered: boolean; message: string }> {
    this.initialize()
    if (!this.deployHookUrl) {
      const message = 'VERCEL_DEPLOY_HOOK_URL not configured; cannot auto-deploy.'
      console.warn(`⚠️ ${message}`)
      return { triggered: false, message }
    }

    console.log(`🚀 Triggering production deployment via deploy hook`)
    const res = await fetch(this.deployHookUrl, { method: 'POST' })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      const message = `Failed to trigger deployment: ${res.status} ${res.statusText} ${text}`
      console.error(`❌ ${message}`)
      return { triggered: false, message }
    }
    return { triggered: true, message: 'Deployment hook triggered' }
  }

  /**
   * Verify domain configuration
   */
  async verifyDomain(domain: string): Promise<VercelDomainResponse> {
    console.log(`🔍 Verifying domain configuration: ${domain}`)
    
    const response = await this.makeRequest(`/v9/projects/${this.projectId}/domains/${domain}/verify`, {
      method: 'POST',
    })

    console.log(`✅ Domain verification completed:`, {
      domain: response.name,
      verified: response.verified
    })
    
    return response
  }

  /**
   * Get domain verification requirements
   */
  async getDomainConfig(domain: string): Promise<{
    configuredBy?: string
    acceptedChallenges?: string[]
    misconfigured: boolean
  }> {
    console.log(`⚙️ Getting domain configuration: ${domain}`)
    
    const response = await this.makeRequest(`/v6/domains/${domain}/config`)
    return response
  }

  /**
   * Add domain with automatic verification
   */
  async addAndVerifyDomain(domain: string): Promise<{
    domain: VercelDomainResponse
    verified: boolean
    verificationInstructions?: Array<{
      type: string
      domain: string
      value: string
      reason: string
    }>
  }> {
    console.log(`🚀 Adding and verifying domain: ${domain}`)

    try {
      // Step 1: Add domain to project
      const domainResponse = await this.addDomain(domain)
      
      // Step 2: Check if verification is needed
      if (!domainResponse.verified && domainResponse.verification) {
        console.log(`⏳ Domain requires verification:`, domainResponse.verification)
        
        return {
          domain: domainResponse,
          verified: false,
          verificationInstructions: domainResponse.verification
        }
      }

      // Step 3: If already verified or no verification needed
      console.log(`✅ Domain added and verified successfully: ${domain}`)
      
      return {
        domain: domainResponse,
        verified: true
      }

    } catch (error) {
      console.error(`❌ Failed to add domain ${domain}:`, error)
      throw error
    }
  }
}

// Export singleton instance
export const vercel = new VercelAPI()
