-- Gelecek Teslimat Tarihli 10 Adet Yapay Sipariş Oluşturma
-- Bu script, siparis tablosuna 10 yeni kayıt ve siparis_maliyet tablosuna ilgili maliyetleri ekler.

DO $$
DECLARE
    v_siparis_id INT;
    v_musteri_id INT;
    v_urun_id INT;
    v_siparis_tarihi DATE;
    v_teslim_tarihi DATE;
    v_durum TEXT;
    v_satis_fiyati DECIMAL;
    v_iscilik DECIMAL;
    i INT;
    v_durumlar TEXT[] := ARRAY['Beklemede', 'Onaylandı', 'Hazırlanıyor', 'Üretimde'];
BEGIN
    FOR i IN 1..10 LOOP
        -- Rastgele Müşteri (8000-8004 mevcut veriden varsayarak, yoksa uydurma)
        -- seed_data.sql'de musteri insert goremedim ama siparis insert'te 8000-8004 kullanilmis.
        v_musteri_id := 8000 + floor(random() * 5)::int;
        
        -- Rastgele Ürün (3012-3016)
        v_urun_id := 3012 + floor(random() * 5)::int;
        
        -- Sipariş Tarihi: Son 7 gün içinde
        v_siparis_tarihi := CURRENT_DATE - (floor(random() * 7) || ' days')::interval;
        
        -- Teslim Tarihi: Gelecek 15-45 gün içinde
        v_teslim_tarihi := CURRENT_DATE + (15 + floor(random() * 30) || ' days')::interval;
        
        -- Rastgele Durum
        v_durum := v_durumlar[1 + floor(random() * array_length(v_durumlar, 1))::int];
        
        -- Yeni ID oluştur (Max ID + 1 veya Sequence)
        -- Not: Identity column varsa direkt insert edilebilir ama burada manuel id verelim çakışmasın diye max'tan gidelim.
        SELECT COALESCE(MAX(siparis_id), 7000) + 1 INTO v_siparis_id FROM public.siparis;
        
        -- Sipariş Ekle
        INSERT INTO public.siparis (siparis_id, musteri_id, siparis_tarihi, teslim_tarihi, durum, urun_id)
        VALUES (v_siparis_id, v_musteri_id, v_siparis_tarihi, v_teslim_tarihi, v_durum, v_urun_id);
        
        -- Maliyet Verisi Ekle
        v_satis_fiyati := (random() * 5000 + 1000)::decimal(10,2);
        v_iscilik := (v_satis_fiyati * 0.2)::decimal(10,2); -- %20 işçilik
        
        INSERT INTO public.siparis_maliyet (
            siparis_id, 
            hammadde_maliyeti, 
            iscilik_maliyeti, 
            satis_fiyati
        ) VALUES (
            v_siparis_id,
            (v_satis_fiyati * 0.4)::decimal(10,2), -- %40 hammadde
            v_iscilik,
            v_satis_fiyati
        );
        
    END LOOP;
END $$;
