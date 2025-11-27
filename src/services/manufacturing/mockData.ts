// src/services/manufacturing/mockData.ts

import type { Machine, RawMaterial, Product, ProductionOrder, OEEMetrics, Alert } from '@/modules/types';

export const mockData = {
  machines: [
    {
      id: 'M001',
      name: 'Makine 1',
      status: 'active' as const,
      currentProduct: 'Plastik Kapak',
      startTime: '08:30',
      estimatedEnd: '11:45',
      capacity: 10000,
      currentLoad: 7800,
      lastMaintenance: '2025-11-20',
      nextMaintenance: '2025-12-05',
      totalUptime: 720,
      totalDowntime: 24,
      mtbf: 480,
      faults: []
    },
    {
      id: 'M002',
      name: 'Makine 2',
      status: 'idle' as const,
      capacity: 8000,
      currentLoad: 0,
      lastMaintenance: '2025-11-18',
      nextMaintenance: '2025-12-03',
      totalUptime: 680,
      totalDowntime: 64,
      mtbf: 420,
      faults: []
    },
    {
      id: 'M003',
      name: 'Makine 3',
      status: 'active' as const,
      currentProduct: 'Şişe Gövde',
      startTime: '09:00',
      estimatedEnd: '12:30',
      capacity: 12000,
      currentLoad: 11040,
      lastMaintenance: '2025-11-22',
      nextMaintenance: '2025-12-07',
      totalUptime: 710,
      totalDowntime: 34,
      mtbf: 550,
      faults: []
    }
  ] as Machine[],

  materials: [
    {
      id: 'RM001',
      code: 'A12',
      name: 'PET Granül',
      currentStock: 2200,
      minStock: 1000,
      maxStock: 10000,
      unit: 'kg',
      costPerUnit: 8.5,
      supplier: 'Plastik A.Ş.',
      averageConsumption: 150,
      lastOrderDate: '2025-11-20'
    },
    {
      id: 'RM002',
      code: 'B04',
      name: 'Mürekkep',
      currentStock: 460,
      minStock: 200,
      maxStock: 1000,
      unit: 'litre',
      costPerUnit: 45,
      supplier: 'Boya Ltd.',
      averageConsumption: 25,
      lastOrderDate: '2025-11-15'
    }
  ] as RawMaterial[],

  products: [
    {
      id: 'P001',
      code: 'PRD-001',
      name: 'Plastik Kapak',
      currentStock: 14500,
      minStock: 5000,
      unit: 'adet',
      productionCost: 1.2,
      sellingPrice: 2.5,
      requiredMaterials: [
        { materialId: 'RM001', quantity: 0.05 }
      ]
    }
  ] as Product[],

  orders: [
    {
      id: 'ORD001',
      orderNumber: '#2023',
      customer: 'ABC Gıda',
      productId: 'P001',
      quantity: 5000,
      status: 'in-production' as const,
      priority: 'high' as const,
      orderDate: '2025-11-20',
      startDate: '2025-11-25',
      estimatedDelivery: '2025-11-29',
      progress: 75,
      assignedMachines: ['M001', 'M003']
    }
  ] as ProductionOrder[],

  oeeMetrics: [
    { date: '2025-11-20', availability: 88, performance: 82, quality: 96, oee: 69 },
    { date: '2025-11-21', availability: 92, performance: 85, quality: 97, oee: 76 },
    { date: '2025-11-22', availability: 94, performance: 87, quality: 98, oee: 80 },
    { date: '2025-11-23', availability: 90, performance: 84, quality: 97, oee: 73 },
    { date: '2025-11-24', availability: 89, performance: 83, quality: 96, oee: 71 },
    { date: '2025-11-25', availability: 91, performance: 86, quality: 97, oee: 76 },
    { date: '2025-11-26', availability: 88, performance: 81, quality: 95, oee: 68 }
  ] as OEEMetrics[],

  alerts: [
    {
      id: 'ALT001',
      type: 'critical' as const,
      title: 'Kritik Stok Seviyesi',
      message: 'PET granül kritik seviyede',
      timestamp: new Date().toISOString(),
      source: 'stock',
      read: false
    }
  ] as Alert[]
};