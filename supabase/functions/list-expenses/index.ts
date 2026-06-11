// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const offset = (page - 1) * limit;

  const { data, error } = await supabase
    .from('expenses')
    .select(
      'id, amount, currency, description, category, date, account_id, is_split, payment_method'
    )
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payloadString = JSON.stringify(data);

  const hashBuffer = await globalThis.crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(payloadString)
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b: number) => b.toString(16).padStart(2, '0')).join('');
  const etag = `W/"${hashHex}"`;

  const cacheHeaders = {
    'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=300',
    ETag: etag,
  };

  if (req.headers.get('If-None-Match') === etag) {
    return new Response(null, { status: 304, headers: cacheHeaders });
  }

  return new Response(payloadString, {
    headers: { 'Content-Type': 'application/json', ...cacheHeaders },
  });
});
