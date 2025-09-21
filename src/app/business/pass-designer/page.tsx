'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { ChromePicker } from 'react-color'
import toast, { Toaster } from 'react-hot-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { processImageForWallet, getImagePreviewUrl, type ProcessedImage } from '@/lib/image-processor'
import { TrashIcon, ClockIcon } from '@heroicons/react/24/outline'

// Apple Pass Constraints by Style
const PASS_CONSTRAINTS = {
  boardingPass: {
    frontFields: {
      headerFields: { max: 2 },
      primaryFields: { max: 2 },
      secondaryFields: { max: 4 },
      auxiliaryFields: { max: 4 },
      backFields: { max: 0 } // unlimited
    }
  },
  coupon: {
    frontFields: {
      headerFields: { max: 0 },
      primaryFields: { max: 1 },
      secondaryFields: { max: 4 },
      auxiliaryFields: { max: 4 },
      backFields: { max: 0 } // unlimited
    }
  },
  eventTicket: {
    frontFields: {
      headerFields: { max: 2 },
      primaryFields: { max: 2 },
      secondaryFields: { max: 4 },
      auxiliaryFields: { max: 4 },
      backFields: { max: 0 } // unlimited
    }
  },
  generic: {
    frontFields: {
      headerFields: { max: 2 },
      primaryFields: { max: 1 },
      secondaryFields: { max: 4 },
      auxiliaryFields: { max: 4 },
      backFields: { max: 0 } // unlimited
    }
  },
  storeCard: {
    frontFields: {
      headerFields: { max: 2 },
      primaryFields: { max: 1 },
      secondaryFields: { max: 4 },
      auxiliaryFields: { max: 4 },
      backFields: { max: 0 } // unlimited
    }
  }
}

interface PassField {
  id: string
  type: 'headerFields' | 'primaryFields' | 'secondaryFields' | 'auxiliaryFields' | 'backFields'
  label: string
  value: string
  key: string
  textAlignment?: 'PKTextAlignmentLeft' | 'PKTextAlignmentCenter' | 'PKTextAlignmentRight'
  changeMessage?: string // Push notification message when field changes
}

interface PassImage {
  file?: File // Optional since it won't exist after loading from database
  x1: string // Base64 1x resolution
  x2: string // Base64 2x resolution  
  x3: string // Base64 3x resolution
}

interface PassBarcode {
  format: string
  message: string
  messageEncoding: string
  contentType?: string
  altText?: string
  signBarcode?: boolean
  disableBarcode?: boolean
}

// Placeholder definition used in the Placeholders tab
interface PlaceholderDef {
  key: string
  defaultValue: string
  valueType: string // Text | Number | Currency | Date | Email | Phone
}

interface PassData {
  id?: string
  templateName: string
  description: string
  style: string
  passTypeIdentifier: string
  organizationName: string
  logoText?: string
  foregroundColor: string
  backgroundColor: string
  labelColor: string
  webServiceURL?: string
  authenticationToken?: string
  fields: PassField[]
  barcodes: PassBarcode[]
  locations: any[]
  relevantDate?: string
  maxDistance?: number
  images: {
    icon?: PassImage
    logo?: PassImage
    strip?: PassImage
    background?: PassImage
    thumbnail?: PassImage
  }
  placeholders?: PlaceholderDef[]
  tenantId?: string // NEW: Multi-tenant support
  isSaved?: boolean
}

const FIELD_TYPES = [
  { type: 'headerFields', label: 'Header Field', description: 'Top of pass' },
  { type: 'primaryFields', label: 'Primary Field', description: 'Overlaid on strip image' },
  { type: 'secondaryFields', label: 'Secondary Field', description: 'Below strip image' },
  { type: 'auxiliaryFields', label: 'Auxiliary Field', description: 'Bottom area' },
  { type: 'backFields', label: 'Back Field', description: 'Back of pass' },
  { type: 'barcode', label: 'Barcode', description: 'QR, PDF417, Aztec, Code128' }
]

// Draggable Field Component
function DraggableField({ type, label, description }: { type: string, label: string, description: string }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'field',
    item: { type, label, description },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))

  return (
    <div
      ref={drag as any}
      className={`p-3 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 cursor-move hover:bg-slate-200 transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="text-sm font-medium text-slate-900">{label}</div>
      <div className="text-xs text-slate-600">{description}</div>
    </div>
  )
}

// Pass Preview with Drop Zones
function PassPreview({ 
  passData, 
  onFieldDrop, 
  onFieldClick, 
  onBarcodeClick,
  showBack = false 
}: { 
  passData: PassData
  onFieldDrop: (fieldType: string, position?: { x: number, y: number }) => void
  onFieldClick: (field: PassField) => void
  onBarcodeClick: () => void
  showBack?: boolean
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'field',
    drop: (item: any, monitor) => {
      const offset = monitor.getClientOffset()
      const dropTargetRef = monitor.getDropResult()
      onFieldDrop(item.type, offset ? { x: offset.x, y: offset.y } : undefined)
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }))

  const constraints = PASS_CONSTRAINTS[passData.style as keyof typeof PASS_CONSTRAINTS]

  if (showBack) {
    return (
      <div ref={drop as any} className="relative">
        <div className="w-full max-w-[320px] mx-auto">
          {/* Back of Pass */}
          <div 
            className="w-full h-[504px] rounded-lg shadow-lg relative overflow-hidden"
            style={{ 
              backgroundColor: passData.backgroundColor,
              color: passData.foregroundColor 
            }}
          >
            {/* Back Fields */}
            <div className="p-4 space-y-3">
              {passData.fields
                .filter(field => field.type === 'backFields')
                .map((field, index) => (
                  <div
                    key={field.id}
                    onClick={() => onFieldClick(field)}
                    className="cursor-pointer hover:bg-black/10 p-2 rounded"
                  >
                    <div className="text-xs opacity-75" style={{ color: passData.labelColor }}>
                      {field.label}
                    </div>
                    <div className="text-sm font-medium whitespace-pre-wrap">
                      {field.value || `${field.label} Value`}
                    </div>
                  </div>
                ))}
              
              {/* Drop zone for back fields */}
              <div className={`border-2 border-dashed border-white/30 rounded p-4 text-center ${
                isOver ? 'border-white/60 bg-white/10' : ''
              }`}>
                <div className="text-sm opacity-75">Drop fields here</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={drop as any} className="relative">
      <div className="w-full max-w-[450px] mx-auto">
        {/* iPhone Frame */}
        <div className="relative bg-black rounded-[2.5rem] p-4 shadow-2xl">
          <div className="bg-slate-900 rounded-[2.25rem] p-6">
            {/* Status Bar */}
            <div className="flex justify-between items-center text-white text-sm mb-6">
              <span className="font-medium">9:41</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-2 border border-white rounded-sm">
                  <div className="w-3 h-1 bg-white rounded-sm m-0.5"></div>
                </div>
              </div>
            </div>
            
            {/* Pass Container - Proper Passslot dimensions */}
            <div 
              className="w-full h-[520px] rounded-xl shadow-lg relative overflow-hidden"
              style={{ 
                backgroundColor: passData.backgroundColor,
                color: passData.foregroundColor 
              }}
            >
              {/* Header Fields */}
              <div className="flex items-start p-4 border-b border-white/20 relative z-10">
                {/* Logo Area - TOP LEFT - BIGGER SIZE */}
                <div className="w-32 h-12 bg-white/20 rounded flex items-center justify-center mr-4 flex-shrink-0">
                  {passData.images.logo ? (
                    <img src={passData.images.logo.file ? getImagePreviewUrl(passData.images.logo as ProcessedImage) : passData.images.logo.x1} className="w-full h-full object-contain rounded" />
                  ) : (
                    <div className="text-xs text-center opacity-75">LOGO</div>
                  )}
                </div>

                {/* Header Fields - RIGHT ALIGNED */}
                <div className="flex-1 text-right">
                  {passData.fields
                    .filter(field => field.type === 'headerFields')
                    .slice(0, constraints?.frontFields.headerFields.max || 2)
                    .map((field, index) => (
                      <div 
                        key={field.id}
                        onClick={() => onFieldClick(field)}
                        className="cursor-pointer hover:bg-black/10 p-2 rounded mb-2"
                        style={{ 
                          textAlign: field.textAlignment?.replace('PKTextAlignment', '').toLowerCase() as any || 'right' 
                        }}
                      >
                        <div className="text-xs opacity-75" style={{ color: passData.labelColor }}>
                          {field.label}
                        </div>
                        <div className="text-sm font-medium">
                          {field.value || `${field.label} Value`}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Strip Image with Primary Fields Overlay */}
              {passData.images.strip && (
                <div className="relative w-full h-24 mb-2" style={{marginLeft: '1rem', marginRight: '1rem', width: 'calc(100% - 2rem)'}}>
                  <img 
                    src={passData.images.strip?.file ? getImagePreviewUrl(passData.images.strip as ProcessedImage) : passData.images.strip?.x1} 
                    className="w-full h-full object-cover rounded"
                  />
                  
                  {/* Primary Fields - Overlaid on Strip Image */}
                  <div className="absolute inset-0 flex items-center px-4">
                    {passData.fields
                      .filter(field => field.type === 'primaryFields')
                      .slice(0, constraints?.frontFields.primaryFields.max || 1)
                      .map((field, index) => (
                        <div 
                          key={field.id}
                          onClick={() => onFieldClick(field)}
                          className="cursor-pointer hover:bg-black/10 p-2 rounded relative z-10"
                        >
                          <div className="text-xs opacity-75" style={{ color: passData.labelColor }}>
                            {field.label}
                          </div>
                          <div className="text-2xl font-bold text-white drop-shadow-lg">
                            {field.value || `${field.label} Value`}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Primary Fields - Fallback when no strip image */}
              {!passData.images.strip && (
                <div className="px-4 py-6 relative">
                  {passData.fields
                    .filter(field => field.type === 'primaryFields')
                    .slice(0, constraints?.frontFields.primaryFields.max || 1)
                    .map((field, index) => (
                      <div 
                        key={field.id}
                        onClick={() => onFieldClick(field)}
                        className="cursor-pointer hover:bg-black/10 p-2 rounded mb-4 relative z-10"
                      >
                        <div className="text-xs opacity-75" style={{ color: passData.labelColor }}>
                          {field.label}
                        </div>
                        <div className="text-2xl font-bold">
                          {field.value || `${field.label} Value`}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Secondary & Auxiliary Fields */}
              <div className="px-4 py-4 grid grid-cols-2 gap-4">
                {passData.fields
                  .filter(field => field.type === 'secondaryFields' || field.type === 'auxiliaryFields')
                  .slice(0, 8) // Max combined
                  .map((field, index) => (
                    <div 
                      key={field.id}
                      onClick={() => onFieldClick(field)}
                      className="cursor-pointer hover:bg-black/10 p-2 rounded"
                    >
                      <div className="text-xs opacity-75" style={{ color: passData.labelColor }}>
                        {field.label}
                      </div>
                      <div className="text-sm font-medium">
                        {field.value || `${field.label} Value`}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Barcode Area - Centered and Larger */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                {passData.barcodes && passData.barcodes.length > 0 ? (
                  <div 
                    className="rounded p-2 cursor-pointer"
                    onClick={onBarcodeClick}
                  >
                    {(() => {
                      const barcodeType = passData.barcodes[0]?.format || 'PKBarcodeFormatQR'
                      
                      if (barcodeType === 'PKBarcodeFormatQR') {
                        return (
                          <div className="flex flex-col items-center">
                            {/* 140x140 QR code preview - NO BACKGROUND AT ALL */}
                            <svg viewBox="0 0 37 37" className="w-[140px] h-[140px]">
                                
                                {/* Corner detection patterns - CORRECT COLORS: BLACK modules on WHITE background */}
                                {/* Top-left */}
                                <rect x="0" y="0" width="9" height="9" fill="black"/>
                                <rect x="1" y="1" width="7" height="7" fill="white"/>
                                <rect x="2" y="2" width="5" height="5" fill="black"/>
                                <rect x="3" y="3" width="3" height="3" fill="white"/>
                                <rect x="4" y="4" width="1" height="1" fill="black"/>
                                
                                {/* Top-right */}
                                <rect x="28" y="0" width="9" height="9" fill="black"/>
                                <rect x="29" y="1" width="7" height="7" fill="white"/>
                                <rect x="30" y="2" width="5" height="5" fill="black"/>
                                <rect x="31" y="3" width="3" height="3" fill="white"/>
                                <rect x="32" y="4" width="1" height="1" fill="black"/>
                                
                                {/* Bottom-left */}
                                <rect x="0" y="28" width="9" height="9" fill="black"/>
                                <rect x="1" y="29" width="7" height="7" fill="white"/>
                                <rect x="2" y="30" width="5" height="5" fill="black"/>
                                <rect x="3" y="31" width="3" height="3" fill="white"/>
                                <rect x="4" y="32" width="1" height="1" fill="black"/>
                                
                                {/* Timing patterns */}
                                {Array.from({length: 17}).map((_, i) => (
                                  <g key={`timing-${i}`}>
                                    <rect x={10 + i} y="6" width="1" height="1" fill={i % 2 === 0 ? "black" : "white"}/>
                                    <rect x="6" y={10 + i} width="1" height="1" fill={i % 2 === 0 ? "black" : "white"}/>
                                  </g>
                                ))}
                                
                                {/* Alignment patterns */}
                                <rect x="30" y="30" width="5" height="5" fill="black"/>
                                <rect x="31" y="31" width="3" height="3" fill="white"/>
                                <rect x="32" y="32" width="1" height="1" fill="black"/>
                                
                                {/* Dense realistic data pattern */}
                                {Array.from({length: 400}).map((_, i) => {
                                  const x = 10 + (i % 20)
                                  const y = 10 + Math.floor(i / 20)
                                  if (x < 27 && y < 27 && !(x >= 28 && y >= 28)) {
                                    // Create realistic QR pattern based on position
                                    const pattern1 = (x * 7 + y * 11) % 5
                                    const pattern2 = (x + y + i) % 7
                                    const pattern3 = (x * y + i) % 3
                                    const isBlack = pattern1 < 2 || pattern2 < 3 || pattern3 === 0
                                    
                                    return (
                                      <rect key={i} x={x} y={y} width="1" height="1" fill={isBlack ? "black" : "white"}/>
                                    )
                                  }
                                  return null
                                })}
                                
                                {/* Format information around corners */}
                                {[
                                  {x: 8, y: 0}, {x: 8, y: 1}, {x: 8, y: 2}, {x: 8, y: 3}, {x: 8, y: 4}, {x: 8, y: 5},
                                  {x: 0, y: 8}, {x: 1, y: 8}, {x: 2, y: 8}, {x: 3, y: 8}, {x: 4, y: 8}, {x: 5, y: 8}
                                ].map((pos, i) => (
                                  <rect key={`format-${i}`} x={pos.x} y={pos.y} width="1" height="1" fill={i % 3 === 0 ? "black" : "white"}/>
                                ))}
                              </svg>
                            
                            {/* Text below shows altText or defaults to ${ID} */}
                            <div className="text-sm text-center mt-3 font-mono" style={{ color: passData.foregroundColor }}>
                              {passData.barcodes[0]?.altText || '${ID}'}
                            </div>
                          </div>
                        )
                      } else if (barcodeType === 'PKBarcodeFormatPDF417') {
                        return (
                          <div className="w-24 h-12 bg-white p-1 rounded">
                            <svg viewBox="0 0 90 36" className="w-full h-full">
                              <rect width="90" height="36" fill="white"/>
                              {/* Start pattern */}
                              <rect x="0" y="0" width="2" height="36" fill="black"/>
                              <rect x="3" y="0" width="1" height="36" fill="black"/>
                              
                              {/* Data columns */}
                              {Array.from({length: 12}).map((_, row) => (
                                <g key={row}>
                                  {Array.from({length: 17}).map((_, col) => {
                                    const pattern = (row * col + row + col) % 4
                                    return (
                                      <rect 
                                        key={col} 
                                        x={6 + col * 4} 
                                        y={row * 3} 
                                        width={pattern > 1 ? "2" : "1"} 
                                        height="3" 
                                        fill={pattern % 2 === 0 ? "black" : "white"}
                                      />
                                    )
                                  })}
                                </g>
                              ))}
                              
                              {/* Stop pattern */}
                              <rect x="86" y="0" width="1" height="36" fill="black"/>
                              <rect x="88" y="0" width="2" height="36" fill="black"/>
                            </svg>
                          </div>
                        )
                      } else if (barcodeType === 'PKBarcodeFormatAztec') {
                        return (
                          <div className="w-20 h-20 bg-white p-1 rounded">
                            <svg viewBox="0 0 23 23" className="w-full h-full">
                              <rect width="23" height="23" fill="white"/>
                              
                              {/* Center finder pattern */}
                              <rect x="9" y="9" width="5" height="5" fill="black"/>
                              <rect x="10" y="10" width="3" height="3" fill="white"/>
                              <rect x="11" y="11" width="1" height="1" fill="black"/>
                              
                              {/* Concentric squares */}
                              <rect x="8" y="8" width="7" height="1" fill="black"/>
                              <rect x="8" y="14" width="7" height="1" fill="black"/>
                              <rect x="8" y="8" width="1" height="7" fill="black"/>
                              <rect x="14" y="8" width="1" height="7" fill="black"/>
                              
                              <rect x="7" y="7" width="9" height="1" fill="black"/>
                              <rect x="7" y="15" width="9" height="1" fill="black"/>
                              <rect x="7" y="7" width="1" height="9" fill="black"/>
                              <rect x="15" y="7" width="1" height="9" fill="black"/>
                              
                              {/* Data pattern in concentric rings */}
                              {Array.from({length: 100}).map((_, i) => {
                                const angle = (i * 2.5) % 360
                                const radius = 3 + (i % 6)
                                const x = Math.round(11.5 + radius * Math.cos(angle * Math.PI / 180))
                                const y = Math.round(11.5 + radius * Math.sin(angle * Math.PI / 180))
                                
                                if (x >= 0 && x < 23 && y >= 0 && y < 23) {
                                  const isBlack = (x + y + i) % 3 === 0
                                  return (
                                    <rect key={i} x={x} y={y} width="1" height="1" fill={isBlack ? "black" : "white"}/>
                                  )
                                }
                                return null
                              })}
                            </svg>
                          </div>
                        )
                      } else {
                        // Code 128
                        return (
                          <div className="w-24 h-8 bg-white p-1 rounded">
                            <svg viewBox="0 0 80 20" className="w-full h-full">
                              <rect width="80" height="20" fill="white"/>
                              
                              {/* Start character */}
                              <rect x="2" y="2" width="2" height="16" fill="black"/>
                              <rect x="5" y="2" width="1" height="16" fill="black"/>
                              <rect x="7" y="2" width="1" height="16" fill="black"/>
                              
                              {/* Data bars - Code 128 pattern */}
                              {Array.from({length: 15}).map((_, i) => {
                                const patterns = [
                                  [2, 1, 2, 2, 2, 2], // Wide-narrow patterns
                                  [2, 2, 1, 2, 2, 2],
                                  [1, 2, 2, 1, 2, 2],
                                  [2, 1, 1, 2, 2, 2],
                                  [1, 1, 2, 2, 2, 2]
                                ]
                                const pattern = patterns[i % patterns.length]
                                let x = 10 + i * 4
                                
                                return (
                                  <g key={i}>
                                    {pattern.map((width, j) => {
                                      const isBlack = j % 2 === 0
                                      const rect = (
                                        <rect 
                                          key={j} 
                                          x={x} 
                                          y="2" 
                                          width={width * 0.5} 
                                          height="16" 
                                          fill={isBlack ? "black" : "white"}
                                        />
                                      )
                                      x += width * 0.5
                                      return rect
                                    })}
                                  </g>
                                )
                              })}
                              
                              {/* Stop character */}
                              <rect x="74" y="2" width="2" height="16" fill="black"/>
                              <rect x="77" y="2" width="1" height="16" fill="black"/>
                            </svg>
                          </div>
                        )
                      }
                    })()}
                  </div>
                ) : (
                  <div 
                    className="w-24 h-24 border-2 border-dashed border-white/50 rounded flex items-center justify-center cursor-pointer hover:border-white/75"
                    onClick={() => onFieldDrop('barcode')}
                  >
                    <div className="text-center text-white/75 text-xs">
                      <div className="mb-1">📱</div>
                      <div>Add Barcode</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Drop overlay */}
              {isOver && (
                <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500 border-dashed rounded-lg flex items-center justify-center">
                  <div className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
                    Drop to add field
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PassDesigner() {
  const [step, setStep] = useState<'list' | 'create' | 'design'>('list')
  const [activeTab, setActiveTab] = useState('template')
  const [passView, setPassView] = useState<'front' | 'back'>('front')
  const [selectedField, setSelectedField] = useState<PassField | null>(null)
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null)
  
  // NEW: Multi-tenant state management
  const [currentTenant, setCurrentTenant] = useState<{id: string, name: string} | null>(null)
  const [tenants, setTenants] = useState<{id: string, name: string}[]>([])
  const [loadingTenant, setLoadingTenant] = useState(true)
  
  const [currentPass, setCurrentPass] = useState<PassData>({
    templateName: '',
    description: '',
    style: '',
    passTypeIdentifier: '',
    organizationName: '',
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
    labelColor: '#666666',
    fields: [],
    barcodes: [],
    locations: [],
    images: {},
    tenantId: undefined // NEW: Add tenant scoping
  })
  const [supabaseTemplates, setSupabaseTemplates] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [passTypeIds, setPassTypeIds] = useState<{id: string, label: string, pass_type_identifier: string}[]>([])
  const [loadingPassTypeIds, setLoadingPassTypeIds] = useState(false)
  
  // NEW: Rate limiting for previews
  const [lastPreviewTime, setLastPreviewTime] = useState(0)
  
  // Local saved passes state
  const [savedPasses, setSavedPasses] = useState<PassData[]>([])

  // Load from localStorage once on mount
  useEffect(() => {
    // Check for wizard data first
    const checkWizardData = () => {
      try {
        // Check both sessionStorage and localStorage
        const wizardData = sessionStorage.getItem('wizardPassData') || localStorage.getItem('wizardPassData')
        if (wizardData) {
          const parsedWizardData = JSON.parse(wizardData)
          
          // Convert wizard data to PassData format
          const wizardPass: PassData = {
            id: `wizard_${Date.now()}`,
            templateName: parsedWizardData.templateName || 'Wizard Template',
            description: parsedWizardData.description || '',
            style: parsedWizardData.style || 'storeCard',
            passTypeIdentifier: parsedWizardData.passTypeIdentifier || '',
            organizationName: parsedWizardData.organizationName || 'WalletPush',
            foregroundColor: parsedWizardData.foregroundColor || '#ffffff',
            backgroundColor: parsedWizardData.backgroundColor || '#1a1a1a',
            labelColor: parsedWizardData.labelColor || '#cccccc',
            fields: parsedWizardData.fields || [],
            barcodes: parsedWizardData.barcodes || [],
            locations: parsedWizardData.locations || [],
            images: parsedWizardData.images || {},
            placeholders: parsedWizardData.placeholders || []
          }
          
          setCurrentPass(wizardPass)
          
          // CRITICAL: Set step to 'design' to show the editor instead of template list
          setStep('design')
          
          // Clear the wizard data from both storages
          sessionStorage.removeItem('wizardPassData')
          localStorage.removeItem('wizardPassData')
          
          // Show a success message
          toast.success('Wizard data loaded successfully! Continue editing your pass.')
          
          return true // Indicates wizard data was loaded
        }
      } catch (error) {
        console.error('Error loading wizard data:', error)
      }
      return false
    }

    // NEW: Fetch current tenant first
    const fetchTenant = async () => {
      try {
        setLoadingTenant(true)
        const res = await fetch(`/api/tenants?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
        })
        if (res.ok) {
          const { currentTenant, tenants } = await res.json()
          const tenant = currentTenant
          const allTenants = tenants
          setCurrentTenant(tenant)
          if (allTenants) setTenants(allTenants) // For admin tenant selector
          
          // Load templates scoped to tenant
          if (tenant) {
            const templatesRes = await fetch(`/api/templates?tenantId=${tenant.id}&t=${Date.now()}`, {
              cache: 'no-store',
              headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
            })
            if (templatesRes.ok) {
              try {
                const json = await templatesRes.json()
                if (json.templates && Array.isArray(json.templates)) {
                  setSupabaseTemplates(json.templates)
                } else {
                  console.error('❌ Templates is not an array:', typeof json.templates, json.templates)
                  setSupabaseTemplates([])
                }
      } catch (parseError: any) {
        console.error('❌ Failed to parse templates response:', parseError)
        toast.error(`Failed to parse templates: ${parseError.message}`)
        setSupabaseTemplates([])
      }
            } else {
              const errorText = await templatesRes.text()
              console.error('❌ Templates API failed:', templatesRes.status, errorText)
              toast.error(`Templates API failed: ${templatesRes.status} - ${errorText}`)
            }
          }
        } else {
          console.warn('Failed to load tenant info - using fallback')
          // Fallback: Load templates without tenant scoping for backward compatibility
          const res = await fetch('/api/templates', { cache: 'no-store' })
          if (res.ok) {
            const json = await res.json()
            setSupabaseTemplates(json.templates || [])
          }
        }
      } catch (error) {
        console.error('Error fetching tenant:', error)
        // Fallback: Load templates without tenant scoping
        try {
          const res = await fetch('/api/templates', { cache: 'no-store' })
          if (res.ok) {
            const json = await res.json()
            setSupabaseTemplates(json.templates || [])
          }
        } catch {}
      } finally {
        setLoadingTenant(false)
      }
    }

    // Check for wizard data first
    const hasWizardData = checkWizardData()
    
    // Only load from localStorage if no wizard data was found
    if (!hasWizardData) {
      try {
        const raw = localStorage.getItem('walletpush_pass_designer_saved')
        if (raw) {
          const parsed = JSON.parse(raw) as PassData[]
          if (Array.isArray(parsed)) {
            setSavedPasses(parsed)
          }
        }
      } catch {}
    }
    
    fetchTenant()
    
    // Load Pass Type IDs
    ;(async () => {
      setLoadingPassTypeIds(true)
      try {
        const res = await fetch('/api/pass-type-ids', { cache: 'no-store' })
        if (res.ok) {
          const json = await res.json()
          setPassTypeIds(json.passTypeIds || [])
        }
      } catch (error) {
        console.error('Failed to load Pass Type IDs:', error)
      } finally {
        setLoadingPassTypeIds(false)
      }
    })()
  }, [])

  // Handle field drop
  const handleFieldDrop = useCallback((fieldType: string) => {
    if (fieldType === 'barcode') {
      // Add barcode instead of field
      setCurrentPass(prev => ({
        ...prev,
        barcodes: [{
          format: 'PKBarcodeFormatQR',
          message: '${BARCODE_VALUE}',
          messageEncoding: 'iso-8859-1'
        }]
      }))
    } else {
      setCurrentPass(prev => {
        // Generate a meaningful placeholder name based on field type
        const fieldTypeName = fieldType.replace('Fields', '').toLowerCase()
        const existingFields = prev.fields.filter(f => f.type === fieldType)
        const fieldNumber = existingFields.length + 1
        
        const placeholderName = fieldTypeName === 'secondary' ? `SECONDARY_${fieldNumber}` :
                               fieldTypeName === 'auxiliary' ? `AUXILIARY_${fieldNumber}` :
                               fieldTypeName === 'header' ? `HEADER_${fieldNumber}` :
                               fieldTypeName === 'primary' ? `PRIMARY_${fieldNumber}` :
                               `BACK_${fieldNumber}`
        
        const newField: PassField = {
          id: `field_${Date.now()}`,
          type: fieldType as any,
          label: `New ${fieldType.replace('Fields', '')}`,
          value: `\${${placeholderName}}`,
          key: `key_${Date.now()}`
        }
        
        return {
          ...prev,
          fields: [...prev.fields, newField]
        }
      })
    }
  }, [])

  // Handle field click
  const handleFieldClick = useCallback((field: PassField) => {
    setSelectedField(field)
  }, [])

  // Handle barcode click
  const handleBarcodeClick = useCallback(() => {
    setSelectedField({
      id: 'barcode',
      type: 'backFields',
      label: 'Barcode',
      value: currentPass.barcodes[0]?.message || '${BARCODE_VALUE}',
      key: 'barcode'
    } as PassField)
  }, [currentPass.barcodes])

  // Save pass
  const handleSavePass = useCallback(() => {
    const passToSave = {
      ...currentPass,
      id: currentPass.id || `pass_${Date.now()}`
    }
    
    setSavedPasses(prev => {
      const existing = prev.findIndex(p => p.id === passToSave.id)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = passToSave
        try { localStorage.setItem('walletpush_pass_designer_saved', JSON.stringify(updated)) } catch {}
        return updated
      }
      const next = [...prev, passToSave]
      try { localStorage.setItem('walletpush_pass_designer_saved', JSON.stringify(next)) } catch {}
      return next
    })
    
    setCurrentPass(passToSave)
  }, [currentPass])

  // Save template to database with ALL images and metadata
  const handleSaveToSupabase = useCallback(async () => {
    // NEW: Validate tenant before saving
    // EMERGENCY FIX: Disable tenant validation
    /*
    if (!currentTenant) {
      toast.error('No tenant selected. Please contact support.')
      return
    }
    */
    
    setIsSaving(true)
    
    const toastId = toast.loading('Saving template to database...')
    
    try {
      // Extract current placeholders from fields AND barcodes for passkit_json
      const currentPlaceholders: { [key: string]: string } = {}
      
      // Scan all fields for placeholder patterns
      currentPass.fields.forEach(field => {
        const text = `${field.label || ''} ${field.value || ''}`
        const matches = text.match(/\$\{([A-Za-z0-9_]+)\}/g)
        if (matches) {
          matches.forEach(match => {
            const key = match.replace(/\$\{|\}/g, '')
            // Use existing placeholder value or create a sample one
            const existingPlaceholder = currentPass.placeholders?.find(p => p.key === key)
            currentPlaceholders[key] = existingPlaceholder?.defaultValue || `Sample ${key}`
          })
        }
      })

      // Scan all barcodes for placeholder patterns (message + altText)
      currentPass.barcodes.forEach(barcode => {
        const text = `${barcode.message || ''} ${barcode.altText || ''}`
        const matches = text.match(/\$\{([A-Za-z0-9_]+)\}/g)
        if (matches) {
          matches.forEach(match => {
            const key = match.replace(/\$\{|\}/g, '')
            // Use existing placeholder value or create a sample one
            const existingPlaceholder = currentPass.placeholders?.find(p => p.key === key)
            currentPlaceholders[key] = existingPlaceholder?.defaultValue || `Sample ${key}`
          })
        }
      })

      // Prepare complete template data with correct structure matching Supabase expectations
      const templateData = {
        name: currentPass.templateName || 'WalletPush Template',
        description: currentPass.description || 'Digital wallet pass template',
        passStyle: currentPass.style || 'storeCard', // Use 'style' field from currentPass
        style: currentPass.style || 'storeCard', // Ensure we have both fields for compatibility
        fields: currentPass.fields || [],
        colors: {
          backgroundColor: currentPass.backgroundColor || '#1a1a1a',
          foregroundColor: currentPass.foregroundColor || '#ffffff', 
          labelColor: currentPass.labelColor || '#cccccc'
        },
        barcodes: currentPass.barcodes || [],
        
        // Include placeholders with their default values
        placeholders: currentPass.placeholders || [],
        
        // Include ALL images with multiple resolutions using base64 data
        images: {
          // Icon images (required by Apple)
          icon: currentPass.images?.icon ? {
            '1x': currentPass.images.icon.x1,
            '2x': currentPass.images.icon.x2,
            '3x': currentPass.images.icon.x3
          } : null,
          
          // Logo images
          logo: currentPass.images?.logo ? {
            '1x': currentPass.images.logo.x1,
            '2x': currentPass.images.logo.x2,
            '3x': currentPass.images.logo.x3
          } : null,
          
          // Strip images
          strip: currentPass.images?.strip ? {
            '1x': currentPass.images.strip.x1,
            '2x': currentPass.images.strip.x2,
            '3x': currentPass.images.strip.x3
          } : null,
          
          // Background images (for event tickets)
          background: currentPass.images?.background ? {
            '1x': currentPass.images.background.x1,
            '2x': currentPass.images.background.x2,
            '3x': currentPass.images.background.x3
          } : null,
          
          // Thumbnail images
          thumbnail: currentPass.images?.thumbnail ? {
            '1x': currentPass.images.thumbnail.x1,
            '2x': currentPass.images.thumbnail.x2,
            '3x': currentPass.images.thumbnail.x3
          } : null
        },
        
        // Metadata
        metadata: {
          created_by: 'pass_designer',
          version: 1, // Use integer instead of string
          created_at: new Date().toISOString(),
          total_fields: currentPass.fields?.length || 0,
          total_barcodes: currentPass.barcodes?.length || 0,
          has_images: !!(currentPass.images?.icon || currentPass.images?.logo || currentPass.images?.strip),
          pass_type_identifier: currentPass.passTypeIdentifier,
          organization_name: currentPass.organizationName,
          pass_style: currentPass.style || 'storeCard', // Include the pass style in metadata too
          // tenant_id: currentTenant?.id // DISABLED: Multi-tenant scoping
        }
      }

      // CRITICAL: Create passkit_json for Apple Pass generation
      // This is what the ApplePassKitGenerator actually uses
      const passkitJson = {
        formatVersion: 1,
        passTypeIdentifier: currentPass.passTypeIdentifier,
        organizationName: currentPass.organizationName,
        description: currentPass.description || 'Digital wallet pass',
        backgroundColor: currentPass.backgroundColor || '#1a1a1a',
        foregroundColor: currentPass.foregroundColor || '#ffffff',
        labelColor: currentPass.labelColor || '#cccccc',
        
        // CRITICAL: Include the extracted placeholders
        placeholders: currentPlaceholders,
        
        // CRITICAL: Add the required Apple Wallet style object
        [currentPass.style || 'storeCard']: {
          headerFields: currentPass.fields.filter(f => f.type === 'headerFields'),
          primaryFields: currentPass.fields.filter(f => f.type === 'primaryFields'),
          secondaryFields: currentPass.fields.filter(f => f.type === 'secondaryFields'),
          auxiliaryFields: currentPass.fields.filter(f => f.type === 'auxiliaryFields'),
          backFields: currentPass.fields.filter(f => f.type === 'backFields')
        },
        
        // Add barcodes at root level
        barcodes: currentPass.barcodes || []
      }

      console.log('💾 Saving complete template data:', templateData)
      console.log('🎯 PassKit JSON with placeholders:', passkitJson)

      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...templateData,
          passkit_json: passkitJson  // CRITICAL: Add the passkit_json field
        })
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('❌ Save failed:', errorText)
        throw new Error(errorText)
      }

      const result = await res.json()
      console.log('✅ Template saved successfully:', result)

      // Update currentPass with the saved template ID and mark as saved
      setCurrentPass(prev => ({
        ...prev,
        id: result.template?.id || result.id,
        isSaved: true
      }))

      // Refresh the templates list
      const list = await fetch('/api/templates')
      if (list.ok) {
        const json = await list.json()
        setSupabaseTemplates(json.templates || [])
      }

      // Success toast
      toast.success('🎉 Pass template has been saved!', {
        id: toastId,
        duration: 3000,
        icon: '✅'
      })
      
    } catch (error: any) {
      console.error('❌ Error saving template:', error)
      
      // Error toast
      toast.error(`Failed to save template: ${error.message}`, {
        id: toastId,
        duration: 5000,
        icon: '❌'
      })
    } finally {
      setIsSaving(false)
    }
  }, [currentPass])

  // Smart placeholder normalization - converts any variation to semantic meaning
  const normalizePlaceholder = useCallback((placeholder: string): string => {
    const normalized = placeholder
      .toLowerCase()
      .replace(/[-_\s]/g, '') // Remove separators
      .replace(/name$/, '') // Remove trailing 'name' for first/last
    
    // Map common variations to standardized names
    const mappings: Record<string, string> = {
      'first': 'firstName',
      'firstname': 'firstName', 
      'fname': 'firstName',
      'last': 'lastName',
      'lastname': 'lastName',
      'lname': 'lastName',
      'surname': 'lastName',
      'email': 'email',
      'emailaddress': 'email',
      'mail': 'email',
      'phone': 'phone',
      'phonenumber': 'phone',
      'mobile': 'phone',
      'tel': 'phone',
      'telephone': 'phone',
      'id': 'memberId',
      'memberid': 'memberId',
      'member': 'memberId',
      'userid': 'memberId',
      'user': 'memberId',
      'barcodeval': 'memberId',
      'barcodevalue': 'memberId',
      'code': 'memberId',
      'offer': 'currentOffer',
      'currentoffer': 'currentOffer',
      'discount': 'currentOffer',
      'deal': 'currentOffer',
      'promotion': 'currentOffer',
      'points': 'points',
      'balance': 'balance',
      'tier': 'tier',
      'level': 'tier',
      'since': 'memberSince',
      'membersince': 'memberSince',
      'joined': 'memberSince'
    }
    
    return mappings[normalized] || placeholder
  }, [])

  // Generate smart sample data based on placeholder semantics and user defaults
  const generateSampleData = useCallback((allPlaceholders: string[]) => {
    const sampleData: Record<string, string> = {}
    
    // First, use any default values set by user in Dynamic Placeholders
    currentPass.placeholders?.forEach(placeholder => {
      if (placeholder.defaultValue && placeholder.defaultValue.trim()) {
        sampleData[placeholder.key] = placeholder.defaultValue
      }
    })
    
    // Then handle any remaining placeholders with smart defaults
    allPlaceholders.forEach(placeholder => {
      if (!sampleData[placeholder]) {
        const semantic = normalizePlaceholder(placeholder)
        
        switch (semantic) {
          case 'firstName':
            sampleData[placeholder] = 'John'
            break
          case 'lastName':
            sampleData[placeholder] = 'Doe'
            break
          case 'email':
            sampleData[placeholder] = 'john.doe@example.com'
            break
          case 'phone':
            sampleData[placeholder] = '+1 (555) 123-4567'
            break
          case 'memberId':
            sampleData[placeholder] = 'PREVIEW123'
            break
          case 'currentOffer':
            sampleData[placeholder] = '20% off next purchase'
            break
          case 'points':
            sampleData[placeholder] = '1000'
            break
          case 'balance':
            sampleData[placeholder] = '$25.00'
            break
          case 'tier':
            sampleData[placeholder] = 'Gold'
            break
          case 'memberSince':
            sampleData[placeholder] = '2024'
            break
          default:
            // For unknown placeholders, try to provide contextual defaults
            if (placeholder.toLowerCase().includes('date')) {
              sampleData[placeholder] = new Date().toLocaleDateString()
            } else if (placeholder.toLowerCase().includes('time')) {
              sampleData[placeholder] = new Date().toLocaleTimeString()
            } else if (placeholder.toLowerCase().includes('year')) {
              sampleData[placeholder] = new Date().getFullYear().toString()
            } else if (placeholder.toLowerCase().includes('count') || placeholder.toLowerCase().includes('number')) {
              sampleData[placeholder] = '5'
            } else if (placeholder.toLowerCase().includes('url') || placeholder.toLowerCase().includes('link')) {
              sampleData[placeholder] = 'https://example.com'
            } else {
              sampleData[placeholder] = `Sample ${placeholder}`
            }
        }
      }
    })
    
    return sampleData
  }, [currentPass.placeholders, normalizePlaceholder])

  // Preview pass - generate and download .pkpass file
  const handlePreviewPass = useCallback(async () => {
    // NEW: Rate limiting check (5 previews per minute)
    const now = Date.now()
    if (now - lastPreviewTime < 12000) { // 12 seconds between previews
      toast.error('Please wait before generating another preview (rate limit: 5/min)')
      return
    }
    setLastPreviewTime(now)
    
    // NEW: Validate tenant
    // EMERGENCY FIX: Disable tenant validation
    /*
    if (!currentTenant) {
      toast.error('No tenant selected. Please contact support.')
      return
    }
    */
    
    const toastId = toast.loading('Generating pass preview...')
    
    try {
      // Validate required fields
      if (!currentPass.templateName || !currentPass.style || !currentPass.passTypeIdentifier) {
        throw new Error('Please complete template setup: name, style, and pass type identifier are required')
      }

      // Save template first if not saved
      let templateId = currentPass.id
      if (!templateId) {
        await handleSaveToSupabase()
        templateId = currentPass.id
      }

      if (!templateId) {
        throw new Error('Failed to save template. Please try saving first.')
      }

      // Prepare sample form data for preview - collect all placeholders first
      const allPlaceholders: string[] = []
      
      // Extract placeholders from fields 
      currentPass.fields.forEach(field => {
        const placeholderRegex = /\$\{([A-Za-z0-9_-]+)\}/g
        let match
        while ((match = placeholderRegex.exec(field.value || '')) !== null) {
          const placeholder = match[1] // Keep exact case from template
          if (!allPlaceholders.includes(placeholder)) {
            allPlaceholders.push(placeholder)
          }
        }
      })

      // Extract placeholders from barcodes
      currentPass.barcodes.forEach(barcode => {
        const placeholderRegex = /\$\{([A-Za-z0-9_-]+)\}/g
        let match
        while ((match = placeholderRegex.exec(barcode.message || '')) !== null) {
          const placeholder = match[1] // Keep exact case from template
          if (!allPlaceholders.includes(placeholder)) {
            allPlaceholders.push(placeholder)
          }
        }
      })

      // Generate smart sample data using the new dynamic system
      const sampleFormData = generateSampleData(allPlaceholders)

      console.log('🔍 Preview form data:', sampleFormData)

      // Prepare template override to avoid server-side template fetch
      const templateOverride = {
        id: templateId,
        pass_type_identifier: currentPass.passTypeIdentifier,
        passkit_json: {
          formatVersion: 1,
          passTypeIdentifier: currentPass.passTypeIdentifier,
          organizationName: currentPass.organizationName,
          description: currentPass.description || 'Digital wallet pass',
          backgroundColor: currentPass.backgroundColor || '#1a1a1a',
          foregroundColor: currentPass.foregroundColor || '#ffffff',
          labelColor: currentPass.labelColor || '#cccccc',
          ...currentPass.barcodes?.length ? { barcodes: currentPass.barcodes } : {},
          ...currentPass.fields?.length ? { 
            [currentPass.style === 'storeCard' ? 'storeCard' : 
             currentPass.style === 'coupon' ? 'coupon' :
             currentPass.style === 'eventTicket' ? 'eventTicket' :
             currentPass.style === 'boardingPass' ? 'boardingPass' : 'generic']: {
              primaryFields: currentPass.fields.filter(f => f.position === 'primary'),
              secondaryFields: currentPass.fields.filter(f => f.position === 'secondary'),
              auxiliaryFields: currentPass.fields.filter(f => f.position === 'auxiliary'),
              backFields: currentPass.fields.filter(f => f.position === 'back'),
              headerFields: currentPass.fields.filter(f => f.position === 'header')
            }
          } : {}
        },
        template_json: {
          images: currentPass.images
        }
      }

      // Generate the .pkpass file using the Apple PassKit generator
      const response = await fetch('/api/apple-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateOverride: templateOverride,
          formData: sampleFormData,
          userId: 'preview-user',
          deviceType: 'desktop',
          // tenantId: currentTenant?.id // DISABLED: Include tenant scoping
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate pass preview')
      }

      const result = await response.json()
      console.log('✅ Preview generated:', result)

      // Download the pass file
      if (result.meta?.downloadUrl) {
        const downloadResponse = await fetch(result.meta.downloadUrl)
        if (downloadResponse.ok) {
          const blob = await downloadResponse.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${currentPass.templateName || 'pass'}-preview.pkpass`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      }

      // Persist preview metadata on template
      try {
        await fetch(`/api/templates/${templateId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ previews: { generated_at: new Date().toISOString() } })
        })
      } catch {}

      // Success toast
      toast.success('🎉 Pass preview generated! Check your downloads folder.', {
        id: toastId,
        duration: 4000,
        icon: '📱'
      })
      
    } catch (error: any) {
      console.error('❌ Error generating preview:', error)
      
      // Error toast
      toast.error(`Failed to generate preview: ${error.message}`, {
        id: toastId,
        duration: 5000,
        icon: '❌'
      })
    }
  }, [currentPass, handleSaveToSupabase])

  // Delete template function
  const handleDeleteTemplate = useCallback(async (templateId: string, templateName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${templateName}"?\n\nThis action cannot be undone.`
    )
    
    if (!confirmed) return

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete template')
      }

      // Remove the template from local state
      setSupabaseTemplates(prev => prev.filter(t => t.id !== templateId))
      
      // Show success message
      toast.success(`Template "${templateName}" has been deleted successfully.`)
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error(`Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [])

  // Load pass
  const handleLoadPass = useCallback((templateJson: any) => {
    console.log('🔄 Loading template:', templateJson)
    
    // NEW: Validate tenant access
    if (currentTenant && templateJson.metadata?.tenant_id && templateJson.metadata.tenant_id !== currentTenant.id) {
      toast.error('Access denied: This template belongs to a different tenant')
      return
    }
    
    // Check if this is an AI-generated template (has templateName instead of name)
    const isAITemplate = templateJson.aiGenerated || templateJson.templateName
    
    let loadedPass: PassData
    
    if (isAITemplate) {
      // Convert AI template format to PassData format
      const fields: PassField[] = []
      
      // Convert frontFields to fields array
      if (templateJson.frontFields?.headerField) {
        fields.push({
          id: `header_${Date.now()}`,
          type: 'headerFields',
          key: templateJson.frontFields.headerField.placeholder || 'header',
          label: templateJson.frontFields.headerField.label,
          value: templateJson.frontFields.headerField.defaultValue || ''
        })
      }
      
      if (templateJson.frontFields?.secondaryField) {
        fields.push({
          id: `secondary_${Date.now()}`,
          type: 'secondaryFields', 
          key: templateJson.frontFields.secondaryField.placeholder || 'secondary',
          label: templateJson.frontFields.secondaryField.label,
          value: templateJson.frontFields.secondaryField.placeholder || '${Current_Offer}'
        })
      }
      
      // Convert backFields to fields array
      if (templateJson.backFields) {
        templateJson.backFields.forEach((backField: any, index: number) => {
          fields.push({
            id: `back_${Date.now()}_${index}`,
            type: 'backFields',
            key: backField.placeholder || `back_${index}`,
            label: backField.label,
            value: backField.placeholder || `\${${backField.label.replace(/\s+/g, '_')}}`
          })
        })
      }
      
      loadedPass = {
        id: templateJson.id,
        templateName: templateJson.templateName || templateJson.name || 'AI Template',
        description: templateJson.description || 'AI-generated template',
        style: 'storeCard',
        passTypeIdentifier: templateJson.passTypeId || 'pass.com.walletpushio',
        organizationName: templateJson.organizationName || 'WalletPush',
        foregroundColor: templateJson.textColor || '#000000',
        backgroundColor: templateJson.backgroundColor || '#ffffff',
        labelColor: templateJson.textColor || '#000000',
        fields: fields,
        barcodes: templateJson.barcode ? [{
          format: templateJson.barcode.type === 'QR' ? 'PKBarcodeFormatQR' : 'PKBarcodeFormatQR',
          message: templateJson.barcode.content || '${MEMBER_ID}',
          messageEncoding: 'iso-8859-1',
          altText: templateJson.barcode.altText || templateJson.barcode.content
        }] : [],
        locations: [],
        images: {
          logo: templateJson.logoUrl ? {
            file: undefined,
            x1: templateJson.logoUrl,
            x2: templateJson.logoUrl,
            x3: templateJson.logoUrl
          } : undefined,
          strip: templateJson.stripImageUrl ? {
            file: undefined,
            x1: templateJson.stripImageUrl,
            x2: templateJson.stripImageUrl,
            x3: templateJson.stripImageUrl
          } : undefined,
          icon: templateJson.iconUrl ? {
            file: undefined,
            x1: templateJson.iconUrl,
            x2: templateJson.iconUrl,
            x3: templateJson.iconUrl
          } : undefined
        },
        placeholders: templateJson.placeholders || [], // Use placeholders directly from AI template
        tenantId: currentTenant?.id,
        isSaved: true
      }
    } else {
      // Original template format
      loadedPass = {
        id: templateJson.id,
        templateName: templateJson.name || 'WalletPush',
        description: templateJson.description || 'Digital wallet pass template',
        style: templateJson.passStyle || templateJson.style || 'storeCard',
        passTypeIdentifier: templateJson.metadata?.pass_type_identifier || 'pass.com.walletpushio',
        organizationName: templateJson.metadata?.organization_name || 'WalletPush',
        foregroundColor: templateJson.colors?.foregroundColor || '#ffffff',
        backgroundColor: templateJson.colors?.backgroundColor || '#1a1a1a',
        labelColor: templateJson.colors?.labelColor || '#cccccc',
        fields: templateJson.fields || [],
        barcodes: templateJson.barcodes || [],
        locations: [],
          images: {
            logo: templateJson.images?.logo ? {
              file: undefined, // File object doesn't exist after save/load
              x1: templateJson.images.logo['1x'] || templateJson.images.logo.x1,
              x2: templateJson.images.logo['2x'] || templateJson.images.logo.x2,
              x3: templateJson.images.logo['3x'] || templateJson.images.logo.x3
            } : undefined,
            strip: templateJson.images?.strip ? {
              file: undefined,
              x1: templateJson.images.strip['1x'] || templateJson.images.strip.x1,
              x2: templateJson.images.strip['2x'] || templateJson.images.strip.x2,
              x3: templateJson.images.strip['3x'] || templateJson.images.strip.x3
            } : undefined,
            icon: templateJson.images?.icon ? {
              file: undefined,
              x1: templateJson.images.icon['1x'] || templateJson.images.icon.x1,
              x2: templateJson.images.icon['2x'] || templateJson.images.icon.x2,
              x3: templateJson.images.icon['3x'] || templateJson.images.icon.x3
            } : undefined,
            background: templateJson.images?.background ? {
              file: undefined,
              x1: templateJson.images.background['1x'] || templateJson.images.background.x1,
              x2: templateJson.images.background['2x'] || templateJson.images.background.x2,
              x3: templateJson.images.background['3x'] || templateJson.images.background.x3
            } : undefined,
            thumbnail: templateJson.images?.thumbnail ? {
              file: undefined,
              x1: templateJson.images.thumbnail['1x'] || templateJson.images.thumbnail.x1,
              x2: templateJson.images.thumbnail['2x'] || templateJson.images.thumbnail.x2,
              x3: templateJson.images.thumbnail['3x'] || templateJson.images.thumbnail.x3
            } : undefined
          },
          placeholders: templateJson.placeholders || [],
          tenantId: currentTenant?.id,
          isSaved: true
        }
      }
    
    console.log('✅ Converted template to PassData:', loadedPass)
    setCurrentPass(loadedPass)
    setStep('design')
  }, [currentTenant, setCurrentPass, setStep])

  // Show loading state while fetching tenant (like distribution page)
  if (loadingTenant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Pass Designer...</p>
        </div>
      </div>
    )
  }

  // NEW: Show tenant setup if no tenant
  if (false && !currentTenant) { // DISABLED
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Business Setup Required</h2>
          <p className="text-slate-600 mb-6">Please set up your business account to access the Pass Designer.</p>
          <Button onClick={() => window.location.href = '/business/setup'} className="bg-gray-700 hover:bg-gray-800">
            Set Up Business Account
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'list') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Pass Designer</h1>
              <p className="text-slate-600">Create and manage your wallet pass templates</p>
              {/* NEW: Show current tenant */}
              {/* <p className="text-sm text-slate-500 mt-1">Business: {currentTenant.name}</p> */}
            </div>
            <div className="flex items-center gap-4">
              {/* NEW: Tenant selector for admins - DISABLED
              {tenants.length > 1 && (
                <select 
                  value={currentTenant.id} 
                  onChange={(e) => {
                    const tenant = tenants.find(t => t.id === e.target.value)
                    if (tenant) setCurrentTenant(tenant)
                  }}
                  className="px-3 py-2 border border-slate-300 rounded-md text-sm"
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
              */}
              <Button
                onClick={() => setStep('create')}
                className="btn-primary"
              >
                Create New Pass
              </Button>
            </div>
          </div>

          {/* Templates */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-6">Templates</h3>
              {supabaseTemplates.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No templates yet</h3>
                  <p className="text-slate-600 mb-4">Create your first pass template to get started</p>
                  <Button onClick={() => setStep('create')}>
                    Create New Template
                  </Button>
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {supabaseTemplates.map((t: any) => {
                  const templateName = t.programs?.name || t.template_json?.name || t.template_json?.templateName || 'WalletPush Template'
                  const description = t.template_json?.description || 'Digital wallet pass template'
                  const passType = t.template_json?.metadata?.pass_style || t.template_json?.style || 'storeCard'
                  const fieldCount = t.template_json?.fields?.length || 0
                  const hasImages = t.template_json?.images && Object.keys(t.template_json.images).length > 0
                  
                  return (
                    <div key={t.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
                      {/* Header with gradient */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-slate-100">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-semibold text-slate-900 truncate mb-1">
                              {templateName}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                {passType.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <span className="flex items-center gap-1">
                                <ClockIcon className="w-3 h-3" />
                                {new Date(t.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteTemplate(t.id, templateName)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Delete template"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <p className="text-slate-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                          {description}
                        </p>
                        
                        {/* Stats */}
                        <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2v8h10V6H5z" clipRule="evenodd" />
                            </svg>
                            <span>{fieldCount} fields</span>
                          </div>
                          {hasImages && (
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                              </svg>
                              <span>Has images</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>v{t.version}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleLoadPass(t.template_json)}
                          >
                            Load Template
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (step === 'create') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => setStep('list')}
              className="mb-4"
            >
              ← Back to Pass List
            </Button>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Pass Template</h1>
            <p className="text-slate-600">Set up your wallet pass template configuration</p>
          </div>

          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    value={currentPass.templateName}
                    onChange={(e) => setCurrentPass(prev => ({...prev, templateName: e.target.value}))}
                    placeholder="VIP Membership Card"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input
                    value={currentPass.organizationName}
                    onChange={(e) => setCurrentPass(prev => ({...prev, organizationName: e.target.value}))}
                    placeholder="Your Business Name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <textarea
                  value={currentPass.description}
                  onChange={(e) => setCurrentPass(prev => ({...prev, description: e.target.value}))}
                  className="w-full h-20 px-3 py-2 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Describe your pass template..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Pass Style</Label>
                  <select
                    value={currentPass.style}
                    onChange={(e) => setCurrentPass(prev => ({...prev, style: e.target.value}))}
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Style</option>
                    <option value="boardingPass">Boarding Pass</option>
                    <option value="coupon">Coupon</option>
                    <option value="eventTicket">Event Ticket</option>
                    <option value="generic">Generic</option>
                    <option value="storeCard">Store Card</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Pass Type Identifier</Label>
                  <select 
                    value={currentPass.passTypeIdentifier}
                    onChange={(e) => setCurrentPass(prev => ({...prev, passTypeIdentifier: e.target.value}))}
                    className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={loadingPassTypeIds}
                  >
                    {loadingPassTypeIds ? (
                      <option value="">Loading Pass Type IDs...</option>
                    ) : passTypeIds.length === 0 ? (
                      <option value="">No Pass Type IDs found</option>
                    ) : (
                      <>
                        <option value="">✓ Select Pass Type ID</option>
                        {passTypeIds.map((passType) => (
                          <option key={passType.id} value={passType.pass_type_identifier}>
                            {passType.label} ({passType.pass_type_identifier})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  onClick={() => setStep('design')}
                  disabled={!currentPass.templateName || !currentPass.style || !currentPass.passTypeIdentifier}
                  className="btn-primary"
                >
                  Continue to Designer
                </Button>
                <Button variant="outline" onClick={() => setStep('list')}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Main Designer Interface
  return (
    <DndProvider backend={HTML5Backend}>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151',
          },
          success: {
            style: {
              background: '#059669',
              color: '#ffffff',
            },
          },
          error: {
            style: {
              background: '#dc2626',
              color: '#ffffff',
            },
          },
        }}
      />
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setStep('list')}
              >
                ← Back
              </Button>
              <h1 className="text-xl font-semibold text-slate-900">
                {currentPass.templateName || 'Pass Designer'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                onClick={handlePreviewPass}
                disabled={!currentPass.templateName || !currentPass.style || !currentPass.passTypeIdentifier}
              >
                Preview
              </Button>
              <Button 
                variant="outline"
                onClick={handleSavePass}
                disabled={!currentPass.templateName || !currentPass.style}
              >
                Save
              </Button>
              <Button 
                onClick={async () => {
                  await handleSaveToSupabase()
                  if (currentPass.id) {
                    try {
                      await fetch(`/api/templates/${currentPass.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ publish: true })
                      })
                      toast.success('Template published!')
                    } catch {}
                  }
                }}
                disabled={!currentPass.templateName || !currentPass.style || !currentPass.passTypeIdentifier}
              >
                Save & Publish
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-slate-200 px-6">
          <nav className="flex space-x-8">
            {['Template', 'Appearance', 'Relevance', 'Placeholders', 'Actions', 'Distribution'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.toLowerCase()
                    ? 'border-gray-700 text-gray-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex h-[calc(100vh-140px)]">
          {/* Left Panel - Pass Preview */}
          <div className="w-1/3 bg-white border-r border-slate-200 p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Pass Preview</h3>
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setPassView('front')}
                    className={`px-3 py-1 text-sm rounded ${
                      passView === 'front' ? 'bg-white shadow' : ''
                    }`}
                  >
                    Front
                  </button>
                  <button
                    onClick={() => setPassView('back')}
                    className={`px-3 py-1 text-sm rounded ${
                      passView === 'back' ? 'bg-white shadow' : ''
                    }`}
                  >
                    Back
                  </button>
                </div>
              </div>
              
              <PassPreview 
                passData={currentPass}
                onFieldDrop={handleFieldDrop}
                onFieldClick={handleFieldClick}
                onBarcodeClick={handleBarcodeClick}
                showBack={passView === 'back'}
              />
            </div>
          </div>

          {/* Center Panel - Field Toolbox */}
          <div className="w-1/3 bg-slate-50 p-6">
            {activeTab === 'template' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Template Settings</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Edit your pass template details
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Template Name</Label>
                    <Input
                      value={currentPass.templateName}
                      onChange={(e) => setCurrentPass(prev => ({...prev, templateName: e.target.value}))}
                      placeholder="Enter template name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <Input
                      value={currentPass.description}
                      onChange={(e) => setCurrentPass(prev => ({...prev, description: e.target.value}))}
                      placeholder="Enter template description"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Organization Name</Label>
                    <Input
                      value={currentPass.organizationName}
                      onChange={(e) => setCurrentPass(prev => ({...prev, organizationName: e.target.value}))}
                      placeholder="Your business name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Pass Type ID</Label>
                    {loadingPassTypeIds ? (
                      <div className="text-sm text-gray-500 mt-1">Loading Pass Type IDs...</div>
                    ) : passTypeIds.length > 0 ? (
                      <select 
                        value={currentPass.passTypeIdentifier || ''}
                        onChange={(e) => setCurrentPass(prev => ({...prev, passTypeIdentifier: e.target.value}))}
                        className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Select Pass Type ID</option>
                        {passTypeIds.map((passType) => (
                          <option key={passType.id} value={passType.pass_type_identifier}>
                            {passType.label} ({passType.pass_type_identifier})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-sm text-gray-500 mt-1">
                        No Pass Type IDs found. Upload a certificate in Pass Type IDs settings.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Field Toolbox</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Drag fields onto the pass to add them
                  </p>
                </div>

                <div className="space-y-3">
                  {Array.from(new Map(FIELD_TYPES.map(ft => [ft.type, ft])).values()).map((fieldType) => {
                    console.log('Rendering field:', fieldType.type, fieldType.label)
                    return (
                      <DraggableField
                        key={fieldType.type}
                        type={fieldType.type}
                        label={fieldType.label}
                        description={fieldType.description}
                      />
                    )
                  })}
                  
                </div>

                {selectedField && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {selectedField.id === 'barcode' ? 'Edit Barcode' : 'Edit Field'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedField.id === 'barcode' ? (
                        <>
                          <div className="bg-slate-800 text-white p-3 rounded-lg mb-4">
                            <div className="text-sm font-medium mb-2">📱 Barcode</div>
                            
                            {/* Barcode Type Dropdown */}
                            <div className="mb-3">
                              <Label className="text-xs text-slate-300">Barcode Type</Label>
                              <select 
                                className="w-full h-8 px-2 text-sm border border-slate-600 rounded bg-slate-700 text-white mt-1"
                                value={currentPass.barcodes[0]?.format || 'PKBarcodeFormatQR'}
                                onChange={(e) => {
                                  const updatedBarcodes = [{
                                    ...currentPass.barcodes[0],
                                    format: e.target.value,
                                    message: currentPass.barcodes[0]?.message || '${ID}'
                                  }]
                                  setCurrentPass(prev => ({ ...prev, barcodes: updatedBarcodes }))
                                }}
                              >
                                <option value="PKBarcodeFormatQR">QR Code</option>
                                <option value="PKBarcodeFormatPDF417">PDF417</option>
                                <option value="PKBarcodeFormatAztec">Aztec</option>
                                <option value="PKBarcodeFormatCode128">Code 128</option>
                              </select>
                            </div>
                            
                            {/* Barcode Content Dropdown */}
                            <div className="mb-3">
                              <Label className="text-xs text-slate-300">Barcode Content</Label>
                              <select 
                                className="w-full h-8 px-2 text-sm border border-slate-600 rounded bg-slate-700 text-white mt-1"
                                value={currentPass.barcodes[0]?.contentType || 'passId'}
                                onChange={(e) => {
                                  const contentTypes = {
                                    'passId': '${ID}',
                                    'passUrl': 'https://members.walletpush.io/pass/${ID}',
                                    'templateUrl': 'https://members.walletpush.io/template/${TEMPLATE_ID}',
                                    'scanUrl': 'https://members.walletpush.io/scan/${ID}',
                                    'custom': '${MEMBER_ID}'
                                  }
                                  const message = contentTypes[e.target.value as keyof typeof contentTypes]
                                  const updatedBarcodes = [{
                                    ...currentPass.barcodes[0],
                                    contentType: e.target.value,
                                    message: message,
                                    format: currentPass.barcodes[0]?.format || 'PKBarcodeFormatQR'
                                  }]
                                  setCurrentPass(prev => ({ ...prev, barcodes: updatedBarcodes }))
                                }}
                              >
                                <option value="passId">Pass ID</option>
                                <option value="passUrl">Pass URL</option>
                                <option value="templateUrl">Template URL</option>
                                <option value="scanUrl">Scan URL</option>
                                <option value="custom">✓ Custom</option>
                              </select>
                            </div>

                            {/* Custom URL Input */}
                            <div className="mb-3">
                              <Label className="text-xs text-slate-300">Barcode Data</Label>
                              <Input
                                value={currentPass.barcodes[0]?.message || 'https://members.walletpush.io/offer-'}
                                onChange={(e) => {
                                  const updatedBarcodes = [{
                                    ...currentPass.barcodes[0],
                                    message: e.target.value
                                  }]
                                  setCurrentPass(prev => ({ ...prev, barcodes: updatedBarcodes }))
                                }}
                                placeholder="Enter barcode content"
                                className="bg-slate-600 border-slate-500 text-white text-sm h-8 mt-1"
                              />
                            </div>
                            
                            {/* Text Below Barcode */}
                            <div className="mb-3">
                              <Label className="text-xs text-slate-300">Text Below Barcode</Label>
                              <Input
                                value={currentPass.barcodes[0]?.altText || '${ID}'}
                                onChange={(e) => {
                                  const updatedBarcodes = [{
                                    ...currentPass.barcodes[0],
                                    altText: e.target.value
                                  }]
                                  setCurrentPass(prev => ({ ...prev, barcodes: updatedBarcodes }))
                                }}
                                placeholder="Text displayed below barcode"
                                className="bg-slate-600 border-slate-500 text-white text-sm h-8 mt-1"
                              />
                            </div>

                            {/* Sign Barcode Checkbox */}
                            <div className="flex items-center mb-2">
                              <input 
                                type="checkbox" 
                                id="signBarcode"
                                className="mr-2"
                                defaultChecked={false}
                              />
                              <Label htmlFor="signBarcode" className="text-xs text-slate-300">Sign Barcode</Label>
                            </div>

                            {/* Disable Barcode Checkbox */}
                            <div className="flex items-center">
                              <input 
                                type="checkbox" 
                                id="disableBarcode"
                                className="mr-2"
                                defaultChecked={false}
                              />
                              <Label htmlFor="disableBarcode" className="text-xs text-slate-300">Disable Barcode</Label>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setCurrentPass(prev => ({ ...prev, barcodes: [] }))
                              setSelectedField(null)
                            }}
                          >
                            Delete Barcode
                          </Button>
                        </>
                      ) : (
                        <>
                          <div>
                            <Label className="text-sm">Label</Label>
                            <Input
                              value={selectedField.label}
                              onChange={(e) => {
                                const updatedFields = currentPass.fields.map(field =>
                                  field.id === selectedField.id
                                    ? { ...field, label: e.target.value }
                                    : field
                                )
                                setCurrentPass(prev => ({ ...prev, fields: updatedFields }))
                                setSelectedField({ ...selectedField, label: e.target.value })
                              }}
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Value</Label>
                            {selectedField.type === 'backFields' ? (
                              <Textarea
                                value={selectedField.value}
                                onChange={(e) => {
                                  const updatedFields = currentPass.fields.map(field =>
                                    field.id === selectedField.id
                                      ? { ...field, value: e.target.value }
                                      : field
                                  )
                                  setCurrentPass(prev => ({ ...prev, fields: updatedFields }))
                                  setSelectedField({ ...selectedField, value: e.target.value })
                                }}
                                placeholder="${FIRST_NAME}, ${POINTS}, etc.&#10;Support for multiple lines&#10;Line breaks are preserved"
                                rows={4}
                                className="resize-vertical"
                              />
                            ) : (
                              <Input
                                value={selectedField.value}
                                onChange={(e) => {
                                  const updatedFields = currentPass.fields.map(field =>
                                    field.id === selectedField.id
                                      ? { ...field, value: e.target.value }
                                      : field
                                  )
                                  setCurrentPass(prev => ({ ...prev, fields: updatedFields }))
                                  setSelectedField({ ...selectedField, value: e.target.value })
                                }}
                                placeholder="${FIRST_NAME}, ${POINTS}, etc."
                              />
                            )}
                          </div>
                          <div>
                            <Label className="text-sm">Change Message</Label>
                            <Input
                              value={selectedField.changeMessage || ''}
                              onChange={(e) => {
                                const updatedFields = currentPass.fields.map(field =>
                                  field.id === selectedField.id
                                    ? { ...field, changeMessage: e.target.value }
                                    : field
                                )
                                setCurrentPass(prev => ({ ...prev, fields: updatedFields }))
                                setSelectedField({ ...selectedField, changeMessage: e.target.value })
                              }}
                              placeholder="Points updated: %@"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                              Push notification message when field changes. Use %@ for value placeholder. Leave blank for no push notification.
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm">Text Alignment</Label>
                            <select 
                              className="w-full h-9 px-3 border border-slate-300 rounded-lg bg-white"
                              value={selectedField.textAlignment || 'PKTextAlignmentLeft'}
                              onChange={(e) => {
                                const updatedFields = currentPass.fields.map(field =>
                                  field.id === selectedField.id
                                    ? { ...field, textAlignment: e.target.value as any }
                                    : field
                                )
                                setCurrentPass(prev => ({ ...prev, fields: updatedFields }))
                                setSelectedField({ ...selectedField, textAlignment: e.target.value as any })
                              }}
                            >
                              <option value="PKTextAlignmentLeft">Left</option>
                              <option value="PKTextAlignmentCenter">Center</option>
                              <option value="PKTextAlignmentRight">Right</option>
                            </select>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const updatedFields = currentPass.fields.filter(field => field.id !== selectedField.id)
                              setCurrentPass(prev => ({ ...prev, fields: updatedFields }))
                              setSelectedField(null)
                            }}
                          >
                            Delete Field
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Properties */}
          <div className="w-1/3 bg-white border-l border-slate-200 p-6">
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Appearance</h3>
                
                {/* Color Controls */}
                <div className="space-y-4">
                  {[
                    { key: 'backgroundColor', label: 'Background Color' },
                    { key: 'foregroundColor', label: 'Text Color' },
                    { key: 'labelColor', label: 'Label Color' }
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <Label className="text-sm font-medium">{label}</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => setShowColorPicker(showColorPicker === key ? null : key)}
                          className="w-8 h-8 rounded border border-slate-300"
                          style={{ backgroundColor: currentPass[key as keyof PassData] as string }}
                        />
                        <Input
                          value={currentPass[key as keyof PassData] as string}
                          onChange={(e) => setCurrentPass(prev => ({ ...prev, [key]: e.target.value }))}
                          className="flex-1 h-8 text-sm"
                        />
                      </div>
                      {showColorPicker === key && (
                        <div className="absolute z-10 mt-2">
                          <div
                            className="fixed inset-0"
                            onClick={() => setShowColorPicker(null)}
                          />
                          <ChromePicker
                            color={currentPass[key as keyof PassData] as string}
                            onChange={(color) => setCurrentPass(prev => ({ ...prev, [key]: color.hex }))}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Image Uploads */}
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900">Images</h4>
                  
                  {/* Logo Upload */}
                  <div>
                    <Label className="text-sm font-medium">Logo</Label>
                    <p className="text-xs text-slate-500 mb-2">29x29pt (87x87px @3x)</p>
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            try {
                              const processedImage = await processImageForWallet(file, 'logo')
                              setCurrentPass(prev => ({
                                ...prev,
                                images: { ...prev.images, logo: processedImage }
                              }))
                            } catch (error) {
                              console.error('Error processing logo:', error)
                              alert('Failed to process image. Please try a different file.')
                            }
                          }
                        }}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        {currentPass.images.logo ? (
                          <div className="flex items-center gap-2">
                            <img 
                              src={currentPass.images.logo?.file ? getImagePreviewUrl(currentPass.images.logo as ProcessedImage) : currentPass.images.logo?.x1} 
                              className="w-8 h-8 object-contain"
                            />
                            <span className="text-sm">{currentPass.images.logo.file?.name || 'logo.png'}</span>
                            <div className="text-xs text-slate-400">1x/2x/3x</div>
                          </div>
                        ) : (
                          <div>
                            <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-slate-500">Click to upload logo</p>
                            <p className="text-xs text-slate-400 mt-1">Auto-generates 1x, 2x, 3x resolutions</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Strip Image Upload */}
                  <div>
                    <Label className="text-sm font-medium">Strip Image</Label>
                    <p className="text-xs text-slate-500 mb-2">375x123pt (1125x369px @3x)</p>
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            try {
                              const processedImage = await processImageForWallet(file, 'strip')
                              setCurrentPass(prev => ({
                                ...prev,
                                images: { ...prev.images, strip: processedImage }
                              }))
                            } catch (error) {
                              console.error('Error processing strip image:', error)
                              alert('Failed to process image. Please try a different file.')
                            }
                          }
                        }}
                        className="hidden"
                        id="strip-upload"
                      />
                      <label htmlFor="strip-upload" className="cursor-pointer">
                        {currentPass.images.strip ? (
                          <div className="flex items-center gap-2">
                            <img 
                              src={currentPass.images.strip?.file ? getImagePreviewUrl(currentPass.images.strip as ProcessedImage) : currentPass.images.strip?.x1} 
                              className="w-16 h-5 object-cover rounded"
                            />
                            <span className="text-sm">{currentPass.images.strip.file?.name || 'strip.png'}</span>
                            <div className="text-xs text-slate-400">1x/2x/3x</div>
                          </div>
                        ) : (
                          <div>
                            <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-slate-500">Click to upload strip image</p>
                            <p className="text-xs text-slate-400 mt-1">Auto-generates 1x, 2x, 3x resolutions</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Icon Upload */}
                  <div>
                    <Label className="text-sm font-medium">Icon</Label>
                    <p className="text-xs text-slate-500 mb-2">29x29pt (87x87px @3x)</p>
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            try {
                              const processedImage = await processImageForWallet(file, 'icon')
                              setCurrentPass(prev => ({
                                ...prev,
                                images: { ...prev.images, icon: processedImage }
                              }))
                            } catch (error) {
                              console.error('Error processing icon:', error)
                              alert('Failed to process image. Please try a different file.')
                            }
                          }
                        }}
                        className="hidden"
                        id="icon-upload"
                      />
                      <label htmlFor="icon-upload" className="cursor-pointer">
                        {currentPass.images.icon ? (
                          <div className="flex items-center gap-2">
                            <img 
                              src={currentPass.images.icon?.file ? getImagePreviewUrl(currentPass.images.icon as ProcessedImage) : currentPass.images.icon?.x1} 
                              className="w-8 h-8 object-contain"
                            />
                            <span className="text-sm">{currentPass.images.icon.file?.name || 'icon.png'}</span>
                            <div className="text-xs text-slate-400">1x/2x/3x</div>
                          </div>
                        ) : (
                          <div>
                            <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-slate-500">Click to upload icon</p>
                            <p className="text-xs text-slate-400 mt-1">Auto-generates 1x, 2x, 3x resolutions</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'relevance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Relevance Settings</h3>
                
                {/* Locations */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Locations</Label>
                    <p className="text-xs text-slate-500 mb-2">Show pass when near these locations</p>
                    <div className="space-y-2">
                      <Input 
                        placeholder="Enter address or coordinates"
                        className="h-9"
                      />
                      <Button size="sm" variant="outline" className="w-full">
                        Add Location
                      </Button>
                    </div>
                  </div>

                  {/* Relevant Date */}
                  <div>
                    <Label className="text-sm font-medium">Relevant Date</Label>
                    <p className="text-xs text-slate-500 mb-2">When this pass becomes relevant</p>
                    <Input 
                      type="datetime-local"
                      className="h-9"
                    />
                  </div>

                  {/* Max Distance */}
                  <div>
                    <Label className="text-sm font-medium">Max Distance (meters)</Label>
                    <p className="text-xs text-slate-500 mb-2">How close user needs to be</p>
                    <Input 
                      type="number"
                      placeholder="100"
                      className="h-9"
                    />
                  </div>

                  {/* Beacons */}
                  <div>
                    <Label className="text-sm font-medium">iBeacons</Label>
                    <p className="text-xs text-slate-500 mb-2">Bluetooth beacons for proximity</p>
                    <div className="space-y-2">
                      <Input 
                        placeholder="UUID"
                        className="h-9"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          placeholder="Major"
                          type="number"
                          className="h-9"
                        />
                        <Input 
                          placeholder="Minor"
                          type="number"
                          className="h-9"
                        />
                      </div>
                      <Button size="sm" variant="outline" className="w-full">
                        Add Beacon
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'placeholders' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Dynamic Placeholders</h3>
                
                <div className="space-y-4">
                  <Button 
                    className="w-full btn-primary"
                    onClick={() => {
                      setCurrentPass(prev => {
                        // Generate a unique placeholder name
                        const existingBackFields = prev.fields.filter(f => f.type === 'backFields')
                        const fieldNumber = existingBackFields.length + 1
                        const placeholderName = `CUSTOM_${fieldNumber}`
                        
                        const newField: PassField = {
                          id: `placeholder_${Date.now()}`,
                          type: 'backFields',
                          label: 'Custom Field',
                          value: `\${${placeholderName}}`,
                          key: `placeholder_${Date.now()}`
                        }
                        
                        return {
                          ...prev,
                          fields: [...prev.fields, newField]
                        }
                      })
                    }}
                  >
                    + Add New Placeholder
                  </Button>
                  
                  {/* Placeholder List - extract from all fields + barcode */}
                  <div className="space-y-2">
                    {(() => {
                      const placeholderRegex = /\$\{([A-Za-z0-9_]+)\}/g
                      const keys = new Set<string>()
                      // scan fields
                      currentPass.fields.forEach(f => {
                        const txt = `${f.label || ''} ${f.value || ''}`
                        let m
                        while ((m = placeholderRegex.exec(txt)) !== null) keys.add(m[1])
                      })
                      // scan barcode fields
                      currentPass.barcodes.forEach(b => {
                        const txt = `${b.message || ''} ${b.altText || ''}`
                        let m
                        while ((m = placeholderRegex.exec(txt)) !== null) keys.add(m[1])
                      })
                      const defs: PlaceholderDef[] = Array.from(keys).map(k => {
                        const existing = currentPass.placeholders?.find(p => p.key === k)
                        return existing || { key: k, defaultValue: '', valueType: 'Text' }
                      })
                      return defs.map(def => (
                        <div key={def.key} className="border border-slate-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded text-gray-700">${`{${def.key}}`}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const newName = prompt(`Rename placeholder "${def.key}" to:`, def.key)
                                  if (newName && newName !== def.key && newName.match(/^[A-Za-z0-9_]+$/)) {
                                    // Update all fields that use this placeholder
                                    setCurrentPass(prev => ({
                                      ...prev,
                                      fields: prev.fields.map(f => ({
                                        ...f,
                                        label: f.label?.replace(`\${${def.key}}`, `\${${newName}}`),
                                        value: f.value?.replace(`\${${def.key}}`, `\${${newName}}`)
                                      })),
                                      barcodes: prev.barcodes.map(b => ({
                                        ...b,
                                        message: b.message?.replace(`\${${def.key}}`, `\${${newName}}`),
                                        altText: b.altText?.replace(`\${${def.key}}`, `\${${newName}}`)
                                      })),
                                      placeholders: (prev.placeholders || []).map(p => 
                                        p.key === def.key ? { ...p, key: newName } : p
                                      )
                                    }))
                                  }
                                }}
                                className="text-gray-600 hover:text-gray-800 text-sm"
                                title="Rename placeholder"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete placeholder "\${${def.key}}" and all fields using it?`)) {
                                    // Remove the placeholder by removing all fields that use it
                                    setCurrentPass(prev => ({
                                      ...prev,
                                      fields: prev.fields.filter(f => {
                                        const txt = `${f.label || ''} ${f.value || ''}`
                                        return !txt.includes(`\${${def.key}}`)
                                      }),
                                      placeholders: (prev.placeholders || []).filter(p => p.key !== def.key)
                                    }))
                                  }
                                }}
                                className="text-red-500 hover:text-red-700 text-sm"
                                title="Delete placeholder"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Default Value</Label>
                              <Input
                                value={def.defaultValue}
                                onChange={(e) => {
                                  const next = (currentPass.placeholders || []).filter(p => p.key !== def.key)
                                  next.push({ ...def, defaultValue: e.target.value })
                                  setCurrentPass(prev => ({ ...prev, placeholders: next }))
                                }}
                                className="h-8 text-sm mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Type</Label>
                              <select
                                className="w-full h-8 px-2 border border-slate-300 rounded text-sm mt-1"
                                value={def.valueType}
                                onChange={(e) => {
                                  const next = (currentPass.placeholders || []).filter(p => p.key !== def.key)
                                  next.push({ ...def, valueType: e.target.value })
                                  setCurrentPass(prev => ({ ...prev, placeholders: next }))
                                }}
                              >
                                <option>Text</option>
                                <option>Number</option>
                                <option>Currency</option>
                                <option>Date</option>
                                <option>Email</option>
                                <option>Phone</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  )
}