'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  SparklesIcon,
  PhotoIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SwatchIcon,
  CreditCardIcon,
  TicketIcon,
  TagIcon,
  IdentificationIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

// Pass Designer Wizard Data Structure
interface WizardPassData {
  // Step 1: Basic Information
  templateName: string
  description: string
  style: string
  passTypeIdentifier: string
  
  // Step 2: Images
  logo: string | null
  pushNotificationIcon: string | null
  stripImage: string | null
  
  // Step 3: Front Content (Header & Secondary only)
  headerFields: Array<{id: string, label: string, value: string, placeholder: string}>
  secondaryFields: Array<{id: string, label: string, value: string, placeholder: string}>
  
  // Step 4: Colors
  backgroundColor: string
  foregroundColor: string
  labelColor: string
  
  // Step 5: Back Content
  backFields: Array<{id: string, label: string, value: string, placeholder: string}>
  
  // Additional data for final pass creation
  organizationName: string
}

const STEPS = [
  { id: 1, title: 'Basic Information', description: 'Name, style & pass type ID' },
  { id: 2, title: 'Upload Images', description: 'Logo, icon & strip image' },
  { id: 3, title: 'Front Content', description: 'Header & secondary fields' },
  { id: 4, title: 'Pass Colors', description: 'Background & text colors' },
  { id: 5, title: 'Back Content', description: 'Information on back of pass' },
  { id: 6, title: 'Finish Setup', description: 'Complete in pass designer' }
]

const PASS_STYLES = [
  { 
    value: 'storeCard', 
    label: 'Store Card', 
    description: 'Loyalty cards, membership cards',
    icon: CreditCardIcon,
    color: 'bg-blue-500'
  },
  { 
    value: 'coupon', 
    label: 'Coupon', 
    description: 'Discount coupons, offers',
    icon: TagIcon,
    color: 'bg-green-500'
  },
  { 
    value: 'eventTicket', 
    label: 'Event Ticket', 
    description: 'Concert, movie, sports tickets',
    icon: TicketIcon,
    color: 'bg-purple-500'
  },
  { 
    value: 'boardingPass', 
    label: 'Boarding Pass', 
    description: 'Flight, train, bus passes',
    icon: PaperAirplaneIcon,
    color: 'bg-orange-500'
  },
  { 
    value: 'generic', 
    label: 'Generic', 
    description: 'General purpose passes',
    icon: IdentificationIcon,
    color: 'bg-slate-500'
  }
]

const PLACEHOLDER_EXAMPLES = [
  '${customerName}',
  '${membershipNumber}',
  '${pointsBalance}',
  '${expiryDate}',
  '${tierLevel}',
  '${lastVisit}',
  '${totalSpent}',
  '${nextReward}'
]

export default function PassDesignerWizardPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [passTypeIds, setPassTypeIds] = useState<Array<{id: string, name: string}>>([])
  const [loadingPassTypeIds, setLoadingPassTypeIds] = useState(true)
  
  const [wizardData, setWizardData] = useState<WizardPassData>({
    // Step 1
    templateName: '',
    description: '',
    style: '',
    passTypeIdentifier: '',
    
    // Step 2
    logo: null,
    pushNotificationIcon: null,
    stripImage: null,
    
    // Step 3
    headerFields: [],
    secondaryFields: [],
    
    // Step 4
    backgroundColor: '#1a1a1a',
    foregroundColor: '#ffffff',
    labelColor: '#cccccc',
    
    // Step 5
    backFields: [],
    
    // Additional
    organizationName: 'WalletPush'
  })

  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null)
  const iconInputRef = useRef<HTMLInputElement>(null)
  const stripInputRef = useRef<HTMLInputElement>(null)

  // Load Pass Type IDs
  useEffect(() => {
    const loadPassTypeIds = async () => {
      try {
        const response = await fetch('/api/pass-type-ids')
        const result = await response.json()
        
        if (result.passTypeIds) {
          setPassTypeIds(result.passTypeIds.map((item: any) => ({
            id: item.pass_type_identifier || item.identifier,
            name: item.label || item.description || item.pass_type_identifier || item.identifier
          })))
        }
      } catch (error) {
        console.error('Error loading pass type IDs:', error)
      } finally {
        setLoadingPassTypeIds(false)
      }
    }

    loadPassTypeIds()
  }, [])

  const handleImageUpload = async (file: File, type: 'logo' | 'icon' | 'strip') => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) throw new Error('Upload failed')
      
      const result = await response.json()
      
      if (type === 'logo') {
        setWizardData(prev => ({ ...prev, logo: result.url }))
      } else if (type === 'icon') {
        setWizardData(prev => ({ ...prev, pushNotificationIcon: result.url }))
      } else if (type === 'strip') {
        setWizardData(prev => ({ ...prev, stripImage: result.url }))
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    }
  }

  const addField = (fieldType: 'headerFields' | 'secondaryFields' | 'backFields') => {
    const newField = {
      id: `${fieldType}_${Date.now()}`,
      label: '',
      value: '',
      placeholder: ''
    }
    
    setWizardData(prev => ({
      ...prev,
      [fieldType]: [...prev[fieldType], newField]
    }))
  }

  const updateField = (fieldType: 'headerFields' | 'secondaryFields' | 'backFields', index: number, key: string, value: string) => {
    setWizardData(prev => ({
      ...prev,
      [fieldType]: prev[fieldType].map((field, i) => 
        i === index ? { ...field, [key]: value } : field
      )
    }))
  }

  const removeField = (fieldType: 'headerFields' | 'secondaryFields' | 'backFields', index: number) => {
    setWizardData(prev => ({
      ...prev,
      [fieldType]: prev[fieldType].filter((_, i) => i !== index)
    }))
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return wizardData.templateName && wizardData.description && wizardData.style && wizardData.passTypeIdentifier
      case 2:
        return wizardData.logo && wizardData.stripImage
      case 3:
        return wizardData.headerFields.length > 0 || wizardData.secondaryFields.length > 0
      case 4:
        return wizardData.backgroundColor && wizardData.foregroundColor && wizardData.labelColor
      case 5:
        return true // Back fields are optional
      case 6:
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    if (currentStep < 6 && canProceedToNext()) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const finishWizard = () => {
    try {
      // Convert wizard data to pass designer format and redirect
      const passDesignerData = {
        templateName: wizardData.templateName,
        description: wizardData.description,
        style: wizardData.style,
        passTypeIdentifier: wizardData.passTypeIdentifier,
        organizationName: wizardData.organizationName,
        backgroundColor: wizardData.backgroundColor,
        foregroundColor: wizardData.foregroundColor,
        labelColor: wizardData.labelColor,
        fields: [
          ...wizardData.headerFields.map(f => ({ ...f, type: 'headerFields', key: f.placeholder || f.label.toLowerCase().replace(/\s+/g, '_') })),
          ...wizardData.secondaryFields.map(f => ({ ...f, type: 'secondaryFields', key: f.placeholder || f.label.toLowerCase().replace(/\s+/g, '_') })),
          ...wizardData.backFields.map(f => ({ ...f, type: 'backFields', key: f.placeholder || f.label.toLowerCase().replace(/\s+/g, '_') }))
        ],
        images: {
          logo: wizardData.logo ? { x1: wizardData.logo, x2: wizardData.logo, x3: wizardData.logo } : undefined,
          strip: wizardData.stripImage ? { x1: wizardData.stripImage, x2: wizardData.stripImage, x3: wizardData.stripImage } : undefined,
          icon: wizardData.pushNotificationIcon ? { x1: wizardData.pushNotificationIcon, x2: wizardData.pushNotificationIcon, x3: wizardData.pushNotificationIcon } : undefined
        },
        barcodes: [],
        locations: [],
        placeholders: []
      }

      // Store the data in both sessionStorage AND localStorage as backup
      const dataString = JSON.stringify(passDesignerData)
      sessionStorage.setItem('wizardPassData', dataString)
      localStorage.setItem('wizardPassData', dataString)
      
      // Redirect to pass designer
      window.location.href = '/business/pass-designer?fromWizard=true'
    } catch (error) {
      alert('Error finishing wizard: ' + error.message)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Let's Create Your Pass Template</h2>
              <p className="text-slate-600">Start by giving your pass a name, description, and choosing its style</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Blue Karma Loyalty Card"
                  value={wizardData.templateName}
                  onChange={(e) => setWizardData(prev => ({ ...prev, templateName: e.target.value }))}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Brief description of your pass template"
                  rows={3}
                  value={wizardData.description}
                  onChange={(e) => setWizardData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-4">
                Choose Pass Style <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PASS_STYLES.map((style) => {
                  const IconComponent = style.icon
                  return (
                    <div
                      key={style.value}
                      onClick={() => setWizardData(prev => ({ ...prev, style: style.value }))}
                      className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                        wizardData.style === style.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-12 h-12 ${style.color} rounded-lg flex items-center justify-center mb-3`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-1">{style.label}</h3>
                      <p className="text-sm text-slate-600">{style.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Pass Type ID <span className="text-red-500">*</span>
              </label>
              <select
                value={wizardData.passTypeIdentifier}
                onChange={(e) => setWizardData(prev => ({ ...prev, passTypeIdentifier: e.target.value }))}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a Pass Type ID</option>
                {loadingPassTypeIds ? (
                  <option disabled>Loading Pass Type IDs...</option>
                ) : (
                  passTypeIds.map(passType => (
                    <option key={passType.id} value={passType.id}>
                      {passType.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Upload Your Images</h2>
              <p className="text-slate-600">Add your logo, push notification icon, and strip image</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Logo */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Logo <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                  {wizardData.logo ? (
                    <div className="space-y-3">
                      <img src={wizardData.logo} alt="Logo preview" className="w-full h-32 object-contain rounded-lg" />
                      <button
                        onClick={() => setWizardData(prev => ({ ...prev, logo: null }))}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove Logo
                      </button>
                    </div>
                  ) : (
                    <div>
                      <PhotoIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600 mb-3">Upload your logo</p>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleImageUpload(e.target.files[0], 'logo')
                            e.target.value = ''
                          }
                        }}
                        className="hidden"
                      />
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Choose Logo
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Push Notification Icon */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Push Notification Icon
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                  {wizardData.pushNotificationIcon ? (
                    <div className="space-y-3">
                      <img src={wizardData.pushNotificationIcon} alt="Icon preview" className="w-full h-32 object-contain rounded-lg" />
                      <button
                        onClick={() => setWizardData(prev => ({ ...prev, pushNotificationIcon: null }))}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove Icon
                      </button>
                    </div>
                  ) : (
                    <div>
                      <PhotoIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600 mb-3">Upload notification icon</p>
                      <input
                        ref={iconInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleImageUpload(e.target.files[0], 'icon')
                            e.target.value = ''
                          }
                        }}
                        className="hidden"
                      />
                      <button
                        onClick={() => iconInputRef.current?.click()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Choose Icon
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Strip Image */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Strip Image <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                  {wizardData.stripImage ? (
                    <div className="space-y-3">
                      <img src={wizardData.stripImage} alt="Strip preview" className="w-full h-32 object-cover rounded-lg" />
                      <button
                        onClick={() => setWizardData(prev => ({ ...prev, stripImage: null }))}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove Strip
                      </button>
                    </div>
                  ) : (
                    <div>
                      <PhotoIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600 mb-3">Upload strip image</p>
                      <input
                        ref={stripInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleImageUpload(e.target.files[0], 'strip')
                            e.target.value = ''
                          }
                        }}
                        className="hidden"
                      />
                      <button
                        onClick={() => stripInputRef.current?.click()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Choose Strip
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Image Guidelines:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Logo:</strong> Square format, minimum 160x160px</li>
                <li>• <strong>Push Icon:</strong> Square format, minimum 58x58px</li>
                <li>• <strong>Strip Image:</strong> Wide format, minimum 375x144px</li>
              </ul>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Front of Pass Content</h2>
              <p className="text-slate-600">Add header and secondary fields (primary fields overlay the strip image and can look poor)</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-yellow-900 mb-2">💡 Use Placeholders:</h4>
              <p className="text-sm text-yellow-800 mb-2">Use placeholders like <code className="bg-yellow-200 px-1 rounded">${`{customerName}`}</code> for dynamic content.</p>
              <div className="flex flex-wrap gap-2">
                {PLACEHOLDER_EXAMPLES.map((placeholder) => (
                  <span key={placeholder} className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs font-mono">
                    {placeholder}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Header Fields */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Header Fields</h3>
                  <button
                    onClick={() => addField('headerFields')}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Add Header Field
                  </button>
                </div>
                <div className="space-y-4">
                  {wizardData.headerFields.map((field, index) => (
                    <div key={field.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-medium text-slate-700">Header Field {index + 1}</span>
                        <button
                          onClick={() => removeField('headerFields', index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Field Label (e.g., Member Name)"
                          value={field.label}
                          onChange={(e) => updateField('headerFields', index, 'label', e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Placeholder (e.g., ${customerName})"
                          value={field.placeholder}
                          onChange={(e) => updateField('headerFields', index, 'placeholder', e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        />
                      </div>
                    </div>
                  ))}
                  {wizardData.headerFields.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <p>No header fields added yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Secondary Fields */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Secondary Fields</h3>
                  <button
                    onClick={() => addField('secondaryFields')}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Add Secondary Field
                  </button>
                </div>
                <div className="space-y-4">
                  {wizardData.secondaryFields.map((field, index) => (
                    <div key={field.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-medium text-slate-700">Secondary Field {index + 1}</span>
                        <button
                          onClick={() => removeField('secondaryFields', index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Field Label (e.g., Points Balance)"
                          value={field.label}
                          onChange={(e) => updateField('secondaryFields', index, 'label', e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Placeholder (e.g., ${pointsBalance})"
                          value={field.placeholder}
                          onChange={(e) => updateField('secondaryFields', index, 'placeholder', e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        />
                      </div>
                    </div>
                  ))}
                  {wizardData.secondaryFields.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <p>No secondary fields added yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Choose Your Pass Colors</h2>
              <p className="text-slate-600">Select the background color and text colors for your pass</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Background Color */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  Background Color <span className="text-red-500">*</span>
                </label>
                <div className="space-y-4">
                  <div 
                    className="w-full h-24 rounded-lg border-2 border-slate-300 cursor-pointer"
                    style={{ backgroundColor: wizardData.backgroundColor }}
                    onClick={() => document.getElementById('bg-color-input')?.click()}
                  />
                  <input
                    id="bg-color-input"
                    type="color"
                    value={wizardData.backgroundColor}
                    onChange={(e) => setWizardData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-full h-12 border border-slate-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={wizardData.backgroundColor}
                    onChange={(e) => setWizardData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                </div>
              </div>

              {/* Main Text Color */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  Main Text Color <span className="text-red-500">*</span>
                </label>
                <div className="space-y-4">
                  <div 
                    className="w-full h-24 rounded-lg border-2 border-slate-300 cursor-pointer"
                    style={{ backgroundColor: wizardData.foregroundColor }}
                    onClick={() => document.getElementById('fg-color-input')?.click()}
                  />
                  <input
                    id="fg-color-input"
                    type="color"
                    value={wizardData.foregroundColor}
                    onChange={(e) => setWizardData(prev => ({ ...prev, foregroundColor: e.target.value }))}
                    className="w-full h-12 border border-slate-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={wizardData.foregroundColor}
                    onChange={(e) => setWizardData(prev => ({ ...prev, foregroundColor: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                </div>
              </div>

              {/* Label Color */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  Label Color <span className="text-red-500">*</span>
                </label>
                <div className="space-y-4">
                  <div 
                    className="w-full h-24 rounded-lg border-2 border-slate-300 cursor-pointer"
                    style={{ backgroundColor: wizardData.labelColor }}
                    onClick={() => document.getElementById('label-color-input')?.click()}
                  />
                  <input
                    id="label-color-input"
                    type="color"
                    value={wizardData.labelColor}
                    onChange={(e) => setWizardData(prev => ({ ...prev, labelColor: e.target.value }))}
                    className="w-full h-12 border border-slate-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={wizardData.labelColor}
                    onChange={(e) => setWizardData(prev => ({ ...prev, labelColor: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Color Preview */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Color Preview</h3>
              <div 
                className="w-full max-w-md mx-auto h-48 rounded-lg p-6 shadow-lg"
                style={{ 
                  backgroundColor: wizardData.backgroundColor,
                  color: wizardData.foregroundColor 
                }}
              >
                <div className="space-y-3">
                  <div>
                    <div style={{ color: wizardData.labelColor }} className="text-xs uppercase tracking-wide">
                      Label Text
                    </div>
                    <div className="text-lg font-semibold">
                      Main Content Text
                    </div>
                  </div>
                  <div>
                    <div style={{ color: wizardData.labelColor }} className="text-xs uppercase tracking-wide">
                      Another Label
                    </div>
                    <div className="text-base">
                      Secondary Content
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Back of Pass Information</h2>
              <p className="text-slate-600">Add additional information that will appear on the back of the pass</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Back Fields are Optional</h4>
              <p className="text-sm text-blue-800">You can add terms & conditions, contact information, or any other details here. These fields support placeholders too!</p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Back Fields</h3>
                <button
                  onClick={() => addField('backFields')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Add Back Field
                </button>
              </div>

              <div className="space-y-4">
                {wizardData.backFields.map((field, index) => (
                  <div key={field.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium text-slate-700">Back Field {index + 1}</span>
                      <button
                        onClick={() => removeField('backFields', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Field Label (e.g., Terms & Conditions)"
                        value={field.label}
                        onChange={(e) => updateField('backFields', index, 'label', e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <textarea
                        placeholder="Field Content or Placeholder (e.g., Visit our website at ${websiteUrl})"
                        rows={3}
                        value={field.placeholder}
                        onChange={(e) => updateField('backFields', index, 'placeholder', e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                ))}
                
                {wizardData.backFields.length === 0 && (
                  <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-300 rounded-lg">
                    <p className="mb-2">No back fields added yet</p>
                    <p className="text-sm">Back fields are optional - you can skip this step if you don't need them</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Ready to Finish Your Pass!</h2>
              <p className="text-slate-600">Review your settings and complete the setup in the full pass designer</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-6 space-y-6">
              <h3 className="font-semibold text-slate-900 mb-4">Pass Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-slate-700">Template Name:</span>
                    <p className="text-slate-900">{wizardData.templateName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Style:</span>
                    <p className="text-slate-900">{PASS_STYLES.find(s => s.value === wizardData.style)?.label || wizardData.style}</p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Pass Type ID:</span>
                    <p className="text-slate-900 font-mono text-xs">{wizardData.passTypeIdentifier}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-slate-700">Images:</span>
                    <p className="text-slate-900">
                      {[
                        wizardData.logo && 'Logo',
                        wizardData.pushNotificationIcon && 'Push Icon',
                        wizardData.stripImage && 'Strip Image'
                      ].filter(Boolean).join(', ') || 'None'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Front Fields:</span>
                    <p className="text-slate-900">
                      {wizardData.headerFields.length} header, {wizardData.secondaryFields.length} secondary
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Back Fields:</span>
                    <p className="text-slate-900">{wizardData.backFields.length} fields</p>
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div>
                <span className="font-medium text-slate-700">Color Scheme:</span>
                <div className="flex gap-3 mt-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border border-slate-300"
                      style={{ backgroundColor: wizardData.backgroundColor }}
                    />
                    <span className="text-xs text-slate-600">Background</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border border-slate-300"
                      style={{ backgroundColor: wizardData.foregroundColor }}
                    />
                    <span className="text-xs text-slate-600">Text</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border border-slate-300"
                      style={{ backgroundColor: wizardData.labelColor }}
                    />
                    <span className="text-xs text-slate-600">Labels</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={finishWizard}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 flex items-center gap-3 mx-auto text-lg font-semibold"
              >
                <SparklesIcon className="w-6 h-6" />
                Complete in Pass Designer
              </button>
              <p className="text-sm text-slate-600 mt-3">
                You'll be taken to the full pass designer with all your settings pre-filled
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="dashboard-header">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pass Designer Wizard</h1>
          <p className="text-slate-600 mt-1">Step-by-step pass creation wizard</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        {/* Progress Steps */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-center">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep === step.id 
                    ? 'border-blue-500 bg-blue-500 text-white' 
                    : currentStep > step.id
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-slate-300 text-slate-500'
                }`}>
                  {currentStep > step.id ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                <div className="ml-3 hidden md:block">
                  <p className={`text-sm font-semibold ${currentStep === step.id ? 'text-blue-600' : currentStep > step.id ? 'text-green-600' : 'text-slate-500'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-slate-500">{step.description}</p>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`hidden md:block w-16 h-0.5 ml-4 ${currentStep > step.id ? 'bg-green-500' : 'bg-slate-300'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-slate-200 flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Previous
          </button>

          <div className="text-sm text-slate-500">
            Step {currentStep} of {STEPS.length}
          </div>

          {currentStep < 6 ? (
            <button
              onClick={nextStep}
              disabled={!canProceedToNext()}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={finishWizard}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <SparklesIcon className="w-4 h-4" />
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
