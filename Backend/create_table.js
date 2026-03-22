const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  const sql = fs.readFileSync(path.join(__dirname, 'sql', 'create_notifications.sql'), 'utf-8');
  console.log('Running SQL...');
  const { data, error } = await supabase.rpc('run_sql', { sql_query: sql });
  if (error) {
    console.error('RPC failed, trying raw query if possible...', error.message);
    // If we don't have run_sql RPC, we'll tell the user to run it in the Supabase Dashboard
    console.log('Alternatively, run this in your Supabase SQL Editor:\n', sql);
  } else {
    console.log('Success:', data);
  }
}

createTable();
