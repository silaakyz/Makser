-- Sipariş tablosu için RLS politikalarını güncelle

-- Önce mevcut politikaları sil
DROP POLICY IF EXISTS "Enable all for siparis" ON public.siparis;

-- Yeni politikalar oluştur

-- Herkes siparişleri görebilir
CREATE POLICY "Herkes siparişleri görüntüleyebilir"
ON public.siparis
FOR SELECT
USING (true);

-- Şirket sahibi, genel müdür ve muhasebe sipariş oluşturabilir
CREATE POLICY "Yetkili roller sipariş oluşturabilir"
ON public.siparis
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'sirket_sahibi'::app_role) OR
  has_role(auth.uid(), 'genel_mudur'::app_role) OR
  has_role(auth.uid(), 'muhasebe'::app_role)
);

-- Şirket sahibi ve genel müdür sipariş güncelleyebilir
CREATE POLICY "Yöneticiler sipariş güncelleyebilir"
ON public.siparis
FOR UPDATE
USING (
  has_role(auth.uid(), 'sirket_sahibi'::app_role) OR
  has_role(auth.uid(), 'genel_mudur'::app_role)
);

-- Şirket sahibi ve genel müdür sipariş silebilir
CREATE POLICY "Yöneticiler sipariş silebilir"
ON public.siparis
FOR DELETE
USING (
  has_role(auth.uid(), 'sirket_sahibi'::app_role) OR
  has_role(auth.uid(), 'genel_mudur'::app_role)
);