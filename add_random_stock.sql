-- Rastgele Hammadde Stok Ekleme (10-30 Birim)
-- Bu script, 'hammadde' tablosundaki tüm kayıtların 'kalan_miktar' değerine
-- rastgele 10 ile 30 arasında bir sayı ekler.

UPDATE public.hammadde
SET kalan_miktar = (
    -- Mevcut miktarı güvenli bir şekilde sayıya çevir (numeric olmayan karakterleri temizle)
    COALESCE(NULLIF(regexp_replace(kalan_miktar, '[^0-9.]', '', 'g'), ''), '0')::numeric 
    + 
    -- 10 ile 30 arasında rastgele sayı ekle
    floor(random() * 21 + 10)
)::text;
