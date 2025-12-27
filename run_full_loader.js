
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const { Client } = pg;

// Connection string from .env (hardcoded for now based on user's env)
const connectionString = "postgresql://postgres:mZtH2004hazal@db.zkjbbqqrjanlfpeybajt.supabase.co:5432/postgres";

// Supabase config for storage upload (Using Anon key is fine if bucket is public/allowed, but we just made it public)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zkjbbqqrjanlfpeybajt.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpramJicXFyamFubGZwZXliYWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTM1OTUsImV4cCI6MjA3OTY2OTU5NX0.kLhozeMLcLp9kInILAFZ9Qr14zTYSFiyFS8MBl16Y7I';

const filesToUpload = [
    { productId: 3015, filePath: 'C:/Users/akyzs/.gemini/antigravity/brain/53df13f5-df5b-4b09-b380-8185851afaef/uploaded_image_0_1766840051881.jpg' },
    { productId: 3016, filePath: 'C:/Users/akyzs/.gemini/antigravity/brain/53df13f5-df5b-4b09-b380-8185851afaef/uploaded_image_1_1766840051881.jpg' },
    { productId: 3014, filePath: 'C:/Users/akyzs/.gemini/antigravity/brain/53df13f5-df5b-4b09-b380-8185851afaef/uploaded_image_2_1766840051881.jpg' },
    { productId: 3012, filePath: 'C:/Users/akyzs/.gemini/antigravity/brain/53df13f5-df5b-4b09-b380-8185851afaef/uploaded_image_3_1766840051881.jpg' }
];

async function run() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false } // Required for Supabase connection
    });

    try {
        await client.connect();
        console.log("Veritabanına bağlanıldı.");

        // 1. Run Setup Base (Schema & Bucket)
        console.log("Şema ve Bucket ayarları yapılıyor...");
        const setupSql = fs.readFileSync('./setup_base.sql', 'utf8');
        await client.query(setupSql);
        console.log("Şema ve Bucket ayarları tamamlandı.");

        // 2. Run Seed Data
        console.log("Gerçek veriler yükleniyor...");
        const seedSql = fs.readFileSync('./seed_data.sql', 'utf8');
        await client.query(seedSql);
        console.log("Gerçek veriler yüklendi.");

        // 3. Upload Images
        console.log("Resimler yükleniyor...");
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        for (const item of filesToUpload) {
            if (!fs.existsSync(item.filePath)) {
                console.log(`Dosya atlandı (yok): ${item.filePath}`);
                continue;
            }

            const fileBuffer = fs.readFileSync(item.filePath);
            const fileName = path.basename(item.filePath);
            const storagePath = `${item.productId}/${Date.now()}-${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('urun-dokumanlari')
                .upload(storagePath, fileBuffer, { contentType: 'image/jpeg', upsert: true });

            if (uploadError) {
                console.error(`Upload hatası (${item.productId}):`, uploadError.message);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('urun-dokumanlari')
                .getPublicUrl(storagePath);

            // Update DB using SQL client (more reliable than RLS constrained JS client)
            await client.query('UPDATE public.urun SET teknik_dokuman_url = $1 WHERE urun_id = $2', [publicUrl, item.productId]);
            console.log(`Ürün ${item.productId} resmi güncellendi: ${publicUrl}`);
        }

        console.log("TÜM İŞLEMLER BAŞARIYLA TAMAMLANDI.");

    } catch (err) {
        console.error("HATA OLUŞTU:", err);
    } finally {
        await client.end();
    }
}

run();
