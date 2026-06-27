import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type } = await req.json();

    if (type !== 'weekly' && type !== 'monthly') {
      return new Response(JSON.stringify({ error: 'Invalid report type' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Initialize Supabase Client with Service Role Key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is missing');
    }

    // 1. Fetch users who have opted in to this report type
    // In Supabase, user metadata is stored in auth.users, but we might only have access to raw_user_meta_data
    // Since we can't easily filter by jsonb using the JS client auth API, we use the custom RPC or query public.profiles if we have it
    // Wait, Expensio usually keeps profiles in `auth.users` raw_user_meta_data or a public profiles table?
    // Based on `auth.service.ts`, they seem to get metadata from `session.user.user_metadata`.
    // Let's fetch all users using the admin api and filter manually, or if they have a public.profiles table?
    // Let's use auth.admin.listUsers() 
    const { data: usersData, error: usersError } = await supabaseClient.auth.admin.listUsers();
    
    if (usersError) throw usersError;

    const usersToEmail = usersData.users.filter(user => {
      return user.user_metadata?.email_report_frequency === type;
    });

    if (usersToEmail.length === 0) {
      return new Response(JSON.stringify({ message: `No users subscribed to ${type} reports.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Calculate the date range based on type
    const now = new Date();
    let startDate = new Date();
    if (type === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    const emailsSent = [];

    // Process each user
    for (const user of usersToEmail) {
      const { data: expenses } = await supabaseClient
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString())
        .lte('date', now.toISOString());

      const totalSpent = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
      
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #000; padding: 20px;">
          <h1 style="font-weight: 900; margin-top: 0; font-size: 24px;">Expensio ${type === 'weekly' ? 'Weekly' : 'Monthly'} Report</h1>
          <p>Hello ${user.user_metadata?.full_name || 'User'},</p>
          <p>Here is your spending summary for the past ${type === 'weekly' ? '7 days' : 'month'}.</p>
          
          <div style="background-color: #000; color: #fff; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Total Spent</p>
            <h2 style="margin: 5px 0 0; font-size: 32px;">₹${totalSpent.toLocaleString('en-IN')}</h2>
          </div>
          
          <p style="font-size: 14px; color: #666;">Keep up the good financial habits!</p>
          <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
            You can change your report frequency in your Profile settings on Expensio.
          </p>
        </div>
      `;

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'Expensio <reports@expensio.app>', // Replace with verified domain
          to: user.email,
          subject: `Your Expensio ${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
          html: html,
        }),
      });

      if (emailRes.ok) {
        emailsSent.push(user.email);
      } else {
        const errText = await emailRes.text();
        console.error(`Failed to send email to ${user.email}: ${errText}`);
      }
    }

    return new Response(JSON.stringify({ message: 'Reports sent', count: emailsSent.length, emails: emailsSent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
