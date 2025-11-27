// Mock data for the manufacturing dashboard

export const mockMachines = [
  { id: "1", ad: "CNC Torna 1", tur: "Torna", durum: "aktif", uretim_kapasitesi: 100, son_bakim_tarihi: "2025-01-15", sonraki_bakim_tarihi: "2025-02-15" },
  { id: "2", ad: "CNC Freze 1", tur: "Freze", durum: "aktif", uretim_kapasitesi: 120, son_bakim_tarihi: "2025-01-10", sonraki_bakim_tarihi: "2025-02-10" },
  { id: "3", ad: "Pres 1", tur: "Pres", durum: "boşta", uretim_kapasitesi: 80, son_bakim_tarihi: "2025-01-20", sonraki_bakim_tarihi: "2025-02-20" },
  { id: "4", ad: "Kaynak 1", tur: "Kaynak", durum: "aktif", uretim_kapasitesi: 60, son_bakim_tarihi: "2025-01-05", sonraki_bakim_tarihi: "2025-02-05" },
  { id: "5", ad: "Montaj Hattı 1", tur: "Montaj", durum: "arızalı", uretim_kapasitesi: 150, son_bakim_tarihi: "2025-01-12", sonraki_bakim_tarihi: "2025-02-12" },
  { id: "6", ad: "Boyama 1", tur: "Boyama", durum: "bakımda", uretim_kapasitesi: 90, son_bakim_tarihi: "2025-01-25", sonraki_bakim_tarihi: "2025-02-25" },
  { id: "7", ad: "CNC Torna 2", tur: "Torna", durum: "aktif", uretim_kapasitesi: 100, son_bakim_tarihi: "2025-01-18", sonraki_bakim_tarihi: "2025-02-18" },
  { id: "8", ad: "Lazer Kesim", tur: "Kesim", durum: "aktif", uretim_kapasitesi: 110, son_bakim_tarihi: "2025-01-08", sonraki_bakim_tarihi: "2025-02-08" },
  { id: "9", ad: "Paketleme", tur: "Paketleme", durum: "boşta", uretim_kapasitesi: 200, son_bakim_tarihi: "2025-01-22", sonraki_bakim_tarihi: "2025-02-22" },
  { id: "10", ad: "Kalite Kontrol", tur: "Kontrol", durum: "aktif", uretim_kapasitesi: 180, son_bakim_tarihi: "2025-01-14", sonraki_bakim_tarihi: "2025-02-14" },
];

export const mockHammaddeler = [
  { id: "1", ad: "Çelik Levha", stok_miktari: 450, birim: "kg", birim_fiyat: 25, kritik_stok_seviyesi: 200, tuketim_hizi: 50 },
  { id: "2", ad: "Alüminyum Profil", stok_miktari: 180, birim: "m", birim_fiyat: 35, kritik_stok_seviyesi: 150, tuketim_hizi: 30 },
  { id: "3", ad: "Plastik Granül", stok_miktari: 320, birim: "kg", birim_fiyat: 15, kritik_stok_seviyesi: 250, tuketim_hizi: 40 },
  { id: "4", ad: "Boya", stok_miktari: 80, birim: "L", birim_fiyat: 120, kritik_stok_seviyesi: 100, tuketim_hizi: 15 },
  { id: "5", ad: "Vida M8", stok_miktari: 5000, birim: "adet", birim_fiyat: 0.5, kritik_stok_seviyesi: 3000, tuketim_hizi: 500 },
  { id: "6", ad: "Kaynak Teli", stok_miktari: 45, birim: "kg", birim_fiyat: 85, kritik_stok_seviyesi: 50, tuketim_hizi: 8 },
  { id: "7", ad: "Rulman", stok_miktari: 120, birim: "adet", birim_fiyat: 45, kritik_stok_seviyesi: 80, tuketim_hizi: 20 },
  { id: "8", ad: "Elektrik Kablosu", stok_miktari: 280, birim: "m", birim_fiyat: 8, kritik_stok_seviyesi: 200, tuketim_hizi: 35 },
  { id: "9", ad: "Conta", stok_miktari: 350, birim: "adet", birim_fiyat: 12, kritik_stok_seviyesi: 250, tuketim_hizi: 45 },
  { id: "10", ad: "Yağlama Yağı", stok_miktari: 95, birim: "L", birim_fiyat: 65, kritik_stok_seviyesi: 80, tuketim_hizi: 12 },
  { id: "11", ad: "Paslanmaz Çelik", stok_miktari: 220, birim: "kg", birim_fiyat: 55, kritik_stok_seviyesi: 180, tuketim_hizi: 28 },
  { id: "12", ad: "Kauçuk Conta", stok_miktari: 420, birim: "adet", birim_fiyat: 8, kritik_stok_seviyesi: 300, tuketim_hizi: 55 },
  { id: "13", ad: "Bakır Tel", stok_miktari: 140, birim: "kg", birim_fiyat: 95, kritik_stok_seviyesi: 120, tuketim_hizi: 18 },
  { id: "14", ad: "Cam Elyaf", stok_miktari: 75, birim: "kg", birim_fiyat: 42, kritik_stok_seviyesi: 100, tuketim_hizi: 12 },
  { id: "15", ad: "Epoksi Reçine", stok_miktari: 60, birim: "kg", birim_fiyat: 135, kritik_stok_seviyesi: 80, tuketim_hizi: 10 },
  { id: "16", ad: "Zımpara Kağıdı", stok_miktari: 380, birim: "adet", birim_fiyat: 3, kritik_stok_seviyesi: 250, tuketim_hizi: 60 },
  { id: "17", ad: "Kesici Uç", stok_miktari: 145, birim: "adet", birim_fiyat: 28, kritik_stok_seviyesi: 100, tuketim_hizi: 22 },
  { id: "18", ad: "Hidrolik Yağ", stok_miktari: 110, birim: "L", birim_fiyat: 75, kritik_stok_seviyesi: 90, tuketim_hizi: 14 },
  { id: "19", ad: "Ambalaj Kartonu", stok_miktari: 520, birim: "adet", birim_fiyat: 5, kritik_stok_seviyesi: 400, tuketim_hizi: 70 },
  { id: "20", ad: "Etiket", stok_miktari: 8500, birim: "adet", birim_fiyat: 0.2, kritik_stok_seviyesi: 5000, tuketim_hizi: 850 },
];

export const mockUrunler = [
  { id: "1", ad: "Parça A-100", tur: "Mekanik", stok_miktari: 85, satis_fiyati: 450, kritik_stok_seviyesi: 50 },
  { id: "2", ad: "Montaj B-200", tur: "Montaj", stok_miktari: 42, satis_fiyati: 1200, kritik_stok_seviyesi: 30 },
  { id: "3", ad: "Sistem C-300", tur: "Elektronik", stok_miktari: 28, satis_fiyati: 2800, kritik_stok_seviyesi: 20 },
  { id: "4", ad: "Aksesuar D-400", tur: "Aksesuar", stok_miktari: 150, satis_fiyati: 180, kritik_stok_seviyesi: 80 },
  { id: "5", ad: "Parça E-500", tur: "Mekanik", stok_miktari: 65, satis_fiyati: 520, kritik_stok_seviyesi: 40 },
];

export const mockSiparisler = [
  { id: "1", musteri: "ABC Makina", urun: "Parça A-100", miktar: 50, durum: "beklemede", siparis_tarihi: "2025-01-20", teslim_tarihi: "2025-02-05", kaynak: "stok", siparis_maliyeti: 18500 },
  { id: "2", musteri: "XYZ Sanayi", urun: "Montaj B-200", miktar: 25, durum: "uretimde", siparis_tarihi: "2025-01-18", teslim_tarihi: "2025-02-10", kaynak: "uretim", siparis_maliyeti: 28000 },
  { id: "3", musteri: "DEF Ticaret", urun: "Sistem C-300", miktar: 10, durum: "uretimde", siparis_tarihi: "2025-01-15", teslim_tarihi: "2025-02-15", kaynak: "uretim", siparis_maliyeti: 26500 },
  { id: "4", musteri: "GHI Limited", urun: "Aksesuar D-400", miktar: 100, durum: "tamamlandi", siparis_tarihi: "2025-01-10", teslim_tarihi: "2025-01-25", kaynak: "stok", siparis_maliyeti: 15800 },
  { id: "5", musteri: "JKL Industries", urun: "Parça E-500", miktar: 35, durum: "beklemede", siparis_tarihi: "2025-01-22", teslim_tarihi: "2025-02-08", kaynak: "stok", siparis_maliyeti: 16200 },
  { id: "6", musteri: "MNO Corp", urun: "Parça A-100", miktar: 75, durum: "uretimde", siparis_tarihi: "2025-01-19", teslim_tarihi: "2025-02-12", kaynak: "uretim", siparis_maliyeti: 31500 },
  { id: "7", musteri: "PQR Makina", urun: "Montaj B-200", miktar: 15, durum: "tamamlandi", siparis_tarihi: "2025-01-12", teslim_tarihi: "2025-01-28", kaynak: "stok", siparis_maliyeti: 16800 },
  { id: "8", musteri: "STU Fabrika", urun: "Sistem C-300", miktar: 8, durum: "beklemede", siparis_tarihi: "2025-01-23", teslim_tarihi: "2025-02-18", kaynak: "uretim", siparis_maliyeti: 21200 },
  { id: "9", musteri: "VWX Sanayi", urun: "Aksesuar D-400", miktar: 120, durum: "tamamlandi", siparis_tarihi: "2025-01-08", teslim_tarihi: "2025-01-22", kaynak: "stok", siparis_maliyeti: 19200 },
  { id: "10", musteri: "YZA Ticaret", urun: "Parça E-500", miktar: 45, durum: "uretimde", siparis_tarihi: "2025-01-21", teslim_tarihi: "2025-02-14", kaynak: "uretim", siparis_maliyeti: 21800 },
  { id: "11", musteri: "BCD Makina", urun: "Parça A-100", miktar: 60, durum: "beklemede", siparis_tarihi: "2025-01-24", teslim_tarihi: "2025-02-20", kaynak: "stok", siparis_maliyeti: 24500 },
  { id: "12", musteri: "EFG Industries", urun: "Montaj B-200", miktar: 30, durum: "uretimde", siparis_tarihi: "2025-01-17", teslim_tarihi: "2025-02-11", kaynak: "uretim", siparis_maliyeti: 33600 },
  { id: "13", musteri: "HIJ Corp", urun: "Sistem C-300", miktar: 12, durum: "beklemede", siparis_tarihi: "2025-01-25", teslim_tarihi: "2025-02-22", kaynak: "uretim", siparis_maliyeti: 31800 },
  { id: "14", musteri: "KLM Limited", urun: "Aksesuar D-400", miktar: 90, durum: "tamamlandi", siparis_tarihi: "2025-01-09", teslim_tarihi: "2025-01-24", kaynak: "stok", siparis_maliyeti: 14400 },
  { id: "15", musteri: "NOP Sanayi", urun: "Parça E-500", miktar: 40, durum: "uretimde", siparis_tarihi: "2025-01-20", teslim_tarihi: "2025-02-13", kaynak: "uretim", siparis_maliyeti: 19600 },
];

export const mockUretimler = [
  { id: "1", urun: "Parça A-100", makine: "CNC Torna 1", baslangic_zamani: "2025-01-25 08:00", bitis_zamani: null, hedef_adet: 100, uretilen_adet: 65, durum: "devam_ediyor", calisan_personel: "Ahmet Yılmaz" },
  { id: "2", urun: "Montaj B-200", makine: "Montaj Hattı 1", baslangic_zamani: "2025-01-25 07:30", bitis_zamani: null, hedef_adet: 50, uretilen_adet: 32, durum: "devam_ediyor", calisan_personel: "Mehmet Demir" },
  { id: "3", urun: "Sistem C-300", makine: "CNC Freze 1", baslangic_zamani: "2025-01-25 09:00", bitis_zamani: null, hedef_adet: 20, uretilen_adet: 8, durum: "devam_ediyor", calisan_personel: "Ayşe Kaya" },
  { id: "4", urun: "Aksesuar D-400", makine: "Pres 1", baslangic_zamani: "2025-01-24 14:00", bitis_zamani: "2025-01-25 10:30", hedef_adet: 150, uretilen_adet: 150, durum: "tamamlandi", calisan_personel: "Fatma Şahin" },
  { id: "5", urun: "Parça E-500", makine: "Kaynak 1", baslangic_zamani: "2025-01-25 10:00", bitis_zamani: null, hedef_adet: 75, uretilen_adet: 28, durum: "devam_ediyor", calisan_personel: "Ali Öztürk" },
];

export const mockArizalar = [
  { id: "1", makine: "Montaj Hattı 1", baslangic_tarihi: "2025-01-25", bitis_tarihi: null, sure_saat: null, maliyet: null, aciklama: "Konveyör bant hasarı" },
  { id: "2", makine: "CNC Torna 2", baslangic_tarihi: "2025-01-20", bitis_tarihi: "2025-01-22", sure_saat: 48, maliyet: 8500, aciklama: "Motor arızası" },
  { id: "3", makine: "Lazer Kesim", baslangic_tarihi: "2025-01-15", bitis_tarihi: "2025-01-16", sure_saat: 24, maliyet: 12000, aciklama: "Lazer başlığı değişimi" },
  { id: "4", makine: "Boyama 1", baslangic_tarihi: "2025-01-12", bitis_tarihi: "2025-01-14", sure_saat: 36, maliyet: 5500, aciklama: "Boya püskürtme sistemi tıkanması" },
  { id: "5", makine: "Pres 1", baslangic_tarihi: "2025-01-08", bitis_tarihi: "2025-01-09", sure_saat: 18, maliyet: 3200, aciklama: "Hidrolik sistem kaçağı" },
];

export const mockBakimlar = [
  { id: "1", makine: "Boyama 1", bakim_tarihi: "2025-01-25", bakim_turu: "Periyodik Bakım", maliyet: 2800, aciklama: "Fırın temizliği ve filtre değişimi" },
  { id: "2", makine: "CNC Freze 1", bakim_tarihi: "2025-02-10", bakim_turu: "Planlı Bakım", maliyet: 3500, aciklama: "Rulman değişimi" },
  { id: "3", makine: "Kaynak 1", bakim_tarihi: "2025-02-05", bakim_turu: "Planlı Bakım", maliyet: 1800, aciklama: "Kaynak başlığı bakımı" },
  { id: "4", makine: "Pres 1", bakim_tarihi: "2025-02-20", bakim_turu: "Periyodik Bakım", maliyet: 2200, aciklama: "Hidrolik sistem kontrolü" },
  { id: "5", makine: "Montaj Hattı 1", bakim_tarihi: "2025-02-12", bakim_turu: "Planlı Bakım", maliyet: 4500, aciklama: "Konveyör sistemi bakımı" },
];

export const mockUyarilar = [
  { id: "1", tip: "kritik", baslik: "Makine Arızası", mesaj: "Montaj Hattı 1 - Konveyör bant hasarı", tarih: "2025-01-25 11:30" },
  { id: "2", tip: "kritik", baslik: "Kritik Stok", mesaj: "Boya stoku kritik seviyede (80L)", tarih: "2025-01-25 10:15" },
  { id: "3", tip: "uyari", baslik: "Yaklaşan Bakım", mesaj: "Kaynak 1 - 10 gün içinde bakım gerekli", tarih: "2025-01-25 09:00" },
  { id: "4", tip: "kritik", baslik: "Kritik Stok", mesaj: "Kaynak Teli stoku kritik seviyede (45kg)", tarih: "2025-01-25 08:45" },
  { id: "5", tip: "uyari", baslik: "Teslim Tarihi Yaklaşıyor", mesaj: "XYZ Sanayi siparişi - 15 gün kaldı", tarih: "2025-01-25 08:00" },
  { id: "6", tip: "bilgi", baslik: "Üretim Tamamlandı", mesaj: "Aksesuar D-400 - 150 adet üretim tamamlandı", tarih: "2025-01-25 10:30" },
  { id: "7", tip: "kritik", baslik: "Kritik Stok", mesaj: "Epoksi Reçine stoku kritik seviyede (60kg)", tarih: "2025-01-25 07:30" },
  { id: "8", tip: "uyari", baslik: "Yaklaşan Bakım", mesaj: "CNC Freze 1 - 15 gün içinde bakım gerekli", tarih: "2025-01-24 16:00" },
];

export const mockFinansal = {
  gunlukMaliyet: 45800,
  haftalikMaliyet: 285000,
  hammaddeMaliyeti: 125000,
  bakimMaliyeti: 18500,
  arizaMaliyeti: 32000,
  urunKarliligi: [
    { urun: "Parça A-100", maliyet: 320, satis: 450, kar: 130, miktar: 150 },
    { urun: "Montaj B-200", maliyet: 890, satis: 1200, kar: 310, miktar: 65 },
    { urun: "Sistem C-300", maliyet: 2100, satis: 2800, kar: 700, miktar: 28 },
    { urun: "Aksesuar D-400", maliyet: 125, satis: 180, kar: 55, miktar: 340 },
    { urun: "Parça E-500", maliyet: 380, satis: 520, kar: 140, miktar: 105 },
  ],
};

export const mockKPIs = {
  uretimVerimlilik: 87,
  makineCalismaOrani: 78,
  arizaSayisi: 5,
  toplamDurusSaati: 126,
  kritikStokAdedi: 4,
  bekleyenSiparisAdedi: 5,
  sipariseTamamlamaOrani: 93,
  guncelUretimMaliyeti: 45800,
  oee: 72,
};

export const mockUretimTrendi = [
  { gun: "Pzt", planlanan: 850, gerceklesen: 782 },
  { gun: "Sal", planlanan: 920, gerceklesen: 895 },
  { gun: "Çar", planlanan: 880, gerceklesen: 845 },
  { gun: "Per", planlanan: 900, gerceklesen: 920 },
  { gun: "Cum", planlanan: 950, gerceklesen: 885 },
  { gun: "Cmt", planlanan: 750, gerceklesen: 720 },
  { gun: "Paz", planlanan: 650, gerceklesen: 640 },
];

export const mockMakineKullanimi = [
  { makine: "CNC Torna 1", kullanim: 92 },
  { makine: "CNC Freze 1", kullanim: 88 },
  { makine: "Pres 1", kullanim: 65 },
  { makine: "Kaynak 1", kullanim: 78 },
  { makine: "Montaj Hattı 1", kullanim: 0 },
  { makine: "Boyama 1", kullanim: 0 },
  { makine: "CNC Torna 2", kullanim: 85 },
  { makine: "Lazer Kesim", kullanim: 91 },
  { makine: "Paketleme", kullanim: 72 },
  { makine: "Kalite Kontrol", kullanim: 95 },
];
