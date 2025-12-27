import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const client = new Client({
    connectionString: process.env.DB_HOST,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        // Tüm tabloları ve kolonları çek
        const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public'
    `);

        console.log("Tablolar:", tablesRes.rows.map(r => r.table_name));

        // Personel olabilecek tabloların kolonlarını çek
        for (const table of tablesRes.rows) {
            const tName = table.table_name;
            if (tName.includes('person') || tName.includes('user') || tName.includes('calisan') || tName.includes('profile')) {
                const cols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '${tName}'
         `);
                console.log(`\nTablo: ${tName}`);
                console.log(cols.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));
            }
        }

    } catch (err) {
        console.error("Hata:", err);
    } finally {
        await client.end();
    }
}

run();
