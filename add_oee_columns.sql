-- OEE Hesabı İçin Gerekli Sütunları Ekleme
-- Eğer sütunlar zaten varsa hata vermez, yoksa ekler.

DO $$
BEGIN
    -- Hedef Adet (Plans or Quota)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'uretim_kayit' AND column_name = 'hedef_adet') THEN
        ALTER TABLE public.uretim_kayit ADD COLUMN hedef_adet integer DEFAULT 0;
    END IF;

    -- Üretilen Adet (Actual Output)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'uretim_kayit' AND column_name = 'uretilen_adet') THEN
        ALTER TABLE public.uretim_kayit ADD COLUMN uretilen_adet integer DEFAULT 0;
    END IF;

    -- Fire Adet (Rejects / Scrap)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'uretim_kayit' AND column_name = 'fire_adet') THEN
        ALTER TABLE public.uretim_kayit ADD COLUMN fire_adet integer DEFAULT 0;
    END IF;

     -- Durum sütunu da eksik olabilir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'uretim_kayit' AND column_name = 'durum') THEN
        ALTER TABLE public.uretim_kayit ADD COLUMN durum text;
    END IF;

END $$;
