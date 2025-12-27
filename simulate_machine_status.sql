-- Makine Durumlarını Simüle Et (Bakım, Arıza, Yaklaşan Bakım)
-- DÜZELTME: Eksik sütunları oluşturur.

DO $$
BEGIN
    -- 1. 'durum' sütunu ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'makine' AND column_name = 'durum') THEN
        ALTER TABLE public.makine ADD COLUMN durum text DEFAULT 'idle';
    END IF;

    -- 2. 'son_bakim_tarihi' sütunu ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'makine' AND column_name = 'son_bakim_tarihi') THEN
        ALTER TABLE public.makine ADD COLUMN son_bakim_tarihi date;
    END IF;

    -- 3. 'sonraki_bakim_tarihi' sütunu ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'makine' AND column_name = 'sonraki_bakim_tarihi') THEN
        ALTER TABLE public.makine ADD COLUMN sonraki_bakim_tarihi date;
    END IF;
END $$;

-- 2. Durumları Sıfırla
UPDATE public.makine SET durum = 'idle', sonraki_bakim_tarihi = NULL, son_bakim_tarihi = NULL;

-- 3. 2 Makineyi Bakıma Al (Maintenance)
-- ID: 5500, 5501
UPDATE public.makine 
SET durum = 'maintenance', 
    son_bakim_tarihi = CURRENT_DATE 
WHERE makine_id IN (5500, 5501);

-- 4. 3 Makineyi Arızalı Göster (Fault)
-- ID: 5502, 5503, 5504
UPDATE public.makine 
SET durum = 'fault' 
WHERE makine_id IN (5502, 5503, 5504);

-- 5. 4 Makinenin Yaklaşan Bakımı Var (Upcoming Maintenance)
-- Durumları 'active' üretim varsa active kalır, yoksa idle. 
-- Biz burada 'idle' bırakalım, üretim varsa kod zaten 'active' yapacak.
UPDATE public.makine 
SET sonraki_bakim_tarihi = (CURRENT_DATE + INTERVAL '2 days')::date
WHERE makine_id IN (5505, 5506, 5507, 5508);
