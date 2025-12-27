import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Debug() {
    const [logs, setLogs] = useState<string[]>([]);
    const [envInfo, setEnvInfo] = useState<any>({});
    const [loading, setLoading] = useState(false);

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

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

            addLog("--- Test 2: Supabase Client ---");
            addLog("Querying 'profiles' table...");
            const { data, error, status, statusText } = await (supabase.from('profiles') as any).select('*').limit(1);

            if (error) {
                addLog(`❌ ERROR: ${error.message}`);
                addLog(`Details: Code=${error.code}, Hint=${error.hint}`);
                addLog(`Status: ${status} ${statusText}`);
                console.error("Supabase Error:", error);
            } else {
                addLog('✅ SUCCESS: Connected to profiles!');
                if (data && data.length > 0) {
                    addLog(`Data: ${JSON.stringify(data[0])}`);
                } else {
                    addLog('Data: [] (Empty)');
                }
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
        addLog("--- Test 4: Uretim Kayit Query ---");
        try {
            // Test the exact failing query from Uretim.tsx
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
                .gte("baslama_zamani", startDate.toISOString())
                .limit(1);

            if (error) {
                addLog(`❌ Uretim Kayit Error: ${error.message}`);
                addLog(`Details: Code=${error.code}, Hint=${error.hint}, Details=${error.details}`);
                console.error("Supabase Error Details:", error);
                toast.error(`Hata: ${error.message} (${error.details || error.hint || ''})`);
            } else {
                addLog('✅ Uretim Kayit Success!');
                if (data && data.length > 0) {
                    addLog(`Data: ${JSON.stringify(data[0])}`);
                } else {
                    addLog('Data: [] (Empty)');
                }
                toast.success("Sorgu başarılı!");
                console.log("Data:", data);
            }
        } catch (e: any) {
            addLog(`❌ Uretim Kayit Exception: ${e.message}`);
            toast.error("İstisna: " + e.message);
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
        testConnection();
    }, []);

    return (
        <div className="p-8 bg-black text-green-400 font-mono min-h-screen space-y-4">
            <h1 className="text-2xl font-bold text-white">Debug Paneli</h1>

            <div className="flex gap-4">
                <Button onClick={testConnection} disabled={loading}>
                    {loading ? "Test Ediliyor..." : "Bağlantıyı Test Et"}
                </Button>
                <Button onClick={testUretimSorgusu} disabled={loading} variant="destructive">
                    Üretim Sorgusunu Test Et
                </Button>
            </div>

            <div className="mb-6 border border-green-800 p-4 rounded text-sm">
                <h2 className="text-xl mb-2 text-white">Environment Variables</h2>
                <p>VITE_SUPABASE_URL: <span className="text-white">{envInfo.url}</span></p>
                <p>KEY Length: <span className="text-white">{envInfo.keyLength}</span></p>
                <p>KEY Prefix: <span className="text-white">{envInfo.keyPrefix}</span></p>
            </div>

            <div className="border border-green-800 p-4 rounded bg-gray-900 h-96 overflow-auto">
                <h2 className="text-xl mb-2 text-white">Connection Logs</h2>
                {logs.map((log, i) => (
                    <div key={i} className="mb-1">{log}</div>
                ))}
            </div>
        </div>
    );
}
