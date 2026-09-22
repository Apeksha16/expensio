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

      const daysInWindow = type === 'twice_daily' || type === 'test' ? 0.5 : (type === 'weekly' ? 7 : 30);
      const dailyAverage = grandTotal / Math.max(1, daysInWindow);
      
      const largestPersonal = expenses?.reduce((max, e) => Math.max(max, Number(e.amount) || 0), 0) || 0;
      const largestSplit = userSplitExpenses.reduce((max, se) => Math.max(max, Number(se.total_amount) || 0), 0);
      const largestSpend = Math.max(largestPersonal, largestSplit);

      const categoryTotals: Record<string, number> = {};
      expenses?.forEach(e => {
        const cat = e.category || 'General';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(e.amount) || 0);
      });
      userSplitExpenses.forEach(se => {
        categoryTotals['Split'] = (categoryTotals['Split'] || 0) + (Number(se.total_amount) || 0);
      });
      let highestCategory = 'None';
      let highestCatAmount = 0;
      Object.entries(categoryTotals).forEach(([cat, amt]) => {
        if (amt > highestCatAmount) {
          highestCatAmount = amt;
          highestCategory = cat;
        }
      });

      const paymentTotals: Record<string, number> = {};
      expenses?.forEach(e => {
        const p = e.paid_via || 'UPI';
        paymentTotals[p] = (paymentTotals[p] || 0) + (Number(e.amount) || 0);
      });
      let topPaymentMethod = 'None';
      let highestPayAmount = 0;
      Object.entries(paymentTotals).forEach(([p, amt]) => {
        if (amt > highestPayAmount) {
          highestPayAmount = amt;
          topPaymentMethod = p;
        }
      });

      const totalTransactions = (expenses?.length || 0) + userSplitExpenses.length;

      const reportTitle = type === 'twice_daily' ? '12-Hour Expense & Split Summary' : (type === 'weekly' ? 'Weekly Report' : 'Monthly Report');
      const timeWindowText = type === 'twice_daily' || type === 'test' ? 'past 12 hours (10 AM / 10 PM Report)' : (type === 'weekly' ? 'past 7 days' : 'past month');

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
            
            <div style="border-bottom: 1px solid #e5e7eb; padding: 32px; text-align: left; background-color: #FAFAFA;">
              <h1 style="font-weight: 700; margin: 0; font-size: 24px; color: #111827;">Expensio Report</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Generated for: ${timeWindowText}</p>
            </div>
            
            <div style="padding: 32px; background-color: #FAFAFA;">
              
              <!-- Total Card -->
              <div style="background-color: #e11d48; color: white; border-radius: 24px; padding: 24px; margin-bottom: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                <p style="margin: 0; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.8); margin-bottom: 8px;">Total Spent</p>
                <h2 style="margin: 0; font-size: 36px; font-weight: 700;">₹${grandTotal.toLocaleString('en-IN')}</h2>
              </div>

              <!-- 4 Insights boxes -->
              <div style="display: flex; flex-wrap: wrap; margin-bottom: 16px;">
                <div style="width: calc(50% - 8px); margin-right: 16px; margin-bottom: 16px; background-color: #ffffff; border-radius: 24px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); border: 1px solid #f3f4f6; box-sizing: border-box;">
                  <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 500; color: #6b7280;">Daily Average</p>
                  <p style="margin: 0; font-size: 20px; font-weight: 700; color: #111827;">₹${dailyAverage.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                </div>
                <div style="width: calc(50% - 8px); margin-bottom: 16px; background-color: #ffffff; border-radius: 24px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); border: 1px solid #f3f4f6; box-sizing: border-box;">
                  <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 500; color: #6b7280;">Largest Spend</p>
                  <p style="margin: 0; font-size: 20px; font-weight: 700; color: #111827;">₹${largestSpend.toLocaleString('en-IN')}</p>
                </div>
                <div style="width: calc(50% - 8px); margin-right: 16px; background-color: #ffffff; border-radius: 24px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); border: 1px solid #f3f4f6; box-sizing: border-box;">
                  <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 500; color: #6b7280;">Top Category</p>
                  <p style="margin: 0; font-size: 16px; font-weight: 700; color: #111827;">${highestCategory}</p>
                </div>
                <div style="width: calc(50% - 8px); background-color: #ffffff; border-radius: 24px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); border: 1px solid #f3f4f6; box-sizing: border-box;">
                  <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 500; color: #6b7280;">Top Payment</p>
                  <p style="margin: 0; font-size: 16px; font-weight: 700; color: #111827;">${topPaymentMethod}</p>
                </div>
              </div>

              <!-- Total Transactions -->
              <div style="background-color: #ffffff; border-radius: 24px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); border: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; font-weight: 500; color: #6b7280;">Total Transactions</p>
                <p style="margin: 0; font-size: 20px; font-weight: 700; color: #111827;">${totalTransactions}</p>
              </div>

              <!-- Personal Expenses Section -->
              <div style="margin-bottom: 28px; background-color: white; padding: 20px; border-radius: 16px; border: 1px solid #e5e7eb;">
                <h3 style="font-weight: 700; color: #111827; font-size: 16px; margin-top: 0; margin-bottom: 16px;">💳 Personal Expenses</h3>
                <div>
                  ${personalHtml || '<div style="font-size: 13px; color: #94a3b8; padding: 8px 0;">No personal expenses added in this period.</div>'}
                </div>
              </div>

              <!-- Split Expenses Section -->
              <div style="margin-bottom: 12px; background-color: white; padding: 20px; border-radius: 16px; border: 1px solid #e5e7eb;">
                <h3 style="font-weight: 700; color: #111827; font-size: 16px; margin-top: 0; margin-bottom: 16px;">🤝 Split Expenses</h3>
                <div>
                  ${splitHtml || '<div style="font-size: 13px; color: #94a3b8; padding: 8px 0;">No split expenses involving you in this period.</div>'}
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
