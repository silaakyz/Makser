-- FIX PEMISSIONS & RLS POLICIES
-- Run this in Supabase SQL Editor to make your existing data visible to the application.

-- 1. Enable RLS on all tables (Best Practice, though they might already be enabled)
ALTER TABLE public.makine ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.urun ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hammadde ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siparis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uretim_kayit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tedarikciler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.musteriler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.makine_ariza ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.makine_bakim ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.urun_stok ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.urun_recetesi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hammadde_hareket ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siparis_maliyet ENABLE ROW LEVEL SECURITY;

-- 2. Create "Allow All" Policies for Development
-- This allows both anonymous (unauthenticated) and authenticated users to Read/Write
-- WARNING: For production, you should restrict these policies!

-- Helper macro to drop and recreate policy
DO $$ 
DECLARE 
    tables text[] := ARRAY[
        'makine', 'urun', 'hammadde', 'siparis', 'uretim_kayit', 
        'tedarikciler', 'musteriler', 'personel', 'makine_ariza', 
        'makine_bakim', 'urun_stok', 'urun_recetesi', 'hammadde_hareket', 'siparis_maliyet'
    ];
    t text;
BEGIN 
    FOREACH t IN ARRAY tables LOOP
        -- Drop existing policies to avoid conflicts
        EXECUTE format('DROP POLICY IF EXISTS "Allow all for %I" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable read access for all users" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable insert for all users" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable update for all users" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable delete for all users" ON public.%I', t);
        
        -- Create permissive policy
        EXECUTE format('CREATE POLICY "Allow all for %I" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t, t);
    END LOOP;
END $$;

-- 3. Grant Permissions to roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
