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
      return user.email && user.user_metadata?.email_report_frequency === type;
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

    const emailsSent: string[] = [];

    // Process each user
    for (const user of usersToEmail) {
      const { data: expenses } = await supabaseClient
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString())
        .lte('date', now.toISOString());

      const totalSpent = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
      
      // Calculate category breakdown
      const categoriesMap: Record<string, number> = {};
      const topExpenses = expenses ? [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5) : [];
      
      expenses?.forEach(e => {
        const cat = e.category || 'Other';
        categoriesMap[cat] = (categoriesMap[cat] || 0) + e.amount;
      });
      
      // Sort categories by amount
      const sortedCategories = Object.entries(categoriesMap).sort((a, b) => b[1] - a[1]);

      const getCategoryColorHEX = (category: string, index: number): string => {
        if (category === 'virtual-invest') return '#f59e0b';
        if (category.includes('(Group Split)')) return '#14b8a6';
        if (category.includes('(Split)')) return '#2563eb';
        if (category.includes('(Subscription)')) return '#ec4899';
        const palette = ['#000000', '#FF3366', '#33CC99', '#3366FF', '#FF9900', '#999999'];
        return palette[index % palette.length];
      };

      const categoriesHtml = sortedCategories.map(([cat, amt], idx) => {
        const color = getCategoryColorHEX(cat, idx);
        return `
          <div style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 14px; height: 14px; background-color: ${color}; border: 2px solid #000;"></div>
              <div style="font-weight: 800; font-size: 13px; text-transform: uppercase; margin-left: 10px;">${cat.replace('virtual-invest', 'Investment')}</div>
            </div>
            <div style="font-weight: 900; font-size: 14px;">₹${amt.toLocaleString('en-IN')}</div>
          </div>
        `;
      }).join('');

      const topExpensesHtml = topExpenses.map((exp) => {
        return `
          <div style="border-bottom: 2px solid #000; padding: 12px 0; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 800; font-size: 14px; text-transform: uppercase;">${exp.title || 'Expense'}</div>
              <div style="font-size: 11px; color: #666; font-weight: 700; text-transform: uppercase; margin-top: 4px;">${new Date(exp.date).toLocaleDateString('en-GB')}</div>
            </div>
            <div style="font-weight: 900; font-size: 15px;">₹${exp.amount.toLocaleString('en-IN')}</div>
          </div>
        `;
      }).join('');
      
      const html = `
        <div style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f0f0f0; padding: 20px;">
          <div style="background-color: #fff; border: 3px solid #000; padding: 30px; box-shadow: 6px 6px 0px #000;">
            
            <!-- Header -->
            <div style="border-bottom: 4px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
              <h1 style="font-weight: 900; margin: 0; font-size: 26px; text-transform: uppercase; letter-spacing: -1px;">Expensio ${type === 'weekly' ? 'Weekly' : 'Monthly'}</h1>
            </div>
            
            <p style="font-weight: 700; font-size: 16px;">Hello ${user.user_metadata?.full_name || 'User'},</p>
            <p style="font-size: 14px; font-weight: 500; color: #444; margin-bottom: 25px;">Here is your financial summary for the past ${type === 'weekly' ? '7 days' : 'month'}.</p>
            
            <!-- Total Banner -->
            <div style="background-color: #000; color: #fff; padding: 25px; text-align: center; margin: 25px 0; border: 3px solid #000; position: relative;">
              <div style="position: absolute; top: -10px; left: -10px; width: 20px; height: 20px; background-color: #C6F432; border: 2px solid #000;"></div>
              <p style="margin: 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #C6F432;">Total Spent</p>
              <h2 style="margin: 10px 0 0; font-size: 42px; font-weight: 900; letter-spacing: -2px;">₹${totalSpent.toLocaleString('en-IN')}</h2>
            </div>

            <!-- Categories -->
            ${sortedCategories.length > 0 ? `
            <div style="margin-top: 35px; background-color: #fafafa; border: 2px solid #000; padding: 20px;">
              <h3 style="font-weight: 900; text-transform: uppercase; border-bottom: 3px solid #000; padding-bottom: 8px; margin-top: 0; margin-bottom: 15px; font-size: 15px; letter-spacing: 1px;">Categories</h3>
              ${categoriesHtml}
            </div>
            ` : ''}

            <!-- Top Expenses -->
            ${topExpenses.length > 0 ? `
            <div style="margin-top: 35px;">
              <h3 style="font-weight: 900; text-transform: uppercase; border-bottom: 3px solid #000; padding-bottom: 8px; margin-bottom: 10px; font-size: 15px; letter-spacing: 1px;">Top Transactions</h3>
              ${topExpensesHtml}
            </div>
            ` : ''}
            
            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 25px; border-top: 4px solid #000; text-align: center;">
              <p style="font-weight: 900; font-size: 15px; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px;">Keep tracking, stay wealthy.</p>
              <p style="font-size: 11px; font-weight: 600; color: #666;">Change your report frequency in your Profile settings.</p>
            </div>

          </div>
        </div>
      `;

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'Expensio <onboarding@resend.dev>', // Use onboarding@resend.dev for testing without a verified domain
          to: user.email!,
          subject: `Your Expensio ${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
          html: html,
        }),
      });

      if (emailRes.ok) {
        if (user.email) emailsSent.push(user.email);
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
