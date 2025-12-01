DO $$
BEGIN
  -- Makine tablosu boşsa örnek makineler ekle
  IF NOT EXISTS (SELECT 1 FROM public.makine LIMIT 1) THEN
    INSERT INTO public.makine (ad, tur, durum, uretim_kapasitesi, son_bakim_tarihi, sonraki_bakim_tarihi)
    VALUES
      ('CNC Torna 1', 'Torna', 'aktif', 100, '2025-01-15', '2025-02-15'),
      ('CNC Freze 1', 'Freze', 'aktif', 120, '2025-01-10', '2025-02-10'),
      ('Pres 1', 'Pres', 'boşta', 80, '2025-01-20', '2025-02-20'),
      ('Kaynak 1', 'Kaynak', 'aktif', 60, '2025-01-05', '2025-02-05'),
      ('Montaj Hattı 1', 'Montaj', 'arızalı', 150, '2025-01-12', '2025-02-12'),
      ('Boyama 1', 'Boyama', 'bakımda', 90, '2025-01-25', '2025-02-25'),
      ('CNC Torna 2', 'Torna', 'aktif', 100, '2025-01-18', '2025-02-18'),
      ('Lazer Kesim', 'Kesim', 'aktif', 110, '2025-01-08', '2025-02-08'),
      ('Paketleme', 'Paketleme', 'boşta', 200, '2025-01-22', '2025-02-22'),
      ('Kalite Kontrol', 'Kontrol', 'aktif', 180, '2025-01-14', '2025-02-14');
  END IF;

  -- Hammadde tablosu boşsa örnek hammaddeler ekle
  IF NOT EXISTS (SELECT 1 FROM public.hammadde LIMIT 1) THEN
    INSERT INTO public.hammadde (ad, stok_miktari, birim, birim_fiyat, kritik_stok_seviyesi, tuketim_hizi)
    VALUES
      ('Çelik Levha', 450, 'kg', 25, 200, 50),
      ('Alüminyum Profil', 180, 'm', 35, 150, 30),
      ('Plastik Granül', 320, 'kg', 15, 250, 40),
      ('Boya', 80, 'L', 120, 100, 15),
      ('Vida M8', 5000, 'adet', 0.5, 3000, 500),
      ('Kaynak Teli', 45, 'kg', 85, 50, 8),
      ('Rulman', 120, 'adet', 45, 80, 20),
      ('Elektrik Kablosu', 280, 'm', 8, 200, 35),
      ('Conta', 350, 'adet', 12, 250, 45),
      ('Yağlama Yağı', 95, 'L', 65, 80, 12),
      ('Paslanmaz Çelik', 220, 'kg', 55, 180, 28),
      ('Kauçuk Conta', 420, 'adet', 8, 300, 55),
      ('Bakır Tel', 140, 'kg', 95, 120, 18),
      ('Cam Elyaf', 75, 'kg', 42, 100, 12),
      ('Epoksi Reçine', 60, 'kg', 135, 80, 10),
      ('Zımpara Kağıdı', 380, 'adet', 3, 250, 60),
      ('Kesici Uç', 145, 'adet', 28, 100, 22),
      ('Hidrolik Yağ', 110, 'L', 75, 90, 14),
      ('Ambalaj Kartonu', 520, 'adet', 5, 400, 70),
      ('Etiket', 8500, 'adet', 0.2, 5000, 850);
  END IF;

  -- Ürün tablosu boşsa kazan ürünlerini ekle
  IF NOT EXISTS (SELECT 1 FROM public.urun LIMIT 1) THEN
    INSERT INTO public.urun (
      ad,
      tur,
      stok_miktari,
      satis_fiyati,
      kritik_stok_seviyesi,
      en,
      boy,
      yukseklik,
      hacim,
      agirlik,
      max_basinc,
      max_sicaklik,
      resim_url,
      teknik_dokuman_url
    )
    VALUES
      (
        'Kazan K-100',
        'Sanayi Kazanı',
        12,
        45000,
        5,
        120,
        180,
        200,
        500,
        850,
        10,
        180,
        'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=800&auto=format&fit=crop',
        NULL
      ),
      (
        'Kazan K-200',
        'Buhar Kazanı',
        8,
        78000,
        3,
        150,
        220,
        250,
        1000,
        1450,
        15,
        220,
        'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&auto=format&fit=crop',
        NULL
      ),
      (
        'Kazan K-300',
        'Kombi Kazanı',
        25,
        25000,
        10,
        80,
        120,
        150,
        200,
        380,
        8,
        160,
        'https://images.unsplash.com/photo-1581092583537-20d51b4b4f1b?w=800&auto=format&fit=crop',
        NULL
      ),
      (
        'Kazan K-400',
        'Endüstriyel Kazan',
        6,
        125000,
        2,
        200,
        300,
        320,
        2000,
        2850,
        20,
        250,
        'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=800&auto=format&fit=crop',
        NULL
      ),
      (
        'Kazan K-500',
        'Ticari Kazan',
        18,
        35000,
        8,
        100,
        150,
        180,
        350,
        520,
        12,
        190,
        'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&auto=format&fit=crop',
        NULL
      );
  END IF;

  -- Sipariş tablosu boşsa örnek siparişler ekle
  IF NOT EXISTS (SELECT 1 FROM public.siparis LIMIT 1) THEN
    INSERT INTO public.siparis (musteri, urun_id, miktar, durum, kaynak, siparis_tarihi, teslim_tarihi, siparis_maliyeti)
    VALUES
      ('ABC Makina', (SELECT id FROM public.urun WHERE ad = 'Kazan K-100' LIMIT 1), 5, 'beklemede', 'stok', '2025-01-20', '2025-02-05', 225000),
      ('XYZ Sanayi', (SELECT id FROM public.urun WHERE ad = 'Kazan K-200' LIMIT 1), 3, 'uretimde', 'uretim', '2025-01-18', '2025-02-10', 234000),
      ('DEF Ticaret', (SELECT id FROM public.urun WHERE ad = 'Kazan K-300' LIMIT 1), 10, 'uretimde', 'uretim', '2025-01-15', '2025-02-15', 250000),
      ('GHI Limited', (SELECT id FROM public.urun WHERE ad = 'Kazan K-400' LIMIT 1), 2, 'tamamlandi', 'stok', '2025-01-10', '2025-01-25', 250000),
      ('JKL Industries', (SELECT id FROM public.urun WHERE ad = 'Kazan K-500' LIMIT 1), 4, 'beklemede', 'stok', '2025-01-22', '2025-02-08', 140000);
  END IF;

  -- Üretim tablosu boşsa örnek üretimler ekle
  IF NOT EXISTS (SELECT 1 FROM public.uretim LIMIT 1) THEN
    INSERT INTO public.uretim (urun_id, makine_id, baslangic_zamani, bitis_zamani, hedef_adet, uretilen_adet, durum, calisan_personel)
    VALUES
      (
        (SELECT id FROM public.urun WHERE ad = 'Kazan K-100' LIMIT 1),
        (SELECT id FROM public.makine WHERE ad = 'CNC Torna 1' LIMIT 1),
        '2025-01-25T08:00:00+03',
        NULL,
        100,
        65,
        'devam_ediyor',
        'Ahmet Yılmaz'
      ),
      (
        (SELECT id FROM public.urun WHERE ad = 'Kazan K-200' LIMIT 1),
        (SELECT id FROM public.makine WHERE ad = 'Montaj Hattı 1' LIMIT 1),
        '2025-01-25T07:30:00+03',
        NULL,
        50,
        32,
        'devam_ediyor',
        'Mehmet Demir'
      ),
      (
        (SELECT id FROM public.urun WHERE ad = 'Kazan K-300' LIMIT 1),
        (SELECT id FROM public.makine WHERE ad = 'CNC Freze 1' LIMIT 1),
        '2025-01-25T09:00:00+03',
        NULL,
        20,
        8,
        'devam_ediyor',
        'Ayşe Kaya'
      ),
      (
        (SELECT id FROM public.urun WHERE ad = 'Kazan K-400' LIMIT 1),
        (SELECT id FROM public.makine WHERE ad = 'Pres 1' LIMIT 1),
        '2025-01-24T14:00:00+03',
        '2025-01-25T10:30:00+03',
        150,
        150,
        'tamamlandi',
        'Fatma Şahin'
      ),
      (
        (SELECT id FROM public.urun WHERE ad = 'Kazan K-500' LIMIT 1),
        (SELECT id FROM public.makine WHERE ad = 'Kaynak 1' LIMIT 1),
        '2025-01-25T10:00:00+03',
        NULL,
        75,
        28,
        'devam_ediyor',
        'Ali Öztürk'
      );
  END IF;

  -- Bakım kayıtları tablosu boşsa örnek bakımlar ekle
  IF NOT EXISTS (SELECT 1 FROM public.bakim_kaydi LIMIT 1) THEN
    INSERT INTO public.bakim_kaydi (makine_id, bakim_tarihi, bakim_turu, maliyet, aciklama)
    VALUES
      (
        (SELECT id FROM public.makine WHERE ad = 'Boyama 1' LIMIT 1),
        '2025-01-25',
        'Periyodik Bakım',
        2800,
        'Fırın temizliği ve filtre değişimi'
      ),
      (
        (SELECT id FROM public.makine WHERE ad = 'CNC Freze 1' LIMIT 1),
        '2025-02-10',
        'Planlı Bakım',
        3500,
        'Rulman değişimi'
      ),
      (
        (SELECT id FROM public.makine WHERE ad = 'Kaynak 1' LIMIT 1),
        '2025-02-05',
        'Planlı Bakım',
        1800,
        'Kaynak başlığı bakımı'
      ),
      (
        (SELECT id FROM public.makine WHERE ad = 'Pres 1' LIMIT 1),
        '2025-02-20',
        'Periyodik Bakım',
        2200,
        'Hidrolik sistem kontrolü'
      ),
      (
        (SELECT id FROM public.makine WHERE ad = 'Montaj Hattı 1' LIMIT 1),
        '2025-02-12',
        'Planlı Bakım',
        4500,
        'Konveyör sistemi bakımı'
      );
  END IF;

  -- Arıza kayıtları tablosu boşsa örnek arızalar ekle
  IF NOT EXISTS (SELECT 1 FROM public.ariza_kaydi LIMIT 1) THEN
    INSERT INTO public.ariza_kaydi (makine_id, baslangic_tarihi, bitis_tarihi, sure_saat, maliyet, aciklama)
    VALUES
      (
        (SELECT id FROM public.makine WHERE ad = 'Montaj Hattı 1' LIMIT 1),
        '2025-01-25',
        NULL,
        NULL,
        NULL,
        'Konveyör bant hasarı'
      ),
      (
        (SELECT id FROM public.makine WHERE ad = 'CNC Torna 2' LIMIT 1),
        '2025-01-20',
        '2025-01-22',
        48,
        8500,
        'Motor arızası'
      ),
      (
        (SELECT id FROM public.makine WHERE ad = 'Lazer Kesim' LIMIT 1),
        '2025-01-15',
        '2025-01-16',
        24,
        12000,
        'Lazer başlığı değişimi'
      ),
      (
        (SELECT id FROM public.makine WHERE ad = 'Boyama 1' LIMIT 1),
        '2025-01-12',
        '2025-01-14',
        36,
        5500,
        'Boya püskürtme sistemi tıkanması'
      ),
      (
        (SELECT id FROM public.makine WHERE ad = 'Pres 1' LIMIT 1),
        '2025-01-08',
        '2025-01-09',
        18,
        3200,
        'Hidrolik sistem kaçağı'
      );
  END IF;
END;
$$;


