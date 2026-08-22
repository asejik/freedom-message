require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.rpc('search_sermons', { query: 'faith' })
    .select('*, preachers!inner(*), series(*)');
  console.log('Error:', JSON.stringify(error, null, 2));
}
test();
