import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Verify the requesting user is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(JSON.stringify({ error: 'No authorization header. Please login first.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !requestingUser) {
      console.error('Auth error:', authError?.message || 'User not found')
      return new Response(JSON.stringify({ error: 'Session expired. Please login again.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if requesting user is admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .single()

    if (roleData?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { email, password, memberId, fullName } = await req.json()

    if (!email || !password || !memberId) {
      return new Response(JSON.stringify({ error: 'Email, password and memberId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Creating account for member ${memberId} with email ${email}`)

    // Check if user already exists with this email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    let userId: string

    if (existingUser) {
      console.log(`User already exists with email ${email}, linking to member`)
      userId = existingUser.id

      // Check if this user is already linked to another member
      const { data: linkedMember } = await supabaseAdmin
        .from('family_members')
        .select('id, name')
        .eq('user_id', existingUser.id)
        .maybeSingle()

      if (linkedMember && linkedMember.id !== memberId) {
        return new Response(JSON.stringify({ 
          error: `This email is already linked to another member: ${linkedMember.name}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Update password if user exists
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: password
      })

      if (updateError) {
        console.error('Error updating password:', updateError)
      }
    } else {
      // Create new user account
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      })

      if (createError) {
        console.error('Error creating user:', createError)
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      userId = newUser.user.id
      console.log(`Created new user ${userId}`)

      // Create profile for new user
      await supabaseAdmin
        .from('profiles')
        .upsert({
          user_id: userId,
          full_name: fullName,
          email
        }, { onConflict: 'user_id' })

      // Assign member role for new user
      await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: 'member'
        }, { onConflict: 'user_id' })
    }

    // Link user to family member
    const { error: updateError } = await supabaseAdmin
      .from('family_members')
      .update({ user_id: userId, email })
      .eq('id', memberId)

    if (updateError) {
      console.error('Error linking member:', updateError)
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Successfully linked user ${userId} to member ${memberId}`)

    return new Response(JSON.stringify({ success: true, userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: unknown) {
    console.error('Unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
