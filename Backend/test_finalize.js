require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase
      .from('password_reset_requests')
      .select(`
        id,
        student_id, 
        status, 
        students (
          user_id,
          users (auth_id)
        )
      `)
      .limit(1);
      
  console.dir(data, { depth: null });
  console.error(error);
}
test();
