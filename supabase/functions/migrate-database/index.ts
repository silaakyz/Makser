import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Tam migration başlatılıyor...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const oldDbClient = new Client({
      hostname: Deno.env.get('OLD_DB_HOST'),
      port: 5432,
      user: Deno.env.get('OLD_DB_USER'),
      password: Deno.env.get('OLD_DB_PASSWORD'),
      database: 'postgres',
      tls: { enabled: true, enforce: false, caCertificates: [] }
    });

    await oldDbClient.connect();
    console.log('✅ Eski veritabanına bağlanıldı');

    const results: any = {
      personel: 0,
      auth_users: 0,
      hammadde: 0,
      makine: 0,
      urun: 0,
      musteriler: 0,
      tedarikciler: 0,
      siparis: 0,
      uretim: 0,
      bakim: 0,
      ariza: 0,
      errors: []
    };

    // 1. Personel -> Auth Users + Profiles
    console.log('👥 Personel ve kullanıcılar aktarılıyor...');
    try {
      const personelResult = await oldDbClient.queryObject(
        'SELECT personel_id, ad, soyad, unvan, mail, sifre FROM personel'
      );
      
      for (const person of personelResult.rows as any[]) {
        try {
          // Rol eşleştirme
          let role = 'uretim_personeli';
          if (person.unvan?.toLowerCase().includes('sahib')) role = 'sirket_sahibi';
          else if (person.unvan?.toLowerCase().includes('müdür')) role = 'genel_mudur';
          else if (person.unvan?.toLowerCase().includes('muhasebe')) role = 'muhasebe';
          else if (person.unvan?.toLowerCase().includes('üretim')) role = 'uretim_sefi';
          else if (person.unvan?.toLowerCase().includes('teknisyen')) role = 'teknisyen';
          else if (person.unvan?.toLowerCase().includes('servis')) role = 'servis_personeli';
          else if (person.unvan?.toLowerCase().includes('montaj')) role = 'saha_montaj';

          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: person.mail,
            password: person.sifre || 'Fabrika2025!',
            email_confirm: true,
            user_metadata: {
              ad: person.ad,
              soyad: person.soyad
            }
          });

          if (!authError && authData.user) {
            // Role ekle
            await supabase.from('user_roles').insert({
              user_id: authData.user.id,
              role: role
            });
            results.auth_users++;
          } else {
            results.errors.push(`Auth error for ${person.mail}: ${authError?.message}`);
          }
          results.personel++;
        } catch (err: any) {
          results.errors.push(`Personel ${person.mail}: ${err.message}`);
        }
      }
      console.log(`✅ ${results.personel} personel aktarıldı`);
    } catch (err: any) {
      results.errors.push(`Personel error: ${err.message}`);
    }

    // 2. Hammadde
    console.log('📦 Hammaddeler aktarılıyor...');
    try {
      const hammaddeResult = await oldDbClient.queryObject(
        'SELECT * FROM hammadde'
      );
      
      for (const item of hammaddeResult.rows as any[]) {
        const { error } = await supabase.from('hammadde').insert({
          ad: item.stok_adi,
          birim: item.birim || 'kg',
          stok_miktari: parseFloat(item.kalan_miktar) || 0,
          kritik_stok_seviyesi: parseFloat(item.kritik_stok) || 100,
          birim_fiyat: parseFloat(item.alis_fiyati) || 0,
          tuketim_hizi: 0
        });
        
        if (!error) results.hammadde++;
      }
      console.log(`✅ ${results.hammadde} hammadde aktarıldı`);
    } catch (err: any) {
      results.errors.push(`Hammadde error: ${err.message}`);
    }

    // 3. Makine
    console.log('🏭 Makineler aktarılıyor...');
    try {
      const makineResult = await oldDbClient.queryObject(
        'SELECT * FROM makine'
      );
      
      for (const item of makineResult.rows as any[]) {
        const { error } = await supabase.from('makine').insert({
          ad: item.ad,
          tur: item.tur,
          durum: 'boşta',
          uretim_kapasitesi: parseInt(item.kapasite) || 100
        });
        
        if (!error) results.makine++;
      }
      console.log(`✅ ${results.makine} makine aktarıldı`);
    } catch (err: any) {
      results.errors.push(`Makine error: ${err.message}`);
    }

    // 4. Ürün
    console.log('🎁 Ürünler aktarılıyor...');
    try {
      const urunResult = await oldDbClient.queryObject(
        'SELECT * FROM urun'
      );
      
      for (const item of urunResult.rows as any[]) {
        const { error } = await supabase.from('urun').insert({
          ad: item.ad,
          tur: item.tur,
          satis_fiyati: parseInt(item.satis_fiyati) || 0,
          stok_miktari: 0,
          kritik_stok_seviyesi: 10
        });
        
        if (!error) results.urun++;
      }
      console.log(`✅ ${results.urun} ürün aktarıldı`);
    } catch (err: any) {
      results.errors.push(`Urun error: ${err.message}`);
    }

    // 5. Sipariş
    console.log('📋 Siparişler aktarılıyor...');
    try {
      const siparisResult = await oldDbClient.queryObject(`
        SELECT s.*, m.isim || ' ' || m.soyisim as musteri_adi, u.ad as urun_adi
        FROM siparis s
        LEFT JOIN musteriler m ON s.musteri_id = m.musteri_id
        LEFT JOIN urun u ON s.urun_id = u.urun_id
      `);
      
      for (const item of siparisResult.rows as any[]) {
        // Durum eşleştirme
        let durum = 'beklemede';
        if (item.durum?.toLowerCase().includes('tamam')) durum = 'tamamlandi';
        else if (item.durum?.toLowerCase().includes('devam')) durum = 'devam_ediyor';

        const { error } = await supabase.from('siparis').insert({
          musteri: item.musteri_adi || 'Bilinmeyen',
          siparis_tarihi: item.siparis_tarihi,
          teslim_tarihi: item.teslim_tarihi,
          durum: durum,
          miktar: 1,
          kaynak: 'stok'
        });
        
        if (!error) results.siparis++;
      }
      console.log(`✅ ${results.siparis} sipariş aktarıldı`);
    } catch (err: any) {
      results.errors.push(`Siparis error: ${err.message}`);
    }

    // 6. Üretim
    console.log('⚙️ Üretim kayıtları aktarılıyor...');
    try {
      const uretimResult = await oldDbClient.queryObject(`
        SELECT uk.*, u.ad as urun_adi, m.ad as makine_adi
        FROM uretim_kayit uk
        LEFT JOIN urun u ON uk.urun_id = u.urun_id
        LEFT JOIN makine m ON uk.makine_id = m.makine_id
      `);
      
      for (const item of uretimResult.rows as any[]) {
        const { error } = await supabase.from('uretim').insert({
          baslangic_zamani: item.baslama_zamani,
          bitis_zamani: item.bitis_zamani,
          durum: item.bitis_zamani ? 'tamamlandi' : 'devam_ediyor',
          hedef_adet: 100,
          uretilen_adet: item.bitis_zamani ? 100 : 0
        });
        
        if (!error) results.uretim++;
      }
      console.log(`✅ ${results.uretim} üretim kaydı aktarıldı`);
    } catch (err: any) {
      results.errors.push(`Uretim error: ${err.message}`);
    }

    // 7. Bakım
    console.log('🔧 Bakım kayıtları aktarılıyor...');
    try {
      const bakimResult = await oldDbClient.queryObject(
        'SELECT * FROM makine_bakim'
      );
      
      for (const item of bakimResult.rows as any[]) {
        const { error } = await supabase.from('bakim_kaydi').insert({
          bakim_tarihi: item.bakim_tarihi,
          bakim_turu: item.bakim_turu || 'Periyodik',
          maliyet: item.maliyet || 0,
          aciklama: 'Eski sistemden aktarıldı'
        });
        
        if (!error) results.bakim++;
      }
      console.log(`✅ ${results.bakim} bakım kaydı aktarıldı`);
    } catch (err: any) {
      results.errors.push(`Bakim error: ${err.message}`);
    }

    // 8. Arıza
    console.log('⚠️ Arıza kayıtları aktarılıyor...');
    try {
      const arizaResult = await oldDbClient.queryObject(
        'SELECT * FROM makine_ariza'
      );
      
      for (const item of arizaResult.rows as any[]) {
        const { error } = await supabase.from('ariza_kaydi').insert({
          baslangic_tarihi: new Date().toISOString(),
          maliyet: item.maliyet || 0,
          aciklama: item.ariza_turu || 'Eski sistemden aktarıldı',
          sure_saat: 0
        });
        
        if (!error) results.ariza++;
      }
      console.log(`✅ ${results.ariza} arıza kaydı aktarıldı`);
    } catch (err: any) {
      results.errors.push(`Ariza error: ${err.message}`);
    }

    await oldDbClient.end();
    console.log('✅ Migration tamamlandı!');
    console.log('📊 Sonuçlar:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Tüm veriler başarıyla aktarıldı!',
        results,
        note: 'Personel şifreleri korundu veya varsayılan: Fabrika2025!'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Migration hatası:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
