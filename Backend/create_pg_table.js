const { Client } = require('pg');
const fs = require('fs');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  });
  
  await client.connect();
  const sql = fs.readFileSync('./sql/create_notifications.sql', 'utf8');
  
  try {
    await client.query(sql);
    console.log('Successfully created notifications table.');
  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await client.end();
  }
}

main();
