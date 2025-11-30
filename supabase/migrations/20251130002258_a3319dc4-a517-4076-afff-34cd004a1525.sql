-- Rol tiplerini tanımla
CREATE TYPE public.app_role AS ENUM ('mudur', 'personel', 'operator');

-- Kullanıcı profilleri tablosu
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ad TEXT,
  soyad TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kullanıcı rolleri tablosu
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- RLS aktifleştir
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Rol kontrolü için güvenli fonksiyon
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profil oluşturma trigger fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, ad, soyad, email)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'ad',
    NEW.raw_user_meta_data->>'soyad',
    NEW.email
  );
  
  -- Belirli email adresi otomatik müdür olur
  IF NEW.email = 'mudur@fabrika.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'mudur');
  ELSE
    -- Diğer kullanıcılar varsayılan olarak personel
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'personel');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger oluştur
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS Politikaları

-- Profiles: Herkes kendi profilini görebilir
CREATE POLICY "Kullanıcılar kendi profilini görebilir"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Profiles: Herkes kendi profilini güncelleyebilir
CREATE POLICY "Kullanıcılar kendi profilini güncelleyebilir"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- User roles: Herkes kendi rolünü görebilir
CREATE POLICY "Kullanıcılar kendi rollerini görebilir"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- User roles: Sadece müdür roller yönetebilir
CREATE POLICY "Müdür roller ekleyebilir"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'mudur'));

CREATE POLICY "Müdür roller güncelleyebilir"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'mudur'));

CREATE POLICY "Müdür roller silebilir"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'mudur'));

-- Updated_at otomatik güncelleme trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();