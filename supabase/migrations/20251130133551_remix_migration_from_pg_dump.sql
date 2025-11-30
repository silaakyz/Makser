CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'sirket_sahibi',
    'genel_mudur',
    'muhasebe',
    'uretim_sefi',
    'teknisyen',
    'servis_personeli',
    'saha_montaj',
    'uretim_personeli'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, ad, soyad, email)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'ad',
    NEW.raw_user_meta_data->>'soyad',
    NEW.email
  );
  
  -- Şirket sahibi email kontrolü
  IF NEW.email = 'sahib@fabrika.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'sirket_sahibi');
  -- Genel müdür email kontrolü
  ELSIF NEW.email = 'mudur@fabrika.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'genel_mudur');
  ELSE
    -- Diğer kullanıcılar varsayılan olarak üretim personeli
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'uretim_personeli');
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


SET default_table_access_method = heap;

--
-- Name: ariza_kaydi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ariza_kaydi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    makine_id uuid,
    baslangic_tarihi timestamp with time zone NOT NULL,
    bitis_tarihi timestamp with time zone,
    sure_saat numeric(10,2),
    maliyet numeric(10,2) DEFAULT 0,
    aciklama text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: bakim_kaydi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bakim_kaydi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    makine_id uuid,
    bakim_tarihi date NOT NULL,
    bakim_turu text NOT NULL,
    maliyet numeric(10,2) DEFAULT 0,
    aciklama text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: hammadde; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hammadde (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad text NOT NULL,
    birim_fiyat numeric(10,2) NOT NULL,
    stok_miktari numeric(10,2) DEFAULT 0 NOT NULL,
    birim text DEFAULT 'kg'::text NOT NULL,
    tuketim_hizi numeric(10,2) DEFAULT 0,
    kritik_stok_seviyesi numeric(10,2) DEFAULT 100,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: hammadde_giris; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hammadde_giris (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hammadde_id uuid,
    miktar numeric(10,2) NOT NULL,
    birim_fiyat numeric(10,2) NOT NULL,
    toplam_tutar numeric(10,2) NOT NULL,
    giris_tarihi date DEFAULT CURRENT_DATE NOT NULL,
    tedarikci text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: makine; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.makine (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad text NOT NULL,
    tur text NOT NULL,
    uretim_kapasitesi integer NOT NULL,
    durum text DEFAULT 'boşta'::text NOT NULL,
    son_bakim_tarihi date,
    sonraki_bakim_tarihi date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT makine_durum_check CHECK ((durum = ANY (ARRAY['aktif'::text, 'boşta'::text, 'arızalı'::text, 'bakımda'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    ad text,
    soyad text,
    email text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: siparis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.siparis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    musteri text NOT NULL,
    urun_id uuid,
    miktar integer NOT NULL,
    siparis_tarihi date DEFAULT CURRENT_DATE NOT NULL,
    teslim_tarihi date,
    durum text DEFAULT 'beklemede'::text NOT NULL,
    kaynak text DEFAULT 'stok'::text NOT NULL,
    siparis_maliyeti numeric(10,2) DEFAULT 0,
    uretim_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT siparis_durum_check CHECK ((durum = ANY (ARRAY['beklemede'::text, 'uretimde'::text, 'tamamlandi'::text, 'iptal'::text]))),
    CONSTRAINT siparis_kaynak_check CHECK ((kaynak = ANY (ARRAY['stok'::text, 'uretim'::text])))
);


--
-- Name: uretim; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.uretim (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    urun_id uuid,
    makine_id uuid,
    baslangic_zamani timestamp with time zone NOT NULL,
    bitis_zamani timestamp with time zone,
    uretilen_adet integer DEFAULT 0,
    hedef_adet integer NOT NULL,
    calisan_personel text,
    durum text DEFAULT 'devam_ediyor'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT uretim_durum_check CHECK ((durum = ANY (ARRAY['devam_ediyor'::text, 'tamamlandi'::text, 'iptal'::text])))
);


--
-- Name: urun; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.urun (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ad text NOT NULL,
    tur text NOT NULL,
    satis_fiyati numeric(10,2) NOT NULL,
    stok_miktari integer DEFAULT 0 NOT NULL,
    kritik_stok_seviyesi integer DEFAULT 10,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    en numeric,
    boy numeric,
    yukseklik numeric,
    hacim numeric,
    agirlik numeric,
    max_basinc numeric,
    max_sicaklik numeric,
    resim_url text
);


--
-- Name: urun_hammadde; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.urun_hammadde (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    urun_id uuid,
    hammadde_id uuid,
    miktar numeric(10,2) NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ariza_kaydi ariza_kaydi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ariza_kaydi
    ADD CONSTRAINT ariza_kaydi_pkey PRIMARY KEY (id);


--
-- Name: bakim_kaydi bakim_kaydi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bakim_kaydi
    ADD CONSTRAINT bakim_kaydi_pkey PRIMARY KEY (id);


--
-- Name: hammadde_giris hammadde_giris_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hammadde_giris
    ADD CONSTRAINT hammadde_giris_pkey PRIMARY KEY (id);


--
-- Name: hammadde hammadde_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hammadde
    ADD CONSTRAINT hammadde_pkey PRIMARY KEY (id);


--
-- Name: makine makine_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.makine
    ADD CONSTRAINT makine_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: siparis siparis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.siparis
    ADD CONSTRAINT siparis_pkey PRIMARY KEY (id);


--
-- Name: uretim uretim_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uretim
    ADD CONSTRAINT uretim_pkey PRIMARY KEY (id);


--
-- Name: urun_hammadde urun_hammadde_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.urun_hammadde
    ADD CONSTRAINT urun_hammadde_pkey PRIMARY KEY (id);


--
-- Name: urun_hammadde urun_hammadde_urun_id_hammadde_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.urun_hammadde
    ADD CONSTRAINT urun_hammadde_urun_id_hammadde_id_key UNIQUE (urun_id, hammadde_id);


--
-- Name: urun urun_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.urun
    ADD CONSTRAINT urun_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: profiles profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: hammadde set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.hammadde FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: makine set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.makine FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: siparis set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.siparis FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: uretim set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.uretim FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: urun set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.urun FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: ariza_kaydi ariza_kaydi_makine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ariza_kaydi
    ADD CONSTRAINT ariza_kaydi_makine_id_fkey FOREIGN KEY (makine_id) REFERENCES public.makine(id) ON DELETE CASCADE;


--
-- Name: bakim_kaydi bakim_kaydi_makine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bakim_kaydi
    ADD CONSTRAINT bakim_kaydi_makine_id_fkey FOREIGN KEY (makine_id) REFERENCES public.makine(id) ON DELETE CASCADE;


--
-- Name: hammadde_giris hammadde_giris_hammadde_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hammadde_giris
    ADD CONSTRAINT hammadde_giris_hammadde_id_fkey FOREIGN KEY (hammadde_id) REFERENCES public.hammadde(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: siparis siparis_uretim_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.siparis
    ADD CONSTRAINT siparis_uretim_id_fkey FOREIGN KEY (uretim_id) REFERENCES public.uretim(id) ON DELETE SET NULL;


--
-- Name: siparis siparis_urun_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.siparis
    ADD CONSTRAINT siparis_urun_id_fkey FOREIGN KEY (urun_id) REFERENCES public.urun(id) ON DELETE CASCADE;


--
-- Name: uretim uretim_makine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uretim
    ADD CONSTRAINT uretim_makine_id_fkey FOREIGN KEY (makine_id) REFERENCES public.makine(id) ON DELETE CASCADE;


--
-- Name: uretim uretim_urun_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uretim
    ADD CONSTRAINT uretim_urun_id_fkey FOREIGN KEY (urun_id) REFERENCES public.urun(id) ON DELETE CASCADE;


--
-- Name: urun_hammadde urun_hammadde_hammadde_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.urun_hammadde
    ADD CONSTRAINT urun_hammadde_hammadde_id_fkey FOREIGN KEY (hammadde_id) REFERENCES public.hammadde(id) ON DELETE CASCADE;


--
-- Name: urun_hammadde urun_hammadde_urun_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.urun_hammadde
    ADD CONSTRAINT urun_hammadde_urun_id_fkey FOREIGN KEY (urun_id) REFERENCES public.urun(id) ON DELETE CASCADE;


--
-- Name: ariza_kaydi Enable all for ariza_kaydi; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all for ariza_kaydi" ON public.ariza_kaydi USING (true) WITH CHECK (true);


--
-- Name: bakim_kaydi Enable all for bakim_kaydi; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all for bakim_kaydi" ON public.bakim_kaydi USING (true) WITH CHECK (true);


--
-- Name: hammadde Enable all for hammadde; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all for hammadde" ON public.hammadde USING (true) WITH CHECK (true);


--
-- Name: hammadde_giris Enable all for hammadde_giris; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all for hammadde_giris" ON public.hammadde_giris USING (true) WITH CHECK (true);


--
-- Name: makine Enable all for makine; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all for makine" ON public.makine USING (true) WITH CHECK (true);


--
-- Name: uretim Enable all for uretim; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all for uretim" ON public.uretim USING (true) WITH CHECK (true);


--
-- Name: urun Enable all for urun; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all for urun" ON public.urun USING (true) WITH CHECK (true);


--
-- Name: urun_hammadde Enable all for urun_hammadde; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all for urun_hammadde" ON public.urun_hammadde USING (true) WITH CHECK (true);


--
-- Name: siparis Herkes siparişleri görüntüleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Herkes siparişleri görüntüleyebilir" ON public.siparis FOR SELECT USING (true);


--
-- Name: profiles Kullanıcılar kendi profilini görebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Kullanıcılar kendi profilini görebilir" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));


--
-- Name: profiles Kullanıcılar kendi profilini güncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Kullanıcılar kendi profilini güncelleyebilir" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id));


--
-- Name: user_roles Kullanıcılar kendi rollerini görebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Kullanıcılar kendi rollerini görebilir" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: siparis Yetkili roller sipariş oluşturabilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Yetkili roller sipariş oluşturabilir" ON public.siparis FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'sirket_sahibi'::public.app_role) OR public.has_role(auth.uid(), 'genel_mudur'::public.app_role) OR public.has_role(auth.uid(), 'muhasebe'::public.app_role)));


--
-- Name: siparis Yöneticiler sipariş güncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Yöneticiler sipariş güncelleyebilir" ON public.siparis FOR UPDATE USING ((public.has_role(auth.uid(), 'sirket_sahibi'::public.app_role) OR public.has_role(auth.uid(), 'genel_mudur'::public.app_role)));


--
-- Name: siparis Yöneticiler sipariş silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Yöneticiler sipariş silebilir" ON public.siparis FOR DELETE USING ((public.has_role(auth.uid(), 'sirket_sahibi'::public.app_role) OR public.has_role(auth.uid(), 'genel_mudur'::public.app_role)));


--
-- Name: ariza_kaydi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ariza_kaydi ENABLE ROW LEVEL SECURITY;

--
-- Name: bakim_kaydi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bakim_kaydi ENABLE ROW LEVEL SECURITY;

--
-- Name: hammadde; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hammadde ENABLE ROW LEVEL SECURITY;

--
-- Name: hammadde_giris; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hammadde_giris ENABLE ROW LEVEL SECURITY;

--
-- Name: makine; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.makine ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: siparis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.siparis ENABLE ROW LEVEL SECURITY;

--
-- Name: uretim; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.uretim ENABLE ROW LEVEL SECURITY;

--
-- Name: urun; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.urun ENABLE ROW LEVEL SECURITY;

--
-- Name: urun_hammadde; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.urun_hammadde ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles Şirket sahibi ve genel müdür roller ekleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Şirket sahibi ve genel müdür roller ekleyebilir" ON public.user_roles FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'sirket_sahibi'::public.app_role) OR public.has_role(auth.uid(), 'genel_mudur'::public.app_role)));


--
-- Name: user_roles Şirket sahibi ve genel müdür roller güncelleyebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Şirket sahibi ve genel müdür roller güncelleyebilir" ON public.user_roles FOR UPDATE USING ((public.has_role(auth.uid(), 'sirket_sahibi'::public.app_role) OR public.has_role(auth.uid(), 'genel_mudur'::public.app_role)));


--
-- Name: user_roles Şirket sahibi ve genel müdür roller silebilir; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Şirket sahibi ve genel müdür roller silebilir" ON public.user_roles FOR DELETE USING ((public.has_role(auth.uid(), 'sirket_sahibi'::public.app_role) OR public.has_role(auth.uid(), 'genel_mudur'::public.app_role)));


--
-- PostgreSQL database dump complete
--


