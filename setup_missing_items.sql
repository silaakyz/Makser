-- EKSİK HAMMADDE GİRİŞLERİ (FK Hatalarını Önlemek İçin)
-- 2021 ve diğer eksik olabilecekler
INSERT INTO public.hammadde (hammadde_id, stok_adi, satis_fiyati, alis_fiyati, kalan_miktar, birim, kdv_satis, kdv_alis, grubu, aktif, kritik_stok, tedarikci_id)
VALUES
(2021, ' 25x2 MM SANAYİ BORUSU', '45', '30', '100', 'MT', 20, 20, 'KAZAN MALZEMELERİ', 'Evet', '20', 1122),
(2026, ' 32 İSTAVROZ TE', '10', '8', '0', 'ADET', 20, 20, 'FİTTİNGS', 'Evet', '1', 1126),
(2079, ' GÖZETLEME REKORU-SOMUN', '42', '32.5', '0', 'ADET', 20, 20, 'KAZAN MALZEMELERİ', 'Evet', '0', 1115)
ON CONFLICT (hammadde_id) DO NOTHING;
