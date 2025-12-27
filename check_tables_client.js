import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modül uyumluluğu için
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase URL veya Key eksik!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Supabase Client ile (SADECE PROFILES) testi başlatıyorum...");
    console.log("URL:", supabaseUrl);

    const table = 'profiles';

    const { data, error } = await supabase.from(table).select('*').limit(1);

    if (error) {
        console.log(`[${table}] Hata: ${error.message} (Kod: ${error.code})`);
    } else {
        console.log(`[${table}] ✅ BULUNDU!`);
        if (data && data.length > 0) {
            console.log(`[${table}] Kolonlar:`, Object.keys(data[0]));
            console.log(`[${table}] Örnek Veri:`, JSON.stringify(data[0]));
        } else {
            console.log(`[${table}] Tablo boş.`);
        }
    }
}

test();
