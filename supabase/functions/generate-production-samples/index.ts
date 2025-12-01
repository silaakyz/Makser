import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateRequest {
  days?: number
  maxPerDay?: number
}

const SAMPLE_PERSONEL = [
  'Ahmet Yılmaz',
  'Ayşe Demir',
  'Mehmet Kaya',
  'Fatma Çelik',
  'Ali Öztürk',
  'Zeynep Şahin',
  'Elif Aydın',
  'Mustafa Arslan',
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const body = (await req.json().catch(() => ({}))) as GenerateRequest
    const days = Math.min(Math.max(body.days ?? 14, 1), 60)
    const maxPerDay = Math.min(Math.max(body.maxPerDay ?? 3, 1), 10)

    const { data: machines, error: machinesError } = await supabase
      .from('makine')
      .select('id, ad, uretim_kapasitesi')
      .in('durum', ['aktif', 'boşta'])
      .limit(50)

    if (machinesError) throw machinesError
    if (!machines || machines.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Önce makine kayıtları eklemelisiniz.',
        }),
        { headers: corsHeaders, status: 400 },
      )
    }

    const { data: products, error: productsError } = await supabase
      .from('urun')
      .select('id, ad, stok_miktari, satis_fiyati')
      .limit(50)

    if (productsError) throw productsError
    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Önce ürün kayıtları eklemelisiniz.',
        }),
        { headers: corsHeaders, status: 400 },
      )
    }

    const { data: personel, error: personelError } = await supabase
      .from('personel')
      .select('ad, soyad')
      .limit(50)

    if (personelError) {
      console.warn('Personel tablosu okunamadı, varsayılan isimler kullanılacak.')
    }

    const personelNames =
      personel?.map((p) => [p.ad, p.soyad].filter(Boolean).join(' ')).filter(Boolean) ??
      SAMPLE_PERSONEL

    const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
    const records: any[] = []

    for (let dayOffset = days; dayOffset > 0; dayOffset--) {
      const baseDate = new Date()
      baseDate.setDate(baseDate.getDate() - dayOffset)

      const productionCount = Math.floor(Math.random() * maxPerDay) + 1
      for (let i = 0; i < productionCount; i++) {
        const machine = randomItem(machines)
        const product = randomItem(products)

        const capacity = Math.max(machine.uretim_kapasitesi || 50, 10)
        const hedefAdet = Math.max(
          5,
          Math.round(
            capacity *
              (Math.random() * 1.8 + 0.6), // 0.6x - 2.4x kapasite arasında hedef
          ),
        )
        const performansKatsayi = Math.random() * 0.25 + 0.7 // %70-95 arası
        const uretilenAdet = Math.min(
          hedefAdet,
          Math.round(hedefAdet * performansKatsayi),
        )

        const startHour = 6 + Math.floor(Math.random() * 8) // 06:00 - 14:00 arası başlama
        const startMinute = Math.floor(Math.random() * 4) * 15

        const startTime = new Date(
          Date.UTC(
            baseDate.getUTCFullYear(),
            baseDate.getUTCMonth(),
            baseDate.getUTCDate(),
            startHour,
            startMinute,
          ),
        )

        const durationHours = Math.max(1.5, hedefAdet / capacity * (Math.random() * 0.6 + 0.9))
        const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000)

        const durum =
          uretilenAdet >= hedefAdet
            ? 'tamamlandi'
            : Math.random() > 0.5
            ? 'devam_ediyor'
            : 'beklemede'

        records.push({
          urun_id: product.id,
          makine_id: machine.id,
          baslangic_zamani: startTime.toISOString(),
          bitis_zamani: durum === 'tamamlandi' ? endTime.toISOString() : null,
          hedef_adet: hedefAdet,
          uretilen_adet: uretilenAdet,
          durum,
          calisan_personel: randomItem(personelNames),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    }

    if (records.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Oluşturulacak kayıt bulunamadı.',
        }),
        { headers: corsHeaders, status: 400 },
      )
    }

    // Insert in chunks to avoid payload limits
    const chunkSize = 50
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize)
      const { error: insertError } = await supabase.from('uretim').insert(chunk)
      if (insertError) throw insertError
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted: records.length,
        days,
        samplePersonelCount: personelNames.length,
      }),
      { headers: corsHeaders },
    )
  } catch (error) {
    console.error('generate-production-samples error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      }),
      { headers: corsHeaders, status: 400 },
    )
  }
})


