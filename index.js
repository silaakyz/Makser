require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 4000;

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL // Supabase -> Settings -> Database -> Connection string (service role user)
});

app.get('/schema', async (req, res) => {
  try {
    const sql = `
      select table_name, json_agg(row_to_json(cols)) as columns
      from (
        select table_name, column_name, data_type, is_nullable, ordinal_position
        from information_schema.columns
        where table_schema = 'public'
      ) cols
      group by table_name;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.listen(port, () => console.log(`http://localhost:${port}`));
