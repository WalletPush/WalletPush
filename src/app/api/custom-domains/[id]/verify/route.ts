import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { vercel } from '@/lib/vercel';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const domainId = params.id;
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get domain info
    const { data: domain, error: fetchError } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('id', domainId)
      .single();

    if (fetchError || !domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    try {
      // Verify domain with Vercel
      console.log(`🔍 Verifying domain: ${domain.domain}`);
      const verificationResult = await vercel.verifyDomain(domain.domain);
      
      // Update domain status in database
      const updateData: any = {
        status: verificationResult.verified ? 'active' : 'pending_verification',
        ssl_status: verificationResult.verified ? 'active' : 'pending',
        verification_instructions: verificationResult.verification || null,
        updated_at: new Date().toISOString()
      };

      if (verificationResult.verified) {
        updateData.dns_verified_at = new Date().toISOString();
      }

      const { data: updatedDomain, error: updateError } = await supabase
        .from('custom_domains')
        .update(updateData)
        .eq('id', domainId)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update domain status:', updateError);
        return NextResponse.json({ error: 'Failed to update domain status' }, { status: 500 });
      }

      return NextResponse.json({
        ...updatedDomain,
        vercel_verified: verificationResult.verified,
        verification_instructions: verificationResult.verification
      });

    } catch (vercelError) {
      console.error('Vercel verification error:', vercelError);
      return NextResponse.json({ 
        error: 'Failed to verify domain with Vercel',
        details: vercelError instanceof Error ? vercelError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Domain verification API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}