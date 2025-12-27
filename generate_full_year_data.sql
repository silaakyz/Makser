-- SON 1 YIL İÇİN DETAYLI VE GERÇEKÇİ ÜRETİM VERİSİ OLUŞTURMA SCRIPTİ
-- Bu script mevcut üretim kayıtlarını siler ve yeniden oluşturur.

TRUNCATE TABLE public.uretim_kayit RESTART IDENTITY CASCADE;

DO $$
DECLARE
    m_id INT;       -- Makine ID
    p_id INT;       -- Ürün ID
    curr_day TIMESTAMP;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    target INT;
    produced INT;
    scrap INT;
    shift INT;
    is_active BOOLEAN;
    day_count INT;
BEGIN
    -- Son 365 günden bugüne döngü
    FOR day_count IN REVERSE 365..0 LOOP
        curr_day := CURRENT_DATE - (day_count || ' days')::INTERVAL;
        
        -- Her makine için (5500 - 5511)
        FOR m_id IN 5500..5511 LOOP
            
            -- Her gün için 1 ile 3 vardiya arası rastgele iş
            -- Hafta sonu ise daha az iş (Opsiyonel, şimdilik tam kapasite varsayalım)
            
            FOR shift IN 1..(1 + floor(random() * 3)::int) LOOP
                -- Ürün ID: 3012 ile 3016 arası rastgele
                p_id := 3012 + floor(random() * 5)::int;
                
                -- Vardiya Başlangıç Saatleri Rastgeleliği
                IF shift = 1 THEN
                    start_time := curr_day + INTERVAL '08:00:00' + (floor(random()*60) || ' minutes')::INTERVAL;
                ELSIF shift = 2 THEN
                    start_time := curr_day + INTERVAL '16:00:00' + (floor(random()*60) || ' minutes')::INTERVAL;
                ELSE
                    start_time := curr_day + INTERVAL '23:00:00' + (floor(random()*60) || ' minutes')::INTERVAL;
                END IF;

                -- İş Süresi: 4 ile 8 saat arası
                end_time := start_time + (floor(random() * 4 + 4) || ' hours')::INTERVAL;

                -- Bugünü ve şu anı kontrol et
                -- Eğer oluşturulan kayıt gelecekteyse döngüyü kır
                IF start_time > NOW() THEN 
                    CONTINUE; 
                END IF;

                -- AKTİF ÜRETİM MANTIĞI
                -- Eğer gün bugünse (day_count = 0) ve son vardiyaysa, bunu 'Aktif' yap
                -- Ama her makine için değil, %80 olasılıkla aktif yap (bazıları boşta kalsın gerçekçilik için)
                IF day_count = 0 AND shift = 3 AND random() < 0.8 THEN
                    end_time := NULL; -- Bitiş zamanı yok = Devam ediyor
                    is_active := TRUE;
                ELSIF day_count = 0 AND end_time > NOW() THEN
                    -- Eğer hesaplanan bitiş zamanı şu andan ilerideyse, yine aktif yap
                    end_time := NULL;
                    is_active := TRUE;
                ELSE
                    is_active := FALSE;
                END IF;

                -- Hedef ve Üretilen Adet Hesabı
                target := 100 + floor(random() * 400); -- 100-500 arası hedef
                
                IF is_active THEN
                    -- Aktifse henüz hedef tamamlanmamıştır (0% - 90% arası)
                    produced := floor(target * (random() * 0.9));
                    scrap := floor(produced * (random() * 0.03)); -- Düşük fire
                ELSE
                    -- Tamamlanmışsa hedefe yakın (%85 - %110)
                    produced := floor(target * (0.85 + random() * 0.25));
                    scrap := floor(produced * (random() * 0.05)); -- %0-5 arası fire
                END IF;

                -- Veriyi Ekle
                INSERT INTO public.uretim_kayit (
                    urun_id, 
                    makine_id, 
                    baslama_zamani, 
                    bitis_zamani, 
                    hedef_adet, 
                    uretilen_adet, 
                    fire_adet
                )
                VALUES (
                    p_id, 
                    m_id, 
                    start_time, 
                    end_time, 
                    target, 
                    produced, 
                    scrap
                );

            END LOOP;
        END LOOP;
    END LOOP;
    
    -- Sequence'ı düzelt (ID çakışmasını önlemek için)
    PERFORM setval('uretim_kayit_uretim_id_seq', (SELECT MAX(uretim_id) FROM uretim_kayit));
END $$;
