import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function Debug() {
    const [logs, setLogs] = useState<string[]>([]);
    const [envInfo, setEnvInfo] = useState<any>({});

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    useEffect(() => {
        // 1. Check Env Vars
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

        setEnvInfo({
            url: url ? url : 'MISSING',
            keyLength: key ? key.length : 0,
            keyPrefix: key ? key.substring(0, 5) : 'N/A'
        });

        addLog('Starting Connection Test...');

        const testConnection = async () => {
            try {
                addLog(`Testing URL: ${url}`);

                // --- TEST 1: RAW FETCH ---
                addLog("--- Test 1: Raw Fetch ---");
                try {
                    // Construct REST URL manually
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

                // --- TEST 2: SUPABASE CLIENT ---
                addLog("--- Test 2: Supabase Client ---");
                // Test existing table 'profiles'
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

                // --- TEST 3: User Roles (Control) ---
                addLog("--- Test 3: User Roles (Control) ---");
                const roleRes = await supabase.from('user_roles').select('*').limit(1);
                if (roleRes.error) {
                    addLog(`❌ user_roles Error: ${roleRes.error.message}`);
                } else {
                    addLog(`✅ user_roles Success: found ${roleRes.data.length} rows`);
                }

            } catch (err: any) {
                addLog(`❌ CRITICAL ERROR: ${err.message}`);
            }
        };

        testConnection();
    }, []);

    return (
        <div className="p-8 bg-black text-green-400 font-mono min-h-screen">
            <h1 className="text-2xl font-bold mb-4">System Debugger V2</h1>

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
