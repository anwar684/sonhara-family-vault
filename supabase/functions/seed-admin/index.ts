import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEFAULT_ADMIN_EMAIL = 'admin@sonhara.com'
const DEFAULT_ADMIN_PASSWORD = 'Admin@123'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    console.log('Checking for default admin account...')

    // Check if admin already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingAdmin = existingUsers?.users?.find(u => u.email?.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase())

    if (existingAdmin) {
      // Check if user has admin role
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', existingAdmin.id)
        .maybeSingle()

      if (roleData?.role === 'admin') {
        console.log('Default admin already exists with admin role')
        return new Response(JSON.stringify({ 
          message: 'Default admin already exists',
          email: DEFAULT_ADMIN_EMAIL 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Update role to admin if not already
      await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: existingAdmin.id, role: 'admin' }, { onConflict: 'user_id' })

      console.log('Updated existing user to admin role')
      return new Response(JSON.stringify({ 
        message: 'Updated existing user to admin',
        email: DEFAULT_ADMIN_EMAIL 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create new admin user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'System Admin' }
    })

    if (createError) {
      console.error('Error creating admin:', createError)
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = newUser.user.id
    console.log(`Created admin user ${userId}`)

    // Create profile
    await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: userId,
        full_name: 'System Admin',
        email: DEFAULT_ADMIN_EMAIL
      }, { onConflict: 'user_id' })

    // Assign admin role
    await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: 'admin'
      }, { onConflict: 'user_id' })

    console.log('Default admin created successfully')

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Default admin created',
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASSWORD
    }), {
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
