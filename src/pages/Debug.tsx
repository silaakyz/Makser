import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Debug() {
    const [logs, setLogs] = useState<string[]>([]);
    const [envInfo, setEnvInfo] = useState<any>({});
    const [loading, setLoading] = useState(false);

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const seedData = async () => {
        setLoading(true);
        addLog("--- Seeding Data ---");
        try {
            // 1. Makine
            const { data: makine, error: mErr } = await supabase.from('makine').insert({
                makine_id: 101,
                ad: 'CNC-01',
                tur: 'Kesim',
                kapasite: '1000',
                toplam_calisma_saati: 0
            }).select().maybeSingle();
            if (mErr) addLog(`❌ Makine Seed: ${mErr.message}`);
            else addLog(`✅ Makine Seed: OK`);

            // 2. Urun
            const { data: urun, error: uErr } = await supabase.from('urun').insert({
                // urun_id is identity, let DB generate or force if needed (schema says identity)
                // We let DB generate by not providing it, but we need the ID.
                ad: 'Test Ürün A',
                tur: 'Mobilya',
                satis_fiyati: 5000
            }).select().maybeSingle();
            if (uErr) addLog(`❌ Urun Seed: ${uErr.message}`);
            else addLog(`✅ Urun Seed: OK (ID: ${urun?.urun_id})`);

            // 3. Hammadde
            const { error: hErr } = await supabase.from('hammadde').insert({
                hammadde_id: 201,
                stok_adi: 'MDF Plaka',
                tedarikci_id: 1, // Assumes tedarikci exists? Wait, let's create tedarikci first or skip fk if nullable? Tedarikci is NOT NULL fk.
                // We need a TEDARIKCI first!
                kalan_miktar: "100",
                birim: "adet",
                alis_fiyati: "200"
            });
            // We need to insert Tedarikci first
            const { error: tErr } = await supabase.from('tedarikciler').insert({
                tedarikci_id: 1,
                firma: 'Hammadde Tedarik A.Ş.',
                ad: 'Ahmet',
                soyad: 'Yılmaz',
                aktif: 'Evet'
            });
            if (tErr && !tErr.message.includes('duplicate')) addLog(`❌ Tedarikci Seed: ${tErr.message}`);

            if (hErr) addLog(`❌ Hammadde Seed: ${hErr.message}`);
            else addLog(`✅ Hammadde Seed: OK`);

            // 4. Uretim Kayit
            if (urun?.urun_id) {
                const { error: urErr } = await supabase.from('uretim_kayit').insert({
                    uretim_id: 5001,
                    urun_id: urun.urun_id,
                    makine_id: 101, // References CNC-01
                    baslama_zamani: new Date().toISOString()
                });
                if (urErr) addLog(`❌ Uretim Kayit Seed: ${urErr.message}`);
                else addLog(`✅ Uretim Kayit Seed: OK`);

                // 5. Urun Stok
                const { error: usErr } = await supabase.from('urun_stok').insert({
                    urun_stok_id: 1,
                    urun_id: urun.urun_id,
                    miktar: 50,
                    son_guncelleme: new Date().toISOString()
                });
                if (usErr) addLog(`❌ Urun Stok Seed: ${usErr.message}`);
                else addLog(`✅ Urun Stok Seed: OK`);
            }

        } catch (e: any) {
            addLog(`❌ Seed Exception: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testConnection = async () => {
        setLoading(true);
        try {
            const url = import.meta.env.VITE_SUPABASE_URL;
            const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

            addLog(`Testing URL: ${url}`);
            addLog("--- Test 1: Raw Fetch ---");
            try {
                const restUrl = `${url}/rest/v1/profiles?select=*&limit=1`;
                addLog(`Fetching: ${restUrl}`);

                const response = await fetch(restUrl, {
                    headers: {
                        'apikey': key || '',
                        'Authorization': `Bearer ${key || ''}`
                    }
                });

                addLog(`Response Status: ${response.status} ${response.statusText}`);
                if (response.ok) {
                    const jsonData = await response.json();
                    addLog(`✅ Raw Fetch Success: ${JSON.stringify(jsonData)}`);
                } else {
                    const text = await response.text();
                    addLog(`❌ Raw Fetch Failed: ${text}`);
                }
            } catch (fetchErr: any) {
                addLog(`❌ Raw Fetch Exception: ${fetchErr.message}`);
            }

            addLog("--- Test 3: User Roles (Control) ---");
            const roleRes = await supabase.from('user_roles').select('*').limit(1);
            if (roleRes.error) {
                addLog(`❌ user_roles Error: ${roleRes.error.message}`);
            } else {
                addLog(`✅ user_roles Success: found ${roleRes.data.length} rows`);
            }

        } catch (err: any) {
            addLog(`❌ CRITICAL ERROR: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testUretimSorgusu = async () => {
        setLoading(true);
        addLog("--- Test 4: General Data Check ---");
        try {
            // 1. Check Table Counts
            const tables = ['makine', 'urun', 'hammadde', 'siparis', 'uretim_kayit'];
            for (const table of tables) {
                const { count, error } = await supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true });

                if (error) {
                    addLog(`❌ Count ${table}: ${error.message}`);
                } else {
                    addLog(`ℹ️ Count ${table}: ${count} rows`);
                }
            }

            // 2. Fetch Sample Uretim Data (No Filter)
            addLog("Fetching uretim_kayit sample (no filter)...");
            const { data, error } = await supabase
                .from("uretim_kayit")
                .select(`
                    uretim_id, 
                    baslama_zamani, 
                    bitis_zamani, 
                    makine_id, 
                    urun_id,
                    urun(ad),
                    makine(ad)
                `)
                .limit(5);

            if (error) {
                addLog(`❌ Uretim Query Error: ${error.message}`);
                console.error("Supabase Error Details:", error);
            } else {
                addLog(`✅ Uretim Query Success! Rows: ${data?.length}`);
                if (data && data.length > 0) {
                    addLog(`Sample: ${JSON.stringify(data[0])}`);
                } else {
                    addLog('⚠️ Data is empty array [] - Possible RLS issue or Empty Table');
                }
            }
        } catch (e: any) {
            addLog(`❌ Exception: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        setEnvInfo({
            url: url ? url : 'MISSING',
            keyLength: key ? key.length : 0,
            keyPrefix: key ? key.substring(0, 5) : 'N/A'
        });
        // Auto-test on load removed to be less noisy, manual trigger is better
    }, []);

    return (
        <div className="p-8 bg-black text-green-400 font-mono min-h-screen space-y-4">
            <h1 className="text-2xl font-bold text-white">Debug Paneli</h1>

            <div className="flex gap-4">
                <Button onClick={testConnection} disabled={loading}>
                    {loading ? "..." : "Bağlantıyı Test Et"}
                </Button>
                <Button onClick={testUretimSorgusu} disabled={loading} variant="secondary">
                    Veri Kontrolü (Count)
                </Button>
                <Button onClick={seedData} disabled={loading} variant="destructive">
                    Örnek Veri Ekle (+1)
                </Button>
            </div>

            <div className="mb-6 border border-green-800 p-4 rounded text-sm">
                <h2 className="text-xl mb-2 text-white">Environment Variables</h2>
                <p>VITE_SUPABASE_URL: <span className="text-white">{envInfo.url}</span></p>
            </div>

            <div className="border border-green-800 p-4 rounded bg-gray-900 h-96 overflow-auto">
                <h2 className="text-xl mb-2 text-white">Logs</h2>
                {logs.map((log, i) => (
                    <div key={i} className="mb-1">{log}</div>
                ))}
            </div>
        </div>
    );
}
