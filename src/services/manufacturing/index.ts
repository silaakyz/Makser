// src/services/manufacturing/index.ts

import { supabase } from '@/integrations/supabase/client';
import type { Machine, RawMaterial, Product, ProductionOrder, OEEMetrics, Alert } from '@/modules/types';
import { mockData } from './mockData';

export const productionService = {
  async getOEEMetrics(days: number = 7): Promise<OEEMetrics[]> {
    return mockData.oeeMetrics.slice(-days);
  },

  async getActiveMachines(): Promise<Machine[]> {
    const { data } = await supabase
      .from('makine')
      .select('*')
      .eq('durum', 'aktif');
    
    return (data || []).map(m => ({
      id: m.id,
      name: m.ad,
      status: (m.durum === 'aktif' ? 'active' : m.durum === 'arızalı' ? 'maintenance' : 'idle') as any,
      capacity: m.uretim_kapasitesi,
      currentLoad: 0,
      totalUptime: 0,
      totalDowntime: 0,
      mtbf: 0,
      faults: [],
      lastMaintenance: m.son_bakim_tarihi || new Date().toISOString().split('T')[0],
      nextMaintenance: m.sonraki_bakim_tarihi || new Date().toISOString().split('T')[0]
    }));
  }
};

export const machineService = {
  async getAll(): Promise<Machine[]> {
    const { data } = await supabase.from('makine').select('*');
    
    return (data || []).map(m => ({
      id: m.id,
      name: m.ad,
      status: (m.durum === 'aktif' ? 'active' : m.durum === 'arızalı' ? 'maintenance' : 'idle') as any,
      capacity: m.uretim_kapasitesi,
      currentLoad: 0,
      totalUptime: 0,
      totalDowntime: 0,
      mtbf: 0,
      faults: [],
      lastMaintenance: m.son_bakim_tarihi || new Date().toISOString().split('T')[0],
      nextMaintenance: m.sonraki_bakim_tarihi || new Date().toISOString().split('T')[0]
    }));
  },

  async getById(id: string): Promise<Machine> {
    const { data } = await supabase.from('makine').select('*').eq('id', id).maybeSingle();
    if (!data) throw new Error('Machine not found');
    
    return {
      id: data.id,
      name: data.ad,
      status: (data.durum === 'aktif' ? 'active' : data.durum === 'arızalı' ? 'maintenance' : 'idle') as any,
      capacity: data.uretim_kapasitesi,
      currentLoad: 0,
      totalUptime: 0,
      totalDowntime: 0,
      mtbf: 0,
      faults: [],
      lastMaintenance: data.son_bakim_tarihi || new Date().toISOString().split('T')[0],
      nextMaintenance: data.sonraki_bakim_tarihi || new Date().toISOString().split('T')[0]
    };
  }
};

export const stockService = {
  async getRawMaterials(): Promise<RawMaterial[]> {
    const { data } = await supabase.from('hammadde').select('*');
    
    return (data || []).map(h => ({
      id: h.id,
      code: h.id.substring(0, 8),
      name: h.ad,
      unit: h.birim,
      currentStock: h.stok_miktari,
      minStock: h.kritik_stok_seviyesi,
      maxStock: h.kritik_stok_seviyesi * 3,
      costPerUnit: h.birim_fiyat,
      supplier: 'Aktarılan',
      averageConsumption: h.tuketim_hizi,
      lastOrderDate: new Date().toISOString().split('T')[0]
    }));
  },

  async getProducts(): Promise<Product[]> {
    const { data } = await supabase.from('urun').select('*');
    
    return (data || []).map(u => ({
      id: u.id,
      code: u.id.substring(0, 8),
      name: u.ad,
      unit: 'adet',
      currentStock: u.stok_miktari,
      minStock: u.kritik_stok_seviyesi,
      productionCost: u.satis_fiyati * 0.7,
      sellingPrice: u.satis_fiyati,
      requiredMaterials: [],
      width: u.en,
      length: u.boy,
      height: u.yukseklik,
      volume: u.hacim,
      weight: u.agirlik,
      maxPressure: u.max_basinc,
      maxTemperature: u.max_sicaklik,
      imageUrl: u.resim_url
    }));
  }
};

export const orderService = {
  async getAll(): Promise<ProductionOrder[]> {
    const { data } = await supabase
      .from('siparis')
      .select('*, urun(ad)')
      .order('siparis_tarihi', { ascending: false });
    
    return (data || []).map((s, idx) => ({
      id: s.id,
      orderNumber: `ORD-${idx + 1000}`,
      productId: s.urun_id || '',
      productName: s.urun?.ad || 'Bilinmeyen',
      quantity: s.miktar,
      status: (s.durum === 'tamamlandi' ? 'completed' : s.durum === 'devam_ediyor' ? 'in_progress' : 'pending') as any,
      orderDate: s.siparis_tarihi,
      deliveryDate: s.teslim_tarihi,
      estimatedDelivery: s.teslim_tarihi,
      customer: s.musteri,
      priority: 'medium' as any,
      productionSource: (s.kaynak === 'stok' ? 'stock' : 'production') as any,
      progress: s.durum === 'tamamlandi' ? 100 : 0,
      assignedMachines: []
    }));
  }
};

export const alertService = {
  async getAll(): Promise<Alert[]> {
    const alerts: Alert[] = [];
    
    // Kritik stok uyarıları
    const { data: materials } = await supabase
      .from('hammadde')
      .select('*');
    
    (materials || [])
      .filter(m => m.stok_miktari < m.kritik_stok_seviyesi)
      .forEach(m => {
        alerts.push({
          id: `stock-${m.id}`,
          type: 'warning',
          title: 'Kritik Stok',
          message: `${m.ad} stok seviyesi kritik: ${m.stok_miktari} ${m.birim}`,
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