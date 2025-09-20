/**
 * Cloudflare API utilities for custom domain management
 * Handles DNS records, proxy settings, and SSL certificates
 */

export interface CloudflareRecord {
  id?: string
  type: 'CNAME' | 'A' | 'AAAA' | 'TXT'
  name: string
  content: string
  ttl?: number
  proxied?: boolean
}

export interface CloudflareDNSResponse {
  success: boolean
  errors: any[]
  messages: any[]
  result?: CloudflareRecord
}

export interface CloudflareZoneSettings {
  id: string
  value: 'flexible' | 'full' | 'strict' | 'off'
}

class CloudflareAPI {
  private apiToken: string | null = null
  private zoneId: string | null = null
  private baseUrl = 'https://api.cloudflare.com/client/v4'

  private initialize() {
    if (this.apiToken && this.zoneId) {
      return // Already initialized
    }

    this.apiToken = process.env.CLOUDFLARE_API_TOKEN || ''
    this.zoneId = process.env.CLOUDFLARE_ZONE_ID || ''
    
    if (!this.apiToken) {
      throw new Error('CLOUDFLARE_API_TOKEN is required')
    }
    if (!this.zoneId) {
      throw new Error('CLOUDFLARE_ZONE_ID is required')
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    this.initialize() // Ensure API credentials are loaded
    
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ Cloudflare API Error:', {
        status: response.status,
        statusText: response.statusText,
        data
      })
      throw new Error(`Cloudflare API error: ${response.status} - ${JSON.stringify(data)}`)
    }

    return data
  }

  /**
   * Create a DNS record for a custom domain
   */
  async createDNSRecord(record: CloudflareRecord): Promise<CloudflareDNSResponse> {
    console.log(`🌐 Creating DNS record: ${record.name} → ${record.content}`)
    
    const response = await this.makeRequest(`/zones/${this.zoneId}/dns_records`, {
      method: 'POST',
      body: JSON.stringify({
        type: record.type,
        name: record.name,
        content: record.content,
        ttl: record.ttl || 1, // 1 = Auto
        proxied: record.proxied || true, // Enable Cloudflare proxy by default
      }),
    })

    console.log(`✅ DNS record created successfully:`, response.result?.id)
    return response
  }

  /**
   * Update an existing DNS record
   */
  async updateDNSRecord(recordId: string, record: Partial<CloudflareRecord>): Promise<CloudflareDNSResponse> {
    console.log(`🔄 Updating DNS record: ${recordId}`)
    
    const response = await this.makeRequest(`/zones/${this.zoneId}/dns_records/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify(record),
    })

    console.log(`✅ DNS record updated successfully`)
    return response
  }

  /**
   * Delete a DNS record
   */
  async deleteDNSRecord(recordId: string): Promise<void> {
    console.log(`🗑️ Deleting DNS record: ${recordId}`)
    
    await this.makeRequest(`/zones/${this.zoneId}/dns_records/${recordId}`, {
      method: 'DELETE',
    })

    console.log(`✅ DNS record deleted successfully`)
  }

  /**
   * List DNS records for a domain
   */
  async listDNSRecords(name?: string, type?: string): Promise<CloudflareRecord[]> {
    this.initialize() // Ensure API credentials are loaded
    
    const params = new URLSearchParams()
    if (name) params.append('name', name)
    if (type) params.append('type', type)
    
    const response = await this.makeRequest(`/zones/${this.zoneId}/dns_records?${params}`)
    return response.result || []
  }

  /**
   * Check if a domain has correct DNS configuration
   */
  async verifyDNSConfiguration(domain: string, expectedTarget: string): Promise<boolean> {
    try {
      const records = await this.listDNSRecords(domain, 'CNAME')
      
      for (const record of records) {
        if (record.content === expectedTarget || record.content === `${expectedTarget}.`) {
          console.log(`✅ DNS verification successful: ${domain} → ${record.content}`)
          return true
        }
      }
      
      console.log(`❌ DNS verification failed: ${domain} not pointing to ${expectedTarget}`)
      return false
    } catch (error) {
      console.error(`❌ DNS verification error for ${domain}:`, error)
      return false
    }
  }

  /**
   * Set SSL/TLS encryption mode for the zone
   */
  async setSSLMode(mode: 'flexible' | 'full' | 'strict' = 'full'): Promise<void> {
    console.log(`🔒 Setting SSL mode to: ${mode}`)
    
    await this.makeRequest(`/zones/${this.zoneId}/settings/ssl`, {
      method: 'PATCH',
      body: JSON.stringify({ value: mode }),
    })

    console.log(`✅ SSL mode set to ${mode}`)
  }

  /**
   * Enable Universal SSL for the zone
   */
  async enableUniversalSSL(): Promise<void> {
    console.log(`🔒 Enabling Universal SSL`)
    
    await this.makeRequest(`/zones/${this.zoneId}/ssl/universal/settings`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled: true }),
    })

    console.log(`✅ Universal SSL enabled`)
  }

  /**
   * Add a custom domain with proper DNS and SSL configuration
   */
  async addCustomDomain(domain: string, target: string = 'walletpush.io'): Promise<{
    dnsRecord: CloudflareRecord
    verified: boolean
  }> {
    console.log(`🚀 Adding custom domain: ${domain} → ${target}`)

    // Create CNAME record pointing to our main domain
    const dnsResponse = await this.createDNSRecord({
      type: 'CNAME',
      name: domain,
      content: target,
      proxied: true, // Enable Cloudflare proxy for SSL and performance
    })

    // Verify the DNS configuration
    const verified = await this.verifyDNSConfiguration(domain, target)

    return {
      dnsRecord: dnsResponse.result!,
      verified,
    }
  }

  /**
   * Remove a custom domain
   */
  async removeCustomDomain(domain: string): Promise<void> {
    console.log(`🗑️ Removing custom domain: ${domain}`)

    const records = await this.listDNSRecords(domain)
    
    for (const record of records) {
      await this.deleteDNSRecord(record.id!)
    }

    console.log(`✅ Custom domain ${domain} removed successfully`)
  }
}

// Export singleton instance
export const cloudflare = new CloudflareAPI()
