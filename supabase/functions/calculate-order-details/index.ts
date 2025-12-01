import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderRequest {
  urun_id: string;
  miktar: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { urun_id, miktar }: OrderRequest = await req.json();

    console.log('Calculating order details for product:', urun_id, 'quantity:', miktar);

    // 1. Get product recipe (raw materials needed)
    const { data: recipe, error: recipeError } = await supabaseClient
      .from('urun_hammadde')
      .select('hammadde_id, miktar, hammadde(ad, stok_miktari)')
      .eq('urun_id', urun_id);

    if (recipeError) {
      console.error('Recipe fetch error:', recipeError);
      throw recipeError;
    }

    // 2. Check if we have enough raw materials
    const materialsNeeded = recipe?.map(item => {
      const hammadde = Array.isArray(item.hammadde) ? item.hammadde[0] : item.hammadde;
      return {
        id: item.hammadde_id,
        name: hammadde?.ad || 'Unknown',
        needed: parseFloat(item.miktar) * miktar,
        available: parseFloat(hammadde?.stok_miktari || '0')
      };
    }) || [];

    const insufficientMaterials = materialsNeeded.filter(m => m.needed > m.available);

    // 3. Get available machines (aktif or boşta)
    const { data: machines, error: machinesError } = await supabaseClient
      .from('makine')
      .select('id, ad, uretim_kapasitesi, durum')
      .in('durum', ['aktif', 'boşta']);

    if (machinesError) {
      console.error('Machines fetch error:', machinesError);
      throw machinesError;
    }

    // 4. Get current production queue
    const { data: currentProduction, error: prodError } = await supabaseClient
      .from('uretim')
      .select('hedef_adet, uretilen_adet, makine_id')
      .eq('durum', 'devam_ediyor');

    if (prodError) {
      console.error('Production fetch error:', prodError);
      throw prodError;
    }

    // 5. Calculate average production capacity
    const totalCapacity = machines?.reduce((sum, m) => sum + m.uretim_kapasitesi, 0) || 0;
    const avgCapacity = machines && machines.length > 0 ? totalCapacity / machines.length : 50;

    // 6. Calculate current workload
    const currentWorkload = currentProduction?.reduce((sum, p) => 
      sum + (p.hedef_adet - p.uretilen_adet), 0) || 0;

    // 7. Estimate production time in hours
    const hoursForCurrentWork = avgCapacity > 0 ? currentWorkload / avgCapacity : 0;
    const hoursForNewOrder = avgCapacity > 0 ? miktar / avgCapacity : 0;
    const totalHours = hoursForCurrentWork + hoursForNewOrder;

    // 8. Convert to days (assuming 8-hour workday)
    const estimatedDays = Math.ceil(totalHours / 8);

    // 9. Calculate delivery date
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + estimatedDays);

    console.log('Estimated delivery:', estimatedDays, 'days', deliveryDate.toISOString().split('T')[0]);

    return new Response(
      JSON.stringify({
        success: true,
        estimatedDays,
        deliveryDate: deliveryDate.toISOString().split('T')[0],
        materialsNeeded,
        insufficientMaterials,
        canProduce: insufficientMaterials.length === 0,
        details: {
          avgCapacity,
          currentWorkload,
          totalHours,
          availableMachines: machines?.length || 0
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    )
  } catch (error) {
    console.error('Error in calculate-order-details:', error);
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
