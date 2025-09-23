'use client';

import React from 'react';
import Image from 'next/image';

interface BrandedHeaderProps {
  businessLogo?: string;
  businessName?: string;
  businessTagline?: string;
  profilePicture?: string;
  customerName?: string;
  showProfile?: boolean;
  theme?: string;
}

export function BrandedHeader({
  businessLogo,
  businessName = 'Your Business',
  businessTagline = 'Customer loyalty made simple',
  profilePicture,
  customerName = 'Customer',
  showProfile = true,
  theme = 'dark-midnight'
}: BrandedHeaderProps) {
  return (
    <header className="wp-header flex items-center justify-between p-4" style={{ backgroundColor: 'var(--wp-surface)', borderBottom: '1px solid var(--wp-border)' }}>
      {/* Left Side - Logo & Business Info */}
      <div className="flex items-center gap-4">
        {/* Business Logo */}
        <div className="business-logo flex-shrink-0">
          <Image
            src={businessLogo || '/images/logo_placeholder.png'}
            alt={`${businessName} logo`}
            width={120}
            height={50}
            className="object-contain"
            priority
          />
        </div>
        
        {/* Business Info */}
        <div className="business-info text-center">
          <h1 className="text-sm font-semibold leading-tight" style={{ color: 'var(--wp-text)' }}>
            {businessName}
          </h1>
          <p className="text-xs leading-tight" style={{ color: 'var(--wp-text-secondary)' }}>
            {businessTagline}
          </p>
        </div>
      </div>

      {/* Right Side - Profile */}
      {showProfile && (
        <div className="profile-section flex items-center gap-3">
          <div className="profile-info text-right">
            <p className="text-xs font-medium" style={{ color: 'var(--wp-text)' }}>
              {customerName}
            </p>
            <p className="text-xs" style={{ color: 'var(--wp-text-secondary)' }}>
              Member
            </p>
          </div>
          
          {/* Profile Picture */}
          <div className="profile-picture">
            <Image
              src={profilePicture || '/images/profile_placeholder.png'}
              alt={`${customerName} profile`}
              width={40}
              height={40}
              className="rounded-full object-cover border-2"
              style={{ borderColor: 'var(--wp-border)' }}
            />
          </div>
        </div>
      )}
    </header>
  );
}
