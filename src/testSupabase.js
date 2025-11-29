import { createClient } from '@supabase/supabase-js'

// ✔️ Senin gerçek Supabase bilgilerin
const supabaseUrl = "https://zkjbbqqrjanlfpeybajt.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpramJicXFyamFubGZwZXliYWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTM1OTUsImV4cCI6MjA3OTY2OTU5NX0.kLhozeMLcLp9kInILAFZ9Qr14zTYSFiyFS8MBl16Y7I"

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase
    .from("musteriler")   // ✔️ Supabase sana "musteriler" olduğunu söyledi
    .select("*")

  console.log("DATA:", data)
  console.log("ERROR:", error)
}

test()
