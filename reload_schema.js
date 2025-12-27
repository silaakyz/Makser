import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modül uyumluluğu için
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const { Client } = pg;

// DB_HOST contains the full connection string
const connectionString = process.env.DB_HOST;

if (!connectionString) {
    console.error("DB_HOST environment variable missing!");
    process.exit(1);
}

const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

async function reloadSchema() {
    try {
        console.log("Connecting to database...");
        await client.connect();

        console.log("Sending NOTIFY pgrst, 'reload config'...");
        await client.query("NOTIFY pgrst, 'reload config'");

        console.log("✅ Schema cache reload notification sent successfully!");

    } catch (err) {
        console.error("❌ Error reloading schema cache:", err);
    } finally {
        await client.end();
    }
}

reloadSchema();
