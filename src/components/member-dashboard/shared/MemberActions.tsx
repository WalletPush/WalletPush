'use client'

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  CheckCircleIcon, 
  PlusIcon, 
  GiftIcon, 
  CreditCardIcon,
  TicketIcon,
  ReceiptRefundIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ActionConfig {
  enabled: boolean;
  auto_approve: boolean;
  max_per_day?: number;
  max_amount?: number;
  cooldown_minutes?: number;
  requires_evidence?: boolean;
  requires_staff?: boolean;
}

interface MemberActionsProps {
  program_id: string;
  business_id: string;
  customer_id: string;
  actions_config: {
    // Legacy format support
    check_in?: ActionConfig;
    earn_points?: ActionConfig;
    redeem_offer?: ActionConfig;
    spend_value?: ActionConfig;
    ticket_use?: ActionConfig;
    receipt_credit?: ActionConfig;
    // New settings format
    enableCheckIn?: boolean;
    checkInAutoApprove?: boolean;
    checkInCooldown?: number;
    checkInPoints?: number;
    enableEarnPoints?: boolean;
    earnPointsAutoApprove?: boolean;
    earnPointsMaxPerDay?: number;
    enableRedeemOffer?: boolean;
    redeemOfferAutoApprove?: boolean;
    enableReceiptCredit?: boolean;
    receiptCreditAutoApprove?: boolean;
    buttonText?: string;
    variant?: string;
    size?: string;
  };
  pending_requests?: any[];
  business_name?: string; // Add business name prop
  onPointsUpdate?: () => Promise<any>; // Add refresh function prop
}

type ActionType = 'check_in' | 'earn_points' | 'redeem_offer' | 'spend_value' | 'ticket_use' | 'receipt_credit';

const ACTION_ICONS = {
  check_in: CheckCircleIcon,
  earn_points: PlusIcon,
  redeem_offer: GiftIcon,
  spend_value: CreditCardIcon,
  ticket_use: TicketIcon,
  receipt_credit: ReceiptRefundIcon,
};

const ACTION_LABELS: Record<ActionType, string> = {
  check_in: 'Check In',
  earn_points: 'Add Points',
  redeem_offer: 'Redeem Offer',
  spend_value: 'Spend Value',
  ticket_use: 'Use Ticket',
  receipt_credit: 'Receipt Credit',
};

export function MemberActions({ 
  program_id, 
  business_id, 
  customer_id, 
  actions_config = {},
  pending_requests = [],
  business_name,
  onPointsUpdate,
  isPreview = false
}: MemberActionsProps & { isPreview?: boolean }) {
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [currentTheme, setCurrentTheme] = useState('dark-midnight');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'pending'>('success');

  // Get the current theme from the closest wp-root parent
  useEffect(() => {
    const findTheme = () => {
      const wpRoot = document.querySelector('.wp-root[data-wp-theme]');
      const theme = wpRoot?.getAttribute('data-wp-theme') || 'dark-midnight';
      setCurrentTheme(theme);
    };
    
    findTheme();
    
    // Listen for theme changes
    const observer = new MutationObserver(findTheme);
    const wpRoot = document.querySelector('.wp-root[data-wp-theme]');
    if (wpRoot) {
      observer.observe(wpRoot, { attributes: true, attributeFilter: ['data-wp-theme'] });
    }
    
    return () => observer.disconnect();
  }, []);

  // DEBUG: Log what we're receiving
  console.log('🔍 MemberActions actions_config received:', JSON.stringify(actions_config, null, 2));
  
  // Get enabled actions based on settings structure (handle both old and new formats)
  const enabledActions: ActionType[] = [];
  const settings = actions_config as any; // Type assertion for settings access
  
  // Check for new format first, then fall back to old format
  if (settings.enableCheckIn || settings.check_in?.enabled) enabledActions.push('check_in');
  if (settings.enableEarnPoints || settings.earn_points?.enabled) enabledActions.push('earn_points');
  if (settings.enableRedeemOffer || settings.redeem_offer?.enabled) enabledActions.push('redeem_offer');
  if (settings.enableReceiptCredit || settings.receipt_credit?.enabled) enabledActions.push('receipt_credit');
  
  console.log('🔍 MemberActions enabledActions:', enabledActions);
  console.log('🔍 MemberActions backward compatibility check:', {
    checkInEnabled: settings.check_in?.enabled,
    earnPointsEnabled: settings.earn_points?.enabled,
    redeemOfferEnabled: settings.redeem_offer?.enabled
  });

  // Helper function to get action config from settings (handle both old and new formats)
  const getActionConfig = (action: ActionType) => {
    const settings = actions_config as any; // Type assertion for settings access
    switch (action) {
      case 'check_in':
        return {
          enabled: settings.enableCheckIn || settings.check_in?.enabled,
          auto_approve: settings.checkInAutoApprove || settings.check_in?.auto_approve,
          cooldown: settings.checkInCooldown || settings.check_in?.cooldown_minutes,
          points: settings.checkInPoints || settings.check_in?.points
        };
      case 'earn_points':
        return {
          enabled: settings.enableEarnPoints || settings.earn_points?.enabled,
          auto_approve: settings.earnPointsAutoApprove || settings.earn_points?.auto_approve,
          max_per_day: settings.earnPointsMaxPerDay || settings.earn_points?.max_per_day
        };
      case 'redeem_offer':
        return {
          enabled: settings.enableRedeemOffer || settings.redeem_offer?.enabled,
          auto_approve: settings.redeemOfferAutoApprove || settings.redeem_offer?.auto_approve
        };
      case 'receipt_credit':
        return {
          enabled: settings.enableReceiptCredit || settings.receipt_credit?.enabled,
          auto_approve: settings.receiptCreditAutoApprove || settings.receipt_credit?.auto_approve
        };
      default:
        return { enabled: false };
    }
  };

  const handleActionSelect = (action: ActionType) => {
    setSelectedAction(action);
    setMessage('');
  };

  const handleSubmitAction = async (actionData: any) => {
    if (!selectedAction) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      console.log('🚀 Submitting action request:', {
        business_id,
        program_id,
        customer_id,
        type: selectedAction,
        payload: actionData,
        idempotency_key: `${selectedAction}_${customer_id}_${Date.now()}`,
      });

      // Get the Supabase client to include auth headers
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/member-actions/request', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          business_id,
          program_id,
          customer_id,
          type: selectedAction,
          payload: actionData,
          idempotency_key: `${selectedAction}_${customer_id}_${Date.now()}`,
        })
      });

      console.log('📡 API Response status:', response.status);
      
      let result: any;
      try {
        result = await response.json();
        console.log('📋 API Response data:', result);
      } catch (parseError) {
        console.error('❌ Failed to parse response JSON:', parseError);
        setMessage('❌ Invalid response from server');
        return;
      }

      if (response.ok) {
        console.log('🎉 API Success! Result:', result);
        
        // Close modal immediately
        setIsModalOpen(false);
        setSelectedAction(null);
        setMessage('');
        
        // Show success toast with dynamic message
        if (result.status === 'auto_approved') {
          const pointsEarned = actionData.points || getActionConfig(selectedAction)?.points || 0;
          if (selectedAction === 'check_in') {
            setToastMessage(`🎉 Check-in Success! You earned ${pointsEarned} points.`);
          } else if (selectedAction === 'earn_points') {
            setToastMessage(`🎉 Points Added! You earned ${pointsEarned} points.`);
          } else {
            setToastMessage(`🎉 Action completed successfully! You earned ${pointsEarned} points.`);
          }
          setToastType('success');
        } else {
          if (selectedAction === 'earn_points') {
            setToastMessage(`📋 Your points request has been submitted for approval.`);
          } else if (selectedAction === 'check_in') {
            setToastMessage(`📋 Your check-in request has been submitted for approval.`);
          } else {
            setToastMessage(`📋 Your request has been submitted for approval.`);
          }
          setToastType('pending');
        }
        
        setShowToast(true);
        
        // Auto-hide toast after 4 seconds
        setTimeout(() => {
          setShowToast(false);
        }, 4000);
        
        // Refresh customer data for real-time updates
        console.log('🔍 Checking real-time update conditions:', {
          onPointsUpdate: !!onPointsUpdate,
          isPreview,
          resultStatus: result.status
        });
        
        if (onPointsUpdate && !isPreview) {
          console.log('✅ Starting real-time update timer...');
          setTimeout(async () => {
            console.log('🔄 Refreshing customer data for real-time update...');
            try {
              const updatedSummary = await onPointsUpdate();
              console.log('🔍 Updated summary received:', updatedSummary);
              console.log('🔍 Result status check:', result.status === 'auto_approved');
              
              if (updatedSummary && result.status === 'auto_approved') {
                // Show points update notification
                const newBalance = updatedSummary.points_balance || 0;
                console.log('🎉 Showing points update toast with balance:', newBalance);
                setToastMessage(`🎉 Your points have been updated! New balance: ${newBalance} points`);
                setToastType('success');
                setShowToast(true);
                
                // Auto-hide this toast too
                setTimeout(() => {
                  setShowToast(false);
                }, 4000);
              } else {
                console.log('❌ Not showing update toast:', {
                  hasUpdatedSummary: !!updatedSummary,
                  isAutoApproved: result.status === 'auto_approved',
                  resultStatus: result.status
                });
              }
            } catch (error) {
              console.error('❌ Error in real-time update:', error);
            }
          }, 1500); // Wait 1.5 seconds after first toast
        } else {
          console.log('❌ Real-time update skipped:', {
            hasOnPointsUpdate: !!onPointsUpdate,
            isPreview
          });
        }
        
      } else {
        console.error('❌ API Error:', result);
        setMessage(`❌ ${result.error || result.message || 'Request failed'}`);
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      setMessage('❌ Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (enabledActions.length === 0) {
    // Show a placeholder in preview mode
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Member Actions</h3>
        </div>
        <p className="text-[#C6C8CC] mb-4">
          Configure member actions in the settings to enable this component
        </p>
        <button
          disabled
          className="w-full py-3 px-4 bg-gray-600 text-gray-400 font-semibold rounded-lg opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Request Action (Configure First)
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white/5 border border-white/10 rounded-lg p-6 ${isPreview ? 'relative' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Member Actions</h3>
        {pending_requests.length > 0 && (
          <div className="flex items-center gap-1 text-yellow-400 text-sm">
            <ClockIcon className="w-4 h-4" />
            {pending_requests.length} pending
          </div>
        )}
      </div>
      
      <p className="text-[#C6C8CC] mb-4">
        Request actions from {business_name || 'your business'} - some may be approved instantly
      </p>

      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full py-3 px-4 font-semibold flex items-center justify-center gap-2 wp-button-primary"
      >
        <PlusIcon className="w-5 h-5" />
        {actions_config.buttonText || 'Request Action'}
      </button>

      {message && (
        <div className="mt-3 p-2 text-center text-sm">
          <span className={
            message.includes('✅') ? 'text-green-400' : 
            message.includes('⏳') ? 'text-yellow-400' : 
            'text-red-400'
          }>
            {message}
          </span>
        </div>
      )}

      {/* Action Selection Modal */}
      {isModalOpen && (
        <ActionModal
          enabledActions={enabledActions}
          actionsConfig={actions_config}
          getActionConfig={getActionConfig}
          selectedAction={selectedAction}
          onActionSelect={handleActionSelect}
          onSubmit={handleSubmitAction}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAction(null);
            setMessage('');
          }}
          isSubmitting={isSubmitting}
          isPreview={isPreview}
          currentTheme={currentTheme}
        />
      )}

      {/* Pending Requests */}
      {pending_requests.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <h4 className="text-sm font-medium text-white mb-2">Recent Requests</h4>
          <div className="space-y-2">
            {pending_requests.slice(0, 3).map((request) => (
              <div key={request.id} className="flex items-center justify-between text-sm">
                <span className="text-[#C6C8CC]">
                  {ACTION_LABELS[request.type as ActionType]}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  request.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className={`
            p-4 rounded-lg shadow-lg border backdrop-blur-sm transform transition-all duration-300
            ${toastType === 'success' ? 'bg-green-500/90 border-green-400 text-white' : 
              toastType === 'pending' ? 'bg-blue-500/90 border-blue-400 text-white' : 
              'bg-red-500/90 border-red-400 text-white'}
          `}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {toastType === 'success' ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : toastType === 'pending' ? (
                  <ClockIcon className="w-5 h-5" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{toastMessage}</p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="flex-shrink-0 text-white/80 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Action Modal Component
function ActionModal({ 
  enabledActions, 
  actionsConfig, 
  getActionConfig,
  selectedAction, 
  onActionSelect, 
  onSubmit, 
  onClose, 
  isSubmitting,
  isPreview = false,
  currentTheme = 'dark-midnight'
}: any) {
  const [formData, setFormData] = useState<any>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add points to payload for check_in actions
    const payload = { ...formData };
    if (selectedAction === 'check_in') {
      const actionConfig = getActionConfig(selectedAction);
      if (actionConfig?.points) {
        payload.points = actionConfig.points;
        console.log('🔍 Adding points to check_in payload:', actionConfig.points);
      }
    }
    
    onSubmit(payload);
  };

  return (
    <div className={`${isPreview ? 'absolute inset-0' : 'fixed inset-0'} flex items-center justify-center z-50 p-4`} style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
      <div 
        className={`wp-root p-4 w-full ${isPreview ? 'max-w-[320px]' : 'max-w-md'} h-auto overflow-hidden`}
        data-wp-theme={currentTheme}
        style={{
          backgroundColor: 'var(--wp-surface-elevated)',
          borderRadius: 'var(--wp-radius-lg)',
          border: '1px solid var(--wp-border)',
          boxShadow: 'var(--wp-shadow-lg)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold wp-text-primary">
            {selectedAction ? ACTION_LABELS[selectedAction as ActionType] : 'Select Action'}
          </h3>
          <button
            onClick={onClose}
            className="hover:opacity-80 transition-opacity wp-text-muted"
          >
            ✕
          </button>
        </div>

        {!selectedAction ? (
          // Action Selection
          <div className="grid grid-cols-2 gap-3">
            {enabledActions.map((action: ActionType) => {
              const Icon = ACTION_ICONS[action];
              const config = getActionConfig(action);
              
              return (
                <button
                  key={action}
                  onClick={() => onActionSelect(action)}
                  className="p-4 text-center wp-button-surface"
                >
                  <Icon className="w-8 h-8 mx-auto mb-2 wp-icon-primary" />
                  <div className="font-medium text-sm wp-text-primary">
                    {ACTION_LABELS[action as ActionType]}
                  </div>
                  {config?.auto_approve && (
                    <div className="text-xs mt-1 wp-icon-success">
                      Instant
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          // Action Form
          <form onSubmit={handleSubmit} className="space-y-4">
            <ActionForm
              action={selectedAction}
              config={actionsConfig[selectedAction]}
              formData={formData}
              setFormData={setFormData}
            />
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onActionSelect(null)}
                className="flex-1 py-2 px-4 wp-button-surface"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2 px-4 wp-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Dynamic Action Form Component
function ActionForm({ action, config, formData, setFormData }: any) {
  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  switch (action) {
    case 'check_in':
      return (
        <div className="space-y-3">
          <p className="text-[#C6C8CC] text-sm">
            Request a check-in at this location
          </p>
          {config?.requires_evidence && (
            <div>
              <label className="block text-white text-sm font-medium mb-1">
                Note (optional)
              </label>
              <textarea
                value={formData.note || ''}
                onChange={(e) => updateField('note', e.target.value)}
                className="w-full p-2 bg-white/5 border border-white/10 rounded text-white placeholder-gray-400"
                placeholder="Add any additional details..."
                rows={2}
              />
            </div>
          )}
        </div>
      );

    case 'earn_points':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-white text-sm font-medium mb-1">
              Points Amount
            </label>
            <input
              type="number"
              value={formData.points || ''}
              onChange={(e) => updateField('points', parseInt(e.target.value) || 0)}
              max={config?.max_amount || 1000}
              min={1}
              className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
              placeholder="Enter points to add"
              required
            />
            {config?.max_amount && (
              <p className="text-xs text-gray-400 mt-1">
                Maximum: {config.max_amount} points
              </p>
            )}
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-1">
              Reason
            </label>
            <input
              type="text"
              value={formData.reason || ''}
              onChange={(e) => updateField('reason', e.target.value)}
              className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
              placeholder="Why should you receive these points?"
              required
            />
          </div>
        </div>
      );

    case 'spend_value':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-white text-sm font-medium mb-1">
              Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount || ''}
              onChange={(e) => updateField('amount', parseFloat(e.target.value) || 0)}
              max={config?.max_amount || 500}
              min={0.01}
              className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
              placeholder="Enter amount to spend"
              required
            />
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
              placeholder="What are you purchasing?"
              required
            />
          </div>
        </div>
      );

    default:
      return (
        <div className="space-y-3">
          <p className="text-[#C6C8CC] text-sm">
            Request {ACTION_LABELS[action as ActionType]?.toLowerCase()} from the business
          </p>
          <div>
            <label className="block text-white text-sm font-medium mb-1">
              Note (optional)
            </label>
            <textarea
              value={formData.note || ''}
              onChange={(e) => updateField('note', e.target.value)}
              className="w-full p-2 bg-white/5 border border-white/10 rounded text-white placeholder-gray-400"
              placeholder="Add any details..."
              rows={2}
            />
          </div>
        </div>
      );
  }
}

