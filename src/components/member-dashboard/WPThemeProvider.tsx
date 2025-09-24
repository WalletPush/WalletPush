'use client'

import React, { createContext, useContext, ReactNode } from 'react'

export type WPTheme =
  | 'dark-midnight'
  | 'dark-plum'
  | 'dark-emerald'
  | 'light-classic'
  | 'brand-auto'
  | 'dark-ocean'
  | 'dark-ink'
  | 'dark-violet'
  | 'dark-charcoal'

interface WPThemeContextType {
  theme: WPTheme
  setTheme: (theme: WPTheme) => void
}

const WPThemeContext = createContext<WPThemeContextType | undefined>(undefined)

interface WPThemeProviderProps {
  children: ReactNode
  theme?: WPTheme
  onThemeChange?: (theme: WPTheme) => void
}

export function WPThemeProvider({ 
  children, 
  theme = 'dark-midnight',
  onThemeChange 
}: WPThemeProviderProps) {
  const setTheme = (newTheme: WPTheme) => {
    onThemeChange?.(newTheme)
  }

  return (
    <WPThemeContext.Provider value={{ theme, setTheme }}>
      <div className="wp-root" data-wp-theme={theme}>
        {children}
      </div>
    </WPThemeContext.Provider>
  )
}

export function useWPTheme() {
  const context = useContext(WPThemeContext)
  if (context === undefined) {
    throw new Error('useWPTheme must be used within a WPThemeProvider')
  }
  return context
}

// Theme definitions for use in CSS
export const WP_THEMES = {
  'dark-midnight': {
    bg: '#0f1419',
    surface: '#1a1f2e',
    surfaceHover: '#252a3a',
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    accent: '#8b5cf6',
    text: '#ffffff',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: '#334155',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    radius: '0.5rem',
    density: 'comfortable'
  },
  'dark-plum': {
    bg: '#1a0b1a',
    surface: '#2d1b2d',
    surfaceHover: '#3d2b3d',
    primary: '#a855f7',
    primaryHover: '#9333ea',
    accent: '#ec4899',
    text: '#ffffff',
    textSecondary: '#d8b4fe',
    textMuted: '#a78bfa',
    border: '#6b21a8',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    radius: '0.75rem',
    density: 'comfortable'
  },
  'dark-emerald': {
    bg: '#0a1b0f',
    surface: '#1a2e1f',
    surfaceHover: '#2a3e2f',
    primary: '#10b981',
    primaryHover: '#059669',
    accent: '#3b82f6',
    text: '#ffffff',
    textSecondary: '#a7f3d0',
    textMuted: '#6ee7b7',
    border: '#065f46',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    radius: '0.375rem',
    density: 'comfortable'
  },
  'light-classic': {
    bg: '#ffffff',
    surface: '#f8fafc',
    surfaceHover: '#f1f5f9',
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    accent: '#8b5cf6',
    text: '#1e293b',
    textSecondary: '#475569',
    textMuted: '#64748b',
    border: '#e2e8f0',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    radius: '0.5rem',
    density: 'comfortable'
  },
  'brand-auto': {
    // This will be dynamically generated from brand colors
    bg: 'var(--brand-bg, #0f1419)',
    surface: 'var(--brand-surface, #1a1f2e)',
    surfaceHover: 'var(--brand-surface-hover, #252a3a)',
    primary: 'var(--brand-primary, #3b82f6)',
    primaryHover: 'var(--brand-primary-hover, #2563eb)',
    accent: 'var(--brand-accent, #8b5cf6)',
    text: 'var(--brand-text, #ffffff)',
    textSecondary: 'var(--brand-text-secondary, #94a3b8)',
    textMuted: 'var(--brand-text-muted, #64748b)',
    border: 'var(--brand-border, #334155)',
    success: 'var(--brand-success, #10b981)',
    warning: 'var(--brand-warning, #f59e0b)',
    error: 'var(--brand-error, #ef4444)',
    radius: 'var(--brand-radius, 0.5rem)',
    density: 'var(--brand-density, comfortable)'
  }
} as const
