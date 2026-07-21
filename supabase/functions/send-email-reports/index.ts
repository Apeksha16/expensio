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

    if (type !== 'twice_daily' && type !== 'weekly' && type !== 'monthly' && type !== 'test') {
      return new Response(JSON.stringify({ error: 'Invalid report type' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is missing');
    }

    const { data: usersData, error: usersError } = await supabaseClient.auth.admin.listUsers();
    if (usersError) throw usersError;

    const usersToEmail = usersData.users.filter(user => {
      if (type === 'test') return true;
      return user.email && user.user_metadata?.email_report_frequency === type;
    });

    if (usersToEmail.length === 0) {
      return new Response(JSON.stringify({ message: `No users subscribed to ${type} reports.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const now = new Date();
    let startDate = new Date();

    if (type === 'twice_daily' || type === 'test') {
      // Past 12 hours window for 10 AM / 10 PM reports
      startDate = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    } else if (type === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    const emailsSent: string[] = [];

    for (const user of usersToEmail) {
      // 1. Personal Expenses added in timeframe
      const { data: expenses } = await supabaseClient
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString())
        .lte('date', now.toISOString());

      // 2. Split Expenses in timeframe (where user paid or is a split member)
      const { data: splitExpenses } = await supabaseClient
        .from('split_expenses')
        .select('*, split_members(*), split_groups(name)')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString());

      // Filter split expenses involving this user
      const userSplitExpenses = (splitExpenses || []).filter(se => {
        const isPayer = se.paid_by === user.id;
        const isMember = se.split_members?.some((m: any) => m.user_id === user.id);
        return isPayer || isMember;
      });

      const totalPersonal = expenses?.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;
      const totalSplits = userSplitExpenses.reduce((sum, se) => sum + (Number(se.total_amount) || 0), 0);
      const grandTotal = totalPersonal + totalSplits;

      const reportTitle = type === 'twice_daily' ? '12-Hour Expense & Split Summary' : (type === 'weekly' ? 'Weekly Report' : 'Monthly Report');
      const timeWindowText = type === 'twice_daily' ? 'past 12 hours (10 AM / 10 PM Report)' : (type === 'weekly' ? 'past 7 days' : 'past month');

      // Personal Expenses List HTML
      const personalHtml = (expenses || []).map(exp => `
        <div style="border-bottom: 1px solid #e5e7eb; padding: 12px 0; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 700; font-size: 14px; color: #111827;">${exp.title || 'Personal Expense'}</div>
            <div style="font-size: 11px; color: #6b7280;">${exp.category || 'General'} • Paid via ${exp.paid_via || 'UPI'}</div>
          </div>
          <div style="font-weight: 800; font-size: 15px; color: #111827;">₹${Number(exp.amount).toLocaleString('en-IN')}</div>
        </div>
      `).join('');

      // Split Expenses List HTML
      const splitHtml = userSplitExpenses.map(se => {
        const groupName = se.split_groups?.name || 'Friend Split';
        const isPayer = se.paid_by === user.id;
        const payerText = isPayer ? 'Paid by You' : 'Paid by Someone';
        const memberShare = se.split_members?.find((m: any) => m.user_id === user.id)?.amount || 0;
        
        return `
          <div style="border-bottom: 1px solid #e5e7eb; padding: 12px 0; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 700; font-size: 14px; color: #111827;">${se.description || 'Group Expense'}</div>
              <div style="font-size: 11px; color: #059669; font-weight: 600;">${groupName} • ${payerText}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 800; font-size: 15px; color: #111827;">₹${Number(se.total_amount).toLocaleString('en-IN')}</div>
              <div style="font-size: 10px; color: #6b7280;">Your Share: ₹${Number(memberShare).toLocaleString('en-IN')}</div>
            </div>
          </div>
        `;
      }).join('');

      const html = `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 32px 16px;">
          <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);">
            
            <div style="background: linear-gradient(135deg, #0284c7, #0369a1); padding: 36px 32px; text-align: center; color: white;">
              <h1 style="font-weight: 900; margin: 0; font-size: 28px; letter-spacing: -0.5px;">Expensio</h1>
              <p style="margin: 8px 0 0; font-size: 14px; font-weight: 600; opacity: 0.9;">${reportTitle}</p>
            </div>
            
            <div style="padding: 32px;">
              <p style="font-weight: 700; font-size: 18px; color: #111827; margin-top: 0;">Hello ${user.user_metadata?.full_name || 'there'},</p>
              <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">Here is your personal and split expense activity summary for the ${timeWindowText}:</p>
              
              <!-- Total Card -->
              <div style="background-color: #0f172a; color: white; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
                <p style="margin: 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8;">Total Spending Activity</p>
                <h2 style="margin: 8px 0 0; font-size: 40px; font-weight: 900; color: #38bdf8;">₹${grandTotal.toLocaleString('en-IN')}</h2>
              </div>

              <!-- Personal Expenses Section -->
              <div style="margin-bottom: 28px;">
                <h3 style="font-weight: 800; color: #111827; font-size: 15px; margin-bottom: 12px; text-transform: uppercase;">💳 Personal Expenses (${expenses?.length || 0})</h3>
                <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
                  ${personalHtml || '<div style="font-size: 13px; color: #94a3b8; text-align: center; padding: 8px 0;">No personal expenses added in this 12-hour window.</div>'}
                </div>
              </div>

              <!-- Split Expenses Section -->
              <div style="margin-bottom: 28px;">
                <h3 style="font-weight: 800; color: #111827; font-size: 15px; margin-bottom: 12px; text-transform: uppercase;">🤝 Split Expenses (${userSplitExpenses.length})</h3>
                <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
                  ${splitHtml || '<div style="font-size: 13px; color: #94a3b8; text-align: center; padding: 8px 0;">No split expenses involving you in this 12-hour window.</div>'}
                </div>
              </div>

            </div>
            
            <div style="background-color: #f1f5f9; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-weight: 700; font-size: 13px; color: #0f172a; margin: 0 0 4px;">Expensio Automated Reports</p>
              <p style="font-size: 11px; color: #64748b; margin: 0;">Sent automatically at 10:00 AM & 10:00 PM. Manage frequency in Profile Settings.</p>
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
          from: 'Expensio <onboarding@resend.dev>',
          to: user.email!,
          subject: `Expensio ${reportTitle} (₹${grandTotal.toLocaleString('en-IN')})`,
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
