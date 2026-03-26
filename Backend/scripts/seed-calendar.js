const { createClient } = require('@supabase/supabase-client');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function seedCalendar() {
  console.log('🌱 Seeding calendar events...');

  // 1. Get the GIET college ID
  const { data: college, error: collegeError } = await supabase
    .from('colleges')
    .select('id')
    .eq('code', 'GIET')
    .single();

  if (collegeError || !college) {
    console.error('❌ Could not find GIET college. Run schema first.');
    return;
  }

  const collegeId = college.id;

  // 2. Define some events for the current and next month
  const today = new Date();
  const events = [
    {
      college_id: collegeId,
      title: 'Tuition Fee Installment 2',
      description: 'Second installment for the academic year 2024-25. Late fees apply after 5 PM.',
      event_date: new Date(today.getFullYear(), today.getMonth(), 15).toISOString().split('T')[0],
      amount: 25000,
      type: 'critical'
    },
    {
      college_id: collegeId,
      title: 'Bus Fee (Quarterly)',
      description: 'Quarterly bus transportation fee for day scholars.',
      event_date: new Date(today.getFullYear(), today.getMonth(), 28).toISOString().split('T')[0],
      amount: 5000,
      type: 'warning'
    },
    {
      college_id: collegeId,
      title: 'Semester Examination Fee',
      description: 'Examination fee for the upcoming odd semester exams.',
      event_date: new Date(today.getFullYear(), today.getMonth() + 1, 10).toISOString().split('T')[0],
      amount: 4500,
      type: 'info'
    }
  ];

  // 3. Insert events
  const { error: insertError } = await supabase
    .from('calendar_events')
    .insert(events);

  if (insertError) {
    console.error('❌ Error inserting events:', insertError);
  } else {
    console.log('✅ Successfully seeded 3 calendar events!');
  }
}

seedCalendar();
