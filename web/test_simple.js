const fs = require('fs');
const dotenv = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(dotenv.split('\n').filter(l => l && !l.startsWith('#')).map(l => l.split('=')));
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from('sermons')
    .select('id, title, preachers!inner(name)')
    .or(`title.ilike.%faith%,ai_summary.ilike.%faith%`)
    .limit(5);
  console.log('Error:', error);
  console.log('Data count:', data?.length);
}
test();
