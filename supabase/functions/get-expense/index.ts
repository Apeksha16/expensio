// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();

  const { data, error } = await supabase
    .from('expenses')
    .select(
      'id, amount, currency, description, category, date, account_id, is_split, payment_method, created_at, updated_at'
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payloadString = JSON.stringify({ success: true, data });

  const hashBuffer = await globalThis.crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(payloadString)
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b: number) => b.toString(16).padStart(2, '0')).join('');
  const etag = `W/"${hashHex}"`;

  const cacheHeaders = {
    'Cache-Control': 'private, max-age=30, stale-while-revalidate=120',
    ETag: etag,
  };

  if (req.headers.get('If-None-Match') === etag) {
    return new Response(null, { status: 304, headers: cacheHeaders });
  }

  return new Response(payloadString, {
    headers: { 'Content-Type': 'application/json', ...cacheHeaders },
  });
});
