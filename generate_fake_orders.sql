-- Gelecek Teslimat Tarihli 10 Adet Yapay Sipariş Oluşturma (Final Sadeleştirilmiş)
-- DÜZELTME: Olmayan / İstenmeyen sütunlar (email, telefon, adres) kaldırıldı.
-- Sadece İsim, Soyisim ve ID kullanılarak müşteri oluşturuluyor.

-- 1. Tablo Yapısını Güncelle
DO $$
BEGIN
    -- Sipariş Kısıtlamasını Kaldır
    ALTER TABLE public.siparis DROP CONSTRAINT IF EXISTS siparis_urun_id_key;

    -- 'miktar' sütunu ekle (Eğer yoksa)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'siparis' AND column_name = 'miktar') THEN
        ALTER TABLE public.siparis ADD COLUMN miktar INTEGER DEFAULT 1;
    END IF;

    -- 'kaynak' sütunu ekle (Eğer yoksa)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'siparis' AND column_name = 'kaynak') THEN
        ALTER TABLE public.siparis ADD COLUMN kaynak TEXT DEFAULT 'Doğrudan';
    END IF;

EXCEPTION
    WHEN OTHERS THEN RAISE NOTICE 'Schema update error: %', SQLERRM;
END $$;

-- 2. Sadece İsim ve Soyisim ile Müşteri Oluştur
-- Not: Eğer 'isim' veya 'soyisim' sütunları da yoksa (örn: sadece 'ad' varsa), lütfen belirtin.
INSERT INTO public.musteriler (musteri_id, isim, soyisim) VALUES
(9000, 'Ahmet', 'Yılmaz'),
(9001, 'Ayşe', 'Kaya'),
(9002, 'Mehmet', 'Demir'),
(9003, 'Fatma', 'Çelik'),
(9004, 'Mustafa', 'Şahin')
ON CONFLICT (musteri_id) DO NOTHING;

-- 3. Siparişleri Oluştur
DO $$
DECLARE
    v_siparis_id INT;
    v_musteri_id INT;
    v_urun_id INT;
    v_siparis_tarihi DATE;
    v_teslim_tarihi DATE;
    v_miktar INT;
    v_kaynak TEXT;
    v_satis_fiyati DECIMAL;
    v_kaynaklar TEXT[] := ARRAY['Web', 'Telefon', 'Referans', 'Bayi', 'Linkedin'];
    v_max_id INT;
    i INT;
BEGIN
    -- Max ID al
    SELECT COALESCE(MAX(siparis_id), 7000) INTO v_max_id FROM public.siparis;

    FOR i IN 1..10 LOOP
        v_max_id := v_max_id + 1;
        
        -- Veri Hazırlığı
        v_musteri_id := 9000 + floor(random() * 5)::int; -- 9000-9004 arası
        v_urun_id := 3012 + floor(random() * 5)::int;
        v_miktar := floor(random() * 5 + 1)::int; -- 1-5 arası miktar
        v_kaynak := v_kaynaklar[1 + floor(random() * array_length(v_kaynaklar, 1))::int];
        v_siparis_tarihi := CURRENT_DATE;
        v_teslim_tarihi := CURRENT_DATE + (10 + floor(random() * 30) || ' days')::interval;

        -- Sipariş Ekle
        INSERT INTO public.siparis (siparis_id, musteri_id, siparis_tarihi, teslim_tarihi, durum, urun_id, miktar, kaynak)
        VALUES (v_max_id, v_musteri_id, v_siparis_tarihi, v_teslim_tarihi, 'Beklemede', v_urun_id, v_miktar, v_kaynak);
        
        -- Maliyet Ekle
        v_satis_fiyati := (random() * 5000 + 1000)::decimal(10,2) * v_miktar;
        
        INSERT INTO public.siparis_maliyet (
            siparis_id, 
            hammadde_maliyeti, 
            iscilik_maliyeti, 
            satis_fiyati,
            toplam_maliyet,
            kar_zarar
        ) VALUES (
            v_max_id,
            (v_satis_fiyati * 0.4)::decimal(10,2),
            (v_satis_fiyati * 0.2)::decimal(10,2),
            v_satis_fiyati,
            (v_satis_fiyati * 0.6)::decimal(10,2),
            (v_satis_fiyati * 0.4)::decimal(10,2)
        );
        
    END LOOP;
END $$;
