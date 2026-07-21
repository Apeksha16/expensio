const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nwfwoowyjypbhmooqhfl.supabase.co';
const supabaseKey = 'sb_publishable_ehz7yW741rd-sItROd1tzA_HVXpjCKg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.functions.invoke('send-email-reports', {
    body: { type: 'test' }
  });
  console.log('Data:', data);
  console.log('Error:', error);
}

main();
