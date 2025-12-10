import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const now = new Date()
    const currentDay = now.getDate()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    
    console.log(`Running pending payment generation for ${currentMonth}, day ${currentDay}`)

    // Only generate pending payments if we're past the 10th
    if (currentDay <= 10) {
      console.log('Not past the 10th yet, skipping pending payment generation')
      return new Response(
        JSON.stringify({ message: 'Not past the 10th yet, no pending payments generated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all active members
    const { data: members, error: membersError } = await supabase
      .from('family_members')
      .select('id, name, takaful_amount, plus_amount, takaful_joined_date, plus_joined_date')
      .eq('status', 'active')

    if (membersError) {
      console.error('Error fetching members:', membersError)
      throw membersError
    }

    console.log(`Found ${members?.length || 0} active members`)

    const pendingPaymentsToCreate: any[] = []

    for (const member of members || []) {
      // Check Takaful fund
      if (member.takaful_amount > 0 && member.takaful_joined_date) {
        const joinedDate = new Date(member.takaful_joined_date)
        const joinedMonth = `${joinedDate.getFullYear()}-${String(joinedDate.getMonth() + 1).padStart(2, '0')}`
        
        // Only create pending if member joined before or during current month
        if (joinedMonth <= currentMonth) {
          const { data: existingTakaful } = await supabase
            .from('payments')
            .select('id')
            .eq('member_id', member.id)
            .eq('fund_type', 'takaful')
            .eq('month', currentMonth)
            .maybeSingle()

          if (!existingTakaful) {
            pendingPaymentsToCreate.push({
              member_id: member.id,
              fund_type: 'takaful',
              month: currentMonth,
              amount: 0,
              due_amount: member.takaful_amount,
              status: 'pending',
              paid_date: null
            })
            console.log(`Creating pending Takaful payment for ${member.name}`)
          }
        }
      }

      // Check Plus fund
      if (member.plus_amount > 0 && member.plus_joined_date) {
        const joinedDate = new Date(member.plus_joined_date)
        const joinedMonth = `${joinedDate.getFullYear()}-${String(joinedDate.getMonth() + 1).padStart(2, '0')}`
        
        // Only create pending if member joined before or during current month
        if (joinedMonth <= currentMonth) {
          const { data: existingPlus } = await supabase
            .from('payments')
            .select('id')
            .eq('member_id', member.id)
            .eq('fund_type', 'plus')
            .eq('month', currentMonth)
            .maybeSingle()

          if (!existingPlus) {
            pendingPaymentsToCreate.push({
              member_id: member.id,
              fund_type: 'plus',
              month: currentMonth,
              amount: 0,
              due_amount: member.plus_amount,
              status: 'pending',
              paid_date: null
            })
            console.log(`Creating pending Plus payment for ${member.name}`)
          }
        }
      }
    }

    // Bulk insert pending payments
    if (pendingPaymentsToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('payments')
        .insert(pendingPaymentsToCreate)

      if (insertError) {
        console.error('Error inserting pending payments:', insertError)
        throw insertError
      }

      console.log(`Created ${pendingPaymentsToCreate.length} pending payments`)
    }

    return new Response(
      JSON.stringify({ 
        message: `Generated ${pendingPaymentsToCreate.length} pending payments for ${currentMonth}`,
        count: pendingPaymentsToCreate.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in generate-pending-payments:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
