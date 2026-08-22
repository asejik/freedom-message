const fs = require('fs');
const dotenv = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(dotenv.split('\n').filter(l => l && !l.startsWith('#')).map(l => l.split('=')));
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

fetch(`${URL}/rest/v1/rpc/search_sermons?select=id`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': KEY,
    'Authorization': `Bearer ${KEY}`
  },
  body: JSON.stringify({ query: 'faith' })
}).then(async r => {
  console.log(r.status);
  console.log(await r.text());
}).catch(console.error);
