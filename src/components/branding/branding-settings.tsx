'use client'

import { useState } from 'react'
import { useBranding } from '@/lib/branding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Upload, Palette, Type, Eye } from 'lucide-react'

export function BrandingSettings() {
  const { branding, updateBranding, isLoading, error } = useBranding()
  const [formData, setFormData] = useState({
    company_name: branding.company_name || '',
    welcome_message: branding.welcome_message || '',
    tagline: branding.tagline || '',
    primary_color: branding.primary_color || '#3862EA',
    secondary_color: branding.secondary_color || '#2D4FD7',
    background_color: branding.background_color || '#ffffff',
    text_color: branding.text_color || '#1a1a1a'
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSaveSuccess(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      await updateBranding(formData)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save branding')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // TODO: Implement logo upload to storage
    console.log('Logo upload:', file)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Brand Settings</h2>
        <p className="text-muted-foreground">
          Customize how your login and signup pages appear to users
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {saveError && (
        <Alert variant="destructive">
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {saveSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            Branding settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Company Information
            </CardTitle>
            <CardDescription>
              Update your company name and messaging
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Your Company Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcome_message">Welcome Message</Label>
              <Input
                id="welcome_message"
                value={formData.welcome_message}
                onChange={(e) => handleInputChange('welcome_message', e.target.value)}
                placeholder="Welcome to Your Company"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline (Optional)</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => handleInputChange('tagline', e.target.value)}
                placeholder="Your company tagline"
              />
            </div>
          </CardContent>
        </Card>

        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Logo
            </CardTitle>
            <CardDescription>
              Upload your company logo for the login page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {branding.logo_url && (
                <div className="flex items-center justify-center p-4 border rounded-lg bg-gray-50">
                  <img
                    src={branding.logo_url}
                    alt="Current logo"
                    className="max-h-16 max-w-32 object-contain"
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="logo_upload">Upload New Logo</Label>
                <Input
                  id="logo_upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: PNG or SVG, max 2MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Scheme */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Color Scheme
            </CardTitle>
            <CardDescription>
              Customize your brand colors for the authentication pages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    className="w-16 h-10 p-1 rounded"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    placeholder="#3862EA"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary_color"
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                    className="w-16 h-10 p-1 rounded"
                  />
                  <Input
                    value={formData.secondary_color}
                    onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                    placeholder="#2D4FD7"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="background_color">Background</Label>
                <div className="flex gap-2">
                  <Input
                    id="background_color"
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => handleInputChange('background_color', e.target.value)}
                    className="w-16 h-10 p-1 rounded"
                  />
                  <Input
                    value={formData.background_color}
                    onChange={(e) => handleInputChange('background_color', e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text_color">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="text_color"
                    type="color"
                    value={formData.text_color}
                    onChange={(e) => handleInputChange('text_color', e.target.value)}
                    className="w-16 h-10 p-1 rounded"
                  />
                  <Input
                    value={formData.text_color}
                    onChange={(e) => handleInputChange('text_color', e.target.value)}
                    placeholder="#1a1a1a"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview
            </CardTitle>
            <CardDescription>
              See how your branding will look on the login page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="p-6 rounded-lg border-2 border-dashed"
              style={{
                background: `linear-gradient(135deg, ${formData.primary_color}15 0%, ${formData.secondary_color}10 100%)`,
                backgroundColor: formData.background_color
              }}
            >
              <div className="text-center space-y-3">
                {branding.logo_url && (
                  <div className="flex justify-center">
                    <img
                      src={branding.logo_url}
                      alt="Logo preview"
                      className="h-12 w-auto object-contain"
                    />
                  </div>
                )}
                <h3 
                  className="text-xl font-bold"
                  style={{ color: formData.primary_color }}
                >
                  {formData.welcome_message || 'Welcome Message'}
                </h3>
                {formData.tagline && (
                  <p 
                    className="text-sm opacity-70"
                    style={{ color: formData.text_color }}
                  >
                    {formData.tagline}
                  </p>
                )}
                <div 
                  className="inline-block px-4 py-2 rounded text-white text-sm font-medium"
                  style={{ backgroundColor: formData.primary_color }}
                >
                  Sign in Button
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="min-w-32"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  )
}
