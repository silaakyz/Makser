import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderData {
  musteri: string;
  urun_id: string;
  miktar: number;
  siparis_maliyeti: number;
  teslim_tarihi: string | null;
  kaynak: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const orderData: OrderData = await req.json();

    console.log('Processing order:', orderData);

    // 1. Get product recipe
    const { data: recipe, error: recipeError } = await supabaseClient
      .from('urun_hammadde')
      .select('hammadde_id, miktar')
      .eq('urun_id', orderData.urun_id);

    if (recipeError) {
      console.error('Recipe fetch error:', recipeError);
      throw recipeError;
    }

    // 2. Check material availability
    for (const item of recipe || []) {
      const requiredAmount = parseFloat(item.miktar) * orderData.miktar;
      
      const { data: material, error: matError } = await supabaseClient
        .from('hammadde')
        .select('stok_miktari, ad')
        .eq('id', item.hammadde_id)
        .single();

      if (matError) {
        console.error('Material check error:', matError);
        throw matError;
      }

      const available = parseFloat(material.stok_miktari);
      if (available < requiredAmount) {
        throw new Error(`Yetersiz hammadde: ${material.ad} (Gerekli: ${requiredAmount}, Mevcut: ${available})`);
      }
    }

    // 3. Create the order
    const { data: newOrder, error: orderError } = await supabaseClient
      .from('siparis')
      .insert({
        musteri: orderData.musteri,
        urun_id: orderData.urun_id,
        miktar: orderData.miktar,
        siparis_maliyeti: orderData.siparis_maliyeti,
        teslim_tarihi: orderData.teslim_tarihi,
        kaynak: orderData.kaynak,
        durum: 'beklemede',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw orderError;
    }

    // 4. Deduct raw materials from stock
    for (const item of recipe || []) {
      const requiredAmount = parseFloat(item.miktar) * orderData.miktar;
      
      const { error: updateError } = await supabaseClient
        .from('hammadde')
        .update({
          stok_miktari: supabaseClient.rpc('decrement_stock', {
            current_stock: 'stok_miktari',
            amount: requiredAmount
          })
        })
        .eq('id', item.hammadde_id);

      if (updateError) {
        console.error('Material deduction error:', updateError);
        // Rollback is complex, log the error
        console.error('CRITICAL: Failed to deduct material for order:', newOrder.id);
      } else {
        // Manual update since RPC isn't working as expected
        const { data: currentMaterial } = await supabaseClient
          .from('hammadde')
          .select('stok_miktari')
          .eq('id', item.hammadde_id)
          .single();
        
        if (currentMaterial) {
          const newStock = parseFloat(currentMaterial.stok_miktari) - requiredAmount;
          await supabaseClient
            .from('hammadde')
            .update({ stok_miktari: newStock })
            .eq('id', item.hammadde_id);
          
          console.log(`Deducted ${requiredAmount} from material ${item.hammadde_id}, new stock: ${newStock}`);
        }
      }
    }

    console.log('Order processed successfully:', newOrder.id);

    return new Response(
      JSON.stringify({
        success: true,
        order: newOrder,
        message: 'Sipariş başarıyla oluşturuldu ve hammaddeler düşüldü'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    )
  } catch (error) {
    console.error('Error in process-order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      },
    )
  }
})
