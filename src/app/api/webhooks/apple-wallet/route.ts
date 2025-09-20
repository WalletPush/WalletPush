import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create service role client for webhook processing
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Apple Wallet Webhook Handler - Processes PassKit events and triggers automations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      event_type, 
      pass_type_identifier, 
      serial_number, 
      device_library_identifier,
      push_token,
      timestamp 
    } = body

    console.log(`🎯 Apple Wallet Webhook Event:`)
    console.log(`Event: ${event_type}`)
    console.log(`Pass Type: ${pass_type_identifier}`)
    console.log(`Serial: ${serial_number}`)
    console.log(`Device: ${device_library_identifier}`)
    console.log(`Timestamp: ${timestamp}`)

    // Use the admin client created at module level
    const supabase = supabaseAdmin

    // Find the template and business for this pass
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select(`
        id,
        program_id,
        pass_type_identifier,
        programs!inner (
          id,
          name,
          account_id
        )
      `)
      .eq('pass_type_identifier', pass_type_identifier)
      .single()

    if (templateError || !template) {
      console.error('❌ Template not found for pass type:', pass_type_identifier)
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const businessId = template.programs.account_id
    console.log(`🏢 Business ID: ${businessId}`)

    // Find automations that match this event type and template
    const { data: automations, error: automationsError } = await supabase
      .from('automations')
      .select('*')
      .eq('business_id', businessId)
      .eq('trigger_type', event_type)
      .eq('status', 'published')

    if (automationsError) {
      console.error('❌ Error fetching automations:', automationsError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    console.log(`🔍 Found ${automations?.length || 0} matching automations`)

    if (!automations || automations.length === 0) {
      console.log('ℹ️ No published automations found for this event')
      return NextResponse.json({ message: 'No automations to trigger' }, { status: 200 })
    }

    // Process each automation
    for (const automation of automations) {
      console.log(`🚀 Processing automation: ${automation.name} (${automation.id})`)

      try {
        // Create automation execution record
        const { data: execution, error: executionError } = await supabase
          .from('automation_executions')
          .insert({
            automation_id: automation.id,
            business_id: businessId,
            triggered_by: `${event_type}:${serial_number}`,
            status: 'running',
            logs: {
              trigger_data: {
                event_type,
                pass_type_identifier,
                serial_number,
                device_library_identifier,
                push_token,
                timestamp
              },
              started_at: new Date().toISOString()
            },
            executed_at: new Date().toISOString()
          })
          .select()
          .single()

        if (executionError) {
          console.error(`❌ Error creating execution record:`, executionError)
          continue
        }

        console.log(`📝 Created execution record: ${execution.id}`)

        // Process each action in the automation
        const actionsExecuted = []
        let hasError = false

        for (const action of automation.actions || []) {
          try {
            console.log(`⚡ Executing action: ${action.type}`)
            
            switch (action.type) {
              case 'send_push_notification':
                await executePushNotificationAction(action, {
                  pass_type_identifier,
                  serial_number,
                  template_id: template.id
                })
                break
              
              case 'send_email':
                await executeEmailAction(action, {
                  pass_type_identifier,
                  serial_number
                })
                break
              
              case 'update_custom_field':
                await executeUpdateFieldAction(action, {
                  pass_type_identifier,
                  serial_number
                })
                break
              
              case 'add_points':
                await executeAddPointsAction(action, {
                  pass_type_identifier,
                  serial_number
                })
                break
              
              default:
                console.log(`⚠️ Unknown action type: ${action.type}`)
            }

            actionsExecuted.push({
              type: action.type,
              status: 'completed',
              executed_at: new Date().toISOString()
            })

            console.log(`✅ Action ${action.type} completed`)

          } catch (actionError) {
            console.error(`❌ Action ${action.type} failed:`, actionError)
            actionsExecuted.push({
              type: action.type,
              status: 'failed',
              error: actionError.message,
              executed_at: new Date().toISOString()
            })
            hasError = true
          }
        }

        // Update execution record with results
        await supabase
          .from('automation_executions')
          .update({
            status: hasError ? 'failed' : 'completed',
            logs: {
              ...execution.logs,
              actions_executed: actionsExecuted,
              completed_at: new Date().toISOString(),
              error_message: hasError ? 'One or more actions failed' : null
            },
            executed_at: new Date().toISOString()
          })
          .eq('id', execution.id)

        // Update automation statistics
        await supabase
          .from('automations')
          .update({
            total_executions: (automation.total_executions || 0) + 1
          })
          .eq('id', automation.id)

        console.log(`✅ Automation ${automation.name} ${hasError ? 'completed with errors' : 'completed successfully'}`)

      } catch (automationError) {
        console.error(`❌ Automation ${automation.name} failed:`, automationError)
      }
    }

    return NextResponse.json({ 
      message: 'Webhook processed successfully',
      automations_triggered: automations.length
    })

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Action execution functions
async function executePushNotificationAction(action: any, context: any) {
  console.log(`📱 Sending push notification:`, action.config)
  
  // TODO: Implement actual push notification sending
  // For now, just log the action
  console.log(`📱 Push notification would be sent with message: ${action.config.message}`)
  
  // If there's a field update, handle that too
  if (action.config.field_key) {
    console.log(`📝 Would update field ${action.config.field_key} on pass ${context.serial_number}`)
  }
}

async function executeEmailAction(action: any, context: any) {
  console.log(`📧 Sending email:`, action.config)
  
  // TODO: Implement actual email sending
  console.log(`📧 Email would be sent with subject: ${action.config.subject}`)
}

async function executeUpdateFieldAction(action: any, context: any) {
  console.log(`📝 Updating custom field:`, action.config)
  
  // TODO: Implement field update logic
  console.log(`📝 Would update field ${action.config.field_key} to ${action.config.value}`)
}

async function executeAddPointsAction(action: any, context: any) {
  console.log(`🎯 Adding points:`, action.config)
  
  // TODO: Implement points system
  console.log(`🎯 Would add ${action.config.points} points for ${action.config.reason}`)
}
