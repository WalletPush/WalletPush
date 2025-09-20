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
  private token: string
  private projectId: string
  private teamId?: string
  private baseUrl = 'https://api.vercel.com'

  constructor() {
    this.token = process.env.VERCEL_TOKEN || ''
    this.projectId = process.env.VERCEL_PROJECT_ID || ''
    this.teamId = process.env.VERCEL_TEAM_ID || ''
    
    if (!this.token) {
      throw new Error('VERCEL_TOKEN is required')
    }
    if (!this.projectId) {
      throw new Error('VERCEL_PROJECT_ID is required')
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    // Add team ID to query params if available
    const urlWithTeam = this.teamId 
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
    
    await this.makeRequest(`/v9/projects/${this.projectId}/domains/${domain}`, {
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

// Export types
export type { VercelDomain, VercelDomainResponse }
