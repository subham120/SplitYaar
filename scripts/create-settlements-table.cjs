const { neon } = require('@neondatabase/serverless');

async function migrate() {
  const sql = neon(process.env.DATABASE_URL);
  
  console.log('1. Creating settlements table...');
  await sql.query(`
    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      from_member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      to_member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      amount_paise INTEGER NOT NULL,
      date DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );
  `);
  
  await sql.query(`
    CREATE INDEX IF NOT EXISTS idx_settlements_trip_id ON settlements(trip_id);
  `);

  console.log('2. Finding and migrating any existing "Settlement:" rows from expenses table...');
  const settlementExpenses = await sql.query(`
    SELECT e.*, es.member_id as to_member_id 
    FROM expenses e
    JOIN expense_shares es ON es.expense_id = e.id
    WHERE e.description LIKE 'Settlement:%'
  `);

  console.log(`Found ${settlementExpenses.length} legacy settlement expenses.`);

  for (const exp of settlementExpenses) {
    console.log(`Migrating expense ${exp.id}: ${exp.description}`);
    await sql.query(
      `INSERT INTO settlements (id, trip_id, from_member_id, to_member_id, amount_paise, date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [
        exp.id,
        exp.trip_id,
        exp.paid_by_member_id,
        exp.to_member_id,
        exp.amount_paise,
        exp.date,
        exp.created_at,
      ]
    );

    // Delete from expenses so it no longer pollutes the expenses table
    await sql.query(`DELETE FROM expenses WHERE id = $1`, [exp.id]);
  }

  console.log('Migration completed successfully!');
}

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
