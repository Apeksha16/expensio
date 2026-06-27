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
        if (category === 'virtual-invest') return '#84CC16'; // Goals primary
        if (category.includes('(Group Split)') || category.includes('(Split)')) return '#06B6D4'; // Splits primary
        if (category.includes('(Subscription)')) return '#8B5CF6'; // Subs primary
        const palette = ['#EF4444', '#10B981', '#F59E0B', '#92400E', '#EC4899', '#6B7280']; // Expense, Budget, Friends, Ledger, Reports, Profile
        return palette[index % palette.length];
      };

      const categoriesHtml = sortedCategories.map(([cat, amt], idx) => {
        const color = getCategoryColorHEX(cat, idx);
        return `
          <div style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; background-color: #ffffff; padding: 12px; border-radius: 8px; border-left: 4px solid ${color}; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 12px; height: 12px; background-color: ${color}; border-radius: 50%;"></div>
              <div style="font-weight: 700; font-size: 14px; color: #1f2937;">${cat.replace('virtual-invest', 'Investment')}</div>
            </div>
            <div style="font-weight: 800; font-size: 15px; color: #111827;">₹${amt.toLocaleString('en-IN')}</div>
          </div>
        `;
      }).join('');

      const topExpensesHtml = topExpenses.map((exp) => {
        const color = getCategoryColorHEX(exp.category || 'Other', 0);
        return `
          <div style="border-bottom: 1px solid #e5e7eb; padding: 16px 0; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 700; font-size: 15px; color: #111827; margin-bottom: 4px;">${exp.title || 'Expense'}</div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 11px; font-weight: 600; color: ${color}; background-color: ${color}20; padding: 2px 8px; border-radius: 12px;">${exp.category || 'Other'}</span>
                <span style="font-size: 11px; color: #6b7280; font-weight: 500;">${new Date(exp.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
            <div style="font-weight: 800; font-size: 16px; color: #111827;">₹${exp.amount.toLocaleString('en-IN')}</div>
          </div>
        `;
      }).join('');
      
      const reportColor = '#EC4899'; // Reports module primary color
      const html = `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 32px 16px;">
          <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, ${reportColor}, #BE185D); padding: 40px 32px; text-align: center; color: white;">
              <h1 style="font-weight: 800; margin: 0; font-size: 28px; letter-spacing: -0.5px;">Expensio</h1>
              <p style="margin: 8px 0 0; font-size: 15px; font-weight: 500; opacity: 0.9;">Your ${type === 'weekly' ? 'Weekly' : 'Monthly'} Financial Report</p>
            </div>
            
            <div style="padding: 32px;">
              <p style="font-weight: 600; font-size: 18px; color: #111827; margin-top: 0;">Hello ${user.user_metadata?.full_name || 'there'},</p>
              <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 32px;">Here is your financial summary and spending insights for the past ${type === 'weekly' ? '7 days' : 'month'}. Keeping track of your expenses is the first step to financial freedom.</p>
              
              <!-- Total Banner -->
              <div style="background: linear-gradient(to right, #111827, #374151); color: white; border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <p style="margin: 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #9ca3af;">Total Spent</p>
                <h2 style="margin: 12px 0 0; font-size: 48px; font-weight: 800; letter-spacing: -1.5px; color: #10B981;">₹${totalSpent.toLocaleString('en-IN')}</h2>
              </div>

              <!-- Categories -->
              ${sortedCategories.length > 0 ? `
              <div style="margin-bottom: 32px;">
                <h3 style="font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px; font-size: 18px; display: flex; align-items: center; gap: 8px;">
                  <span style="display: inline-block; width: 4px; height: 18px; background-color: ${reportColor}; border-radius: 4px;"></span>
                  Category Breakdown
                </h3>
                <div style="background-color: #f3f4f6; padding: 16px; border-radius: 12px;">
                  ${categoriesHtml}
                </div>
              </div>
              ` : ''}

              <!-- Top Expenses -->
              ${topExpenses.length > 0 ? `
              <div>
                <h3 style="font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 8px; font-size: 18px; display: flex; align-items: center; gap: 8px;">
                  <span style="display: inline-block; width: 4px; height: 18px; background-color: ${reportColor}; border-radius: 4px;"></span>
                  Top Transactions
                </h3>
                <div>
                  ${topExpensesHtml}
                </div>
              </div>
              ` : ''}
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="font-weight: 700; font-size: 14px; color: #111827; margin: 0 0 8px;">Keep tracking, stay wealthy.</p>
              <p style="font-size: 12px; font-weight: 500; color: #6b7280; margin: 0;">Sent automatically by Expensio. You can change your report frequency in your Profile settings.</p>
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
