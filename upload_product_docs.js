
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// .env dosyasından okumak yerine hardcode ediyorum çünkü script ortamında dotenv olmayabilir
// Kullanıcının .env dosyası açıktı ama en garantisi bu.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vcyymgawpffplchcaicv.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY_HERE'; // Kullanıcıdan alacağız veya .env okuyacağız

// Ürün ID'leri ve Dosya Yolları Eşleştirmesi (Sırasıyla)
// Kullanıcı: "kazan ürünlerini teknik özelliklerinde dosya yükle kısmı var. O kısma bunlar dosya olarak yüklenecek sırasıyla"
// Ürünler (seed_data.sql'den):
// 3015: kalorifer kazanları
// 3016: yağ tankları (krom ve çelik)
// 3014: merkezi sistem ısıtma cihazları
// 3012: ısı pompaları

// Resim dosya yolları (Brain'den workspace'e kopyalandığı varsayılıyor veya direkt brain path)
const filesToUpload = [
    { productId: 3015, filePath: 'C:/Users/akyzs/.gemini/antigravity/brain/53df13f5-df5b-4b09-b380-8185851afaef/uploaded_image_0_1766840051881.jpg' },
    { productId: 3016, filePath: 'C:/Users/akyzs/.gemini/antigravity/brain/53df13f5-df5b-4b09-b380-8185851afaef/uploaded_image_1_1766840051881.jpg' },
    { productId: 3014, filePath: 'C:/Users/akyzs/.gemini/antigravity/brain/53df13f5-df5b-4b09-b380-8185851afaef/uploaded_image_2_1766840051881.jpg' },
    { productId: 3012, filePath: 'C:/Users/akyzs/.gemini/antigravity/brain/53df13f5-df5b-4b09-b380-8185851afaef/uploaded_image_3_1766840051881.jpg' }
];

async function uploadImages() {
    // 1. Client oluştur (Anon key ile, policy izin veriyorsa. Vermiyorsa auth token gerekir ama fix_permissions ile açmış olabiliriz)
    // Not: Normalde service_role key önerilir ama elimizde yok.
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log('Upload işlemi başlıyor...');

    for (const item of filesToUpload) {
        try {
            console.log(`Ürün ${item.productId} için dosya yükleniyor: ${item.filePath}`);

            if (!fs.existsSync(item.filePath)) {
                console.error(`Dosya bulunamadı: ${item.filePath}`);
                continue;
            }

            const fileBuffer = fs.readFileSync(item.filePath);
            const fileName = path.basename(item.filePath);
            const storagePath = `${item.productId}/${Date.now()}-${fileName}`;

            // Bucket: urun-dokumanlari (CreateProductionDialog'da bu bucket kullanılmış)
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('urun-dokumanlari')
                .upload(storagePath, fileBuffer, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (uploadError) {
                // Bucket yoksa oluşturmayı deneyemeyiz (API ile bucket oluşturulmaz genelde), kullanıcıya manuel işlem gerekir
                console.error(`Upload hatası (${item.productId}):`, uploadError.message);
                continue;
            }

            // Public URL al
            const { data: publicUrlData } = supabase.storage
                .from('urun-dokumanlari')
                .getPublicUrl(storagePath);

            const publicUrl = publicUrlData.publicUrl;
            console.log(`Dosya yüklendi. URL: ${publicUrl}`);

            // DB güncelle
            const { error: updateError } = await supabase
                .from('urun')
                .update({ teknik_dokuman_url: publicUrl }) // Tabloda bu alan var mı kontrol etmeliyiz, yoksa resim_url olabilir. 
                // Kullanıcı "teknik özelliklerinde dosya yükle kısmı var" dedi, kodda "teknik_dokuman_url" kullanıyor.
                .eq('urun_id', item.productId); // urun_id column name

            if (updateError) {
                console.error(`DB Update hatası (${item.productId}):`, updateError.message);
            } else {
                console.log(`Ürün ${item.productId} başarıyla güncellendi.`);
            }

        } catch (err) {
            console.error('Beklenmeyen hata:', err);
        }
    }
    console.log('İşlem tamamlandı.');
}

// Env variable'ları okuma kısmı basitçe process.env'den (çalıştırma komutunda set edilecek)
uploadImages();
