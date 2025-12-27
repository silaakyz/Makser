// src/services/manufacturing/index.ts

import { supabase } from '@/integrations/supabase/client';
import type { Machine, RawMaterial, Product, ProductionOrder, OEEMetrics, Alert } from '@/modules/types';
import { mockData } from './mockData';

export const productionService = {
  async getOEEMetrics(days: number = 7): Promise<OEEMetrics[]> {
    return mockData.oeeMetrics.slice(-days);
  },

  async getActiveProductions() {
    const { data, error } = await supabase
      .from('uretim_kayit')
      .select(
        `uretim_id,
         baslama_zamani,
         bitis_zamani,
         makine:makine(ad),
         urun:urun(ad)`
      )
      // .eq('durum', 'devam_ediyor') // Durum column is derived/missing in uretim_kayit
      .is('bitis_zamani', null) // Equivalent to devam_ediyor
      .order('baslama_zamani', { ascending: true });

    if (error) throw error;

    return (data || []).map((row: any) => {
      const start = row.baslama_zamani ? new Date(row.baslama_zamani) : null;
      const end = row.bitis_zamani ? new Date(row.bitis_zamani) : null;
      const estimated = end || (start ? new Date(start.getTime() + 4 * 60 * 60 * 1000) : null);

      return {
        id: String(row.uretim_id),
        machine: row.makine?.ad || 'Bilinmiyor',
        status: end ? 'tamamlandi' : 'devam_ediyor',
        product: row.urun?.ad || 'Bilinmiyor',
        startTime: start ? start.toLocaleString('tr-TR') : '-',
        estimatedEnd: estimated ? estimated.toLocaleString('tr-TR') : '-',
        progress: 0 // Mocking progress as it is not in valid schema
      };
    });
  },

  async getActiveMachines(): Promise<Machine[]> {
    const { data } = await supabase
      .from('makine')
      .select('makine_id, ad, kapasite, son_bakim_tarihi')
      // .eq('durum', 'aktif') // durum col missing
      .order('ad');

    return (data || []).map((m: any) => ({
      id: String(m.makine_id),
      name: m.ad,
      status: 'active', // Default to active as status col is missing
      capacity: parseInt(m.kapasite || '0'),
      currentLoad: 0,
      totalUptime: 0,
      totalDowntime: 0,
      mtbf: 0,
      faults: [],
      lastMaintenance: m.son_bakim_tarihi || '-',
      nextMaintenance: '-'
    }));
  }
};

export const machineService = {
  async getAll(): Promise<Machine[]> {
    const { data: machines } = await supabase.from('makine').select('*');

    // Fetch active productions to fill details
    const { data: activeProductions } = await supabase
      .from('uretim_kayit')
      .select(`
        makine_id,
        baslama_zamani,
        hedef_adet,
        uretilen_adet,
        urun (ad)
      `)
      .is('bitis_zamani', null);

    const activeMap = new Map();
    (activeProductions || []).forEach((p: any) => {
      activeMap.set(p.makine_id, p);
    });

    return (machines || []).map((m: any) => {
      const active = activeMap.get(m.makine_id);

      // Status priority: DB Status (Maintenance/Fault) > Active Prod > Idle
      // If DB has 'maintenance' or 'fault', force it.
      // If DB is 'active' or 'idle' (or null), check if running production.

      let status: 'active' | 'idle' | 'maintenance' | 'fault' = 'idle';

      if (m.durum === 'maintenance' || m.durum === 'fault') {
        status = m.durum;
      } else if (active) {
        status = 'active';
      } else {
        status = 'idle';
      }

      let estimatedEnd = '-';
      if (active && active.baslama_zamani) {
        const start = new Date(active.baslama_zamani);
        estimatedEnd = new Date(start.getTime() + 4 * 60 * 60 * 1000).toLocaleString('tr-TR');
      }

      return {
        id: String(m.makine_id),
        name: m.ad,
        status: status,
        currentProduct: active ? active.urun?.ad : '-',
        startTime: active ? new Date(active.baslama_zamani).toLocaleString('tr-TR') : '-',
        estimatedEnd: active ? estimatedEnd : '-',
        // Aktif iş varsa kapasite olarak hedef adedi göster (Yük = Üretilen / Hedef)
        capacity: active && active.hedef_adet ? active.hedef_adet : parseInt(m.kapasite || '0'),
        currentLoad: active ? (active.uretilen_adet || 0) : 0,
        totalUptime: 0,
        totalDowntime: 0,
        mtbf: 0,
        faults: [],
        lastMaintenance: m.son_bakim_tarihi || '-',
        nextMaintenance: m.sonraki_bakim_tarihi || '-'
      };
    });
  },

  async getById(id: string): Promise<Machine> {
    const { data } = await supabase.from('makine').select('*').eq('makine_id', id).maybeSingle();
    if (!data) throw new Error('Machine not found');

    return {
      id: String(data.makine_id),
      name: data.ad,
      status: 'active',
      capacity: parseInt(data.kapasite || '0'),
      currentLoad: 0,
      totalUptime: 0,
      totalDowntime: 0,
      mtbf: 0,
      faults: [],
      lastMaintenance: data.son_bakim_tarihi || '-',
      nextMaintenance: data.sonraki_bakim_tarihi || '-'
    };
  }
};

export const stockService = {
  async getRawMaterials(): Promise<RawMaterial[]> {
    const { data } = await supabase.from('hammadde').select('*');

    return (data || []).map((h: any) => ({
      id: String(h.hammadde_id),
      code: String(h.hammadde_id).padStart(8, '0'),
      name: h.stok_adi,
      unit: h.birim,
      currentStock: parseFloat(h.kalan_miktar || '0'),
      minStock: parseFloat(h.kritik_stok || '0'),
      maxStock: parseFloat(h.kritik_stok || '0') * 3,
      costPerUnit: parseFloat(h.alis_fiyati || '0'),
      supplier: 'Aktarılan',
      averageConsumption: 0,
      lastOrderDate: '-'
    }));
  },

  async getProducts(): Promise<Product[]> {
    // Joining urun_stok to get quantity
    const { data } = await supabase.from('urun').select('*, urun_stok(miktar)');

    return (data || []).map((u: any) => ({
      id: String(u.urun_id),
      code: String(u.urun_id).padStart(8, '0'),
      name: u.ad,
      unit: 'adet',
      currentStock: u.urun_stok?.[0]?.miktar || 0,
      minStock: 0,
      productionCost: (u.satis_fiyati || 0) * 0.7,
      sellingPrice: u.satis_fiyati || 0,
      requiredMaterials: [],
      width: 0,
      length: 0,
      height: 0,
      volume: 0,
      weight: 0,
      maxPressure: 0,
      maxTemperature: 0,
      imageUrl: ''
    }));
  }
};

export const orderService = {
  async getAll(): Promise<ProductionOrder[]> {
    const { data } = await supabase
      .from('siparis')
      .select('*, urun(ad), musteri:musteriler(isim, soyisim)')
      .order('siparis_tarihi', { ascending: false });

    const realOrders = (data || []).map((s: any, idx: number) => ({
      id: String(s.siparis_id),
      orderNumber: `ORD-${s.siparis_id}`,
      productId: String(s.urun_id || ''),
      productName: s.urun?.ad || 'Bilinmeyen',
      quantity: s.miktar || 1,
      status: (s.durum === 'tamamlandi' ? 'completed' : s.durum === 'uretimde' ? 'in_progress' : 'pending') as any,
      orderDate: s.siparis_tarihi,
      deliveryDate: s.teslim_tarihi,
      estimatedDelivery: s.teslim_tarihi,
      customer: s.musteri ? `${s.musteri.isim} ${s.musteri.soyisim}` : 'Bilinmeyen',
      priority: 'medium' as any,
      productionSource: s.kaynak || 'production',
      progress: s.durum === 'tamamlandi' ? 100 : s.durum === 'uretimde' ? 50 : 0,
      assignedMachines: []
    }));

    // Yapay Veriler (Mock Data)
    const fakeOrders: ProductionOrder[] = [
      { id: '9001', orderNumber: 'ORD-9001', productId: '3012', productName: 'Isı Pompası 16kW', quantity: 5, status: 'in_progress', orderDate: '2024-12-25', deliveryDate: '2025-01-15', estimatedDelivery: '2025-01-15', customer: 'Ahmet Yılmaz', priority: 'high', productionSource: 'Web', progress: 45, assignedMachines: [] },
      { id: '9002', orderNumber: 'ORD-9002', productId: '3013', productName: 'Klima Santrali', quantity: 2, status: 'pending', orderDate: '2024-12-26', deliveryDate: '2025-02-01', estimatedDelivery: '2025-02-01', customer: 'Ayşe Kaya', priority: 'medium', productionSource: 'Bayi', progress: 0, assignedMachines: [] },
      { id: '9003', orderNumber: 'ORD-9003', productId: '3015', productName: 'Kalorifer Kazanı', quantity: 1, status: 'completed', orderDate: '2024-12-10', deliveryDate: '2024-12-28', estimatedDelivery: '2024-12-28', customer: 'Mehmet Demir', priority: 'low', productionSource: 'Referans', progress: 100, assignedMachines: [] },
      { id: '9004', orderNumber: 'ORD-9004', productId: '3016', productName: 'Sanayi Tipi Fan', quantity: 10, status: 'in_progress', orderDate: '2024-12-20', deliveryDate: '2025-01-10', estimatedDelivery: '2025-01-10', customer: 'Fatma Çelik', priority: 'high', productionSource: 'Telefon', progress: 70, assignedMachines: [] },
      { id: '9005', orderNumber: 'ORD-9005', productId: '3014', productName: 'Yerden Isıtma Paneli', quantity: 50, status: 'pending', orderDate: '2024-12-27', deliveryDate: '2025-01-30', estimatedDelivery: '2025-01-30', customer: 'Mustafa Şahin', priority: 'medium', productionSource: 'Web', progress: 0, assignedMachines: [] },
      { id: '9006', orderNumber: 'ORD-9006', productId: '3012', productName: 'Isı Pompası 10kW', quantity: 3, status: 'pending', orderDate: '2024-12-27', deliveryDate: '2025-02-15', estimatedDelivery: '2025-02-15', customer: 'Zeynep Tekin', priority: 'medium', productionSource: 'Linkedin', progress: 0, assignedMachines: [] },
      { id: '9007', orderNumber: 'ORD-9007', productId: '3013', productName: 'Klima Dış Ünite', quantity: 8, status: 'in_progress', orderDate: '2024-12-22', deliveryDate: '2025-01-20', estimatedDelivery: '2025-01-20', customer: 'Ali Vural', priority: 'high', productionSource: 'Bayi', progress: 25, assignedMachines: [] },
      { id: '9008', orderNumber: 'ORD-9008', productId: '3015', productName: 'Kazan Brülörü', quantity: 4, status: 'completed', orderDate: '2024-12-05', deliveryDate: '2024-12-25', estimatedDelivery: '2024-12-25', customer: 'Selin Aras', priority: 'low', productionSource: 'Referans', progress: 100, assignedMachines: [] },
      { id: '9009', orderNumber: 'ORD-9009', productId: '3016', productName: 'Havalandırma Borusu', quantity: 100, status: 'pending', orderDate: '2024-12-27', deliveryDate: '2025-02-05', estimatedDelivery: '2025-02-05', customer: 'Cemil Koç', priority: 'medium', productionSource: 'Web', progress: 0, assignedMachines: [] },
      { id: '9010', orderNumber: 'ORD-9010', productId: '3014', productName: 'Termostatik Vana', quantity: 200, status: 'in_progress', orderDate: '2024-12-24', deliveryDate: '2025-01-18', estimatedDelivery: '2025-01-18', customer: 'Elif Polat', priority: 'high', productionSource: 'Telefon', progress: 60, assignedMachines: [] }
    ];

    return [...fakeOrders, ...realOrders];
  }
};

export const alertService = {
  async getAll(): Promise<Alert[]> {
    const alerts: Alert[] = [];

    const { data: materials } = await supabase
      .from('hammadde')
      .select('*');

    (materials || [])
      .filter((m: any) => parseFloat(m.kalan_miktar || '0') < parseFloat(m.kritik_stok || '0'))
      .forEach((m: any) => {
        alerts.push({
          id: `stock-${m.hammadde_id}`,
          type: 'warning',
          title: 'Kritik Stok',
          message: `${m.stok_adi} stok seviyesi kritik: ${m.kalan_miktar} ${m.birim}`,
          timestamp: new Date().toISOString(),
          source: 'Stok Yönetimi',
          read: false
        });
      });

    return alerts;
  }
};

export default {
  production: productionService,
  machine: machineService,
  stock: stockService,
  order: orderService,
  alert: alertService
};