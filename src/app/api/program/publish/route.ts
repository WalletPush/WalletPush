import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Publishing program configuration...');
    
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { programId, draftSpec } = body;

    if (!programId || !draftSpec) {
      return NextResponse.json({ 
        error: 'Missing required fields: programId, draftSpec' 
      }, { status: 400 });
    }

    // 1. Get current program to verify ownership
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, name, account_id')
      .eq('id', programId)
      .single();

    if (programError || !program) {
      console.error('❌ Program not found:', programError);
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // 2. Verify user has access to this program via account_members table
    const { data: userMembership } = await supabase
      .from('account_members')
      .select('account_id, role')
      .eq('user_id', user.id)
      .eq('account_id', program.account_id)
      .single();

    console.log('🔐 Access check:', {
      userId: user.id,
      userEmail: user.email,
      userAccountId: userMembership?.account_id,
      userRole: userMembership?.role,
      programAccountId: program.account_id,
      programName: program.name
    });

    if (!userMembership || userMembership.account_id !== program.account_id) {
      console.error('❌ Access denied - Not a member of this account');
      return NextResponse.json({ 
        error: 'Access denied - Not authorized for this program',
        debug: {
          userAccountId: userMembership?.account_id,
          programAccountId: program.account_id,
          userRole: userMembership?.role
        }
      }, { status: 403 });
    }

    // Check if user has permission to publish (Owner or Admin) - case insensitive
    const allowedRoles = ['owner', 'admin', 'Owner', 'Admin'];
    if (!allowedRoles.includes(userMembership.role)) {
      console.error('❌ Access denied - Insufficient permissions');
      return NextResponse.json({ 
        error: 'Access denied - Insufficient permissions to publish',
        debug: {
          userRole: userMembership.role,
          allowedRoles: allowedRoles
        }
      }, { status: 403 });
    }

    // 3. Create new program version
    const version = Math.floor(Date.now() / 1000); // Unix timestamp as version
    
    const { data: newVersion, error: versionError } = await supabase
      .from('program_versions')
      .insert({
        program_id: programId,
        version: version,
        spec_json: draftSpec, // This contains rules + ui_contract
        created_by: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (versionError) {
      console.error('❌ Failed to create program version:', versionError);
      return NextResponse.json({ 
        error: 'Failed to create program version' 
      }, { status: 500 });
    }

    // 4. Update program to point to the new current version
    console.log('🔄 Updating program current_version_id to:', newVersion.id)
    const { error: updateError } = await supabase
      .from('programs')
      .update({ 
        current_version_id: newVersion.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', programId);

    if (updateError) {
      console.error('❌ Failed to update program current version:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update program current version' 
      }, { status: 500 });
    }

    console.log('✅ Program configuration published successfully!');
    console.log(`📊 Program: ${program.name}`);
    console.log(`🔢 Version: ${version}`);
    console.log(`🆔 Version ID: ${newVersion.id}`);
    console.log('🔄 Program current_version_id updated to:', newVersion.id);

    // Verify the update worked
    const { data: updatedProgram } = await supabase
      .from('programs')
      .select('current_version_id')
      .eq('id', programId)
      .single();
    
    console.log('✅ Verified program current_version_id is now:', updatedProgram?.current_version_id);

    return NextResponse.json({
      success: true,
      version: newVersion,
      message: `Dashboard configuration published successfully for "${program.name}"`,
      currentVersionId: updatedProgram?.current_version_id
    });

  } catch (error) {
    console.error('❌ Publish API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
