// src/decision/algorithms.ts

import type { 
  RawMaterial, 
  Machine, 
  ProductionOrder,
  StockPrediction,
  MaintenancePrediction,
  DelayRisk,
  DailySummary,
  OEEMetrics
} from '@/modules/types';

/**
 * Stok tükenme tahmini
 */
export function predictStockOutage(materials: RawMaterial[]): StockPrediction[] {
  return materials
    .filter(m => m.currentStock / m.maxStock < 0.5)
    .map(material => {
      const daysLeft = Math.floor(material.currentStock / material.averageConsumption);
      const stockOutDate = new Date();
      stockOutDate.setDate(stockOutDate.getDate() + daysLeft);
      
      const recommendedOrderDate = new Date(stockOutDate);
      recommendedOrderDate.setDate(recommendedOrderDate.getDate() - 5);
      
      return {
        materialId: material.id,
        materialName: material.name,
        currentStock: material.currentStock,
        daysUntilStockout: daysLeft,
        recommendedOrderDate: recommendedOrderDate.toISOString().split('T')[0],
        recommendedQuantity: material.minStock * 2
      };
    });
}

/**
 * Prediktif bakım tahmini
 */
export function predictMaintenance(machines: Machine[]): MaintenancePrediction[] {
  const predictions: MaintenancePrediction[] = [];
  const totalMTBF = machines.reduce((sum, m) => sum + m.mtbf, 0);
  const averageMTBF = totalMTBF / machines.length;

  machines.forEach(machine => {
    const riskScore = machine.mtbf / averageMTBF;
    
    if (riskScore < 0.8) {
      const recommendedDate = new Date();
      recommendedDate.setDate(recommendedDate.getDate() + 3);
      
      predictions.push({
        machineId: machine.id,
        machineName: machine.name,
        currentMTBF: Math.round(machine.mtbf),
        averageMTBF: Math.round(averageMTBF),
        riskScore: Math.round((1 - riskScore) * 100),
        recommendedDate: recommendedDate.toISOString().split('T')[0],
        reason: `MTBF düşük (${Math.round(machine.mtbf)}h)`
      });
    }
  });

  return predictions;
}

/**
 * Sipariş gecikme risk analizi
 */
export function analyzeDelayRisk(
  order: ProductionOrder,
  machines: Machine[]
): DelayRisk {
  const factors = [];
  let totalRisk = 0;

  const assignedMachines = machines.filter(m => 
    order.assignedMachines.includes(m.id)
  );
  
  if (assignedMachines.length === 0) {
    factors.push({
      factor: 'Makine Atanmadı',
      impact: 50,
      description: 'Henüz makine atanmamış'
    });
    totalRisk += 50;
  }

  const daysLeft = Math.ceil(
    (new Date(order.estimatedDelivery).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysLeft < 3 && order.progress < 80) {
    factors.push({
      factor: 'Zaman Kısıtı',
      impact: 35,
      description: `Teslime ${daysLeft} gün kaldı`
    });
    totalRisk += 35;
  }

  let riskLevel: DelayRisk['riskLevel'];
  if (totalRisk >= 70) riskLevel = 'critical';
  else if (totalRisk >= 50) riskLevel = 'high';
  else if (totalRisk >= 30) riskLevel = 'medium';
  else riskLevel = 'low';

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    riskScore: totalRisk,
    riskLevel,
    factors,
    recommendations: totalRisk >= 50 ? ['Ek makine tahsis edin'] : []
  };
}

/**
 * Kapasite tahmini
 */
export function predictCapacity(
  machines: Machine[],
  orders: ProductionOrder[]
): {
  totalCapacity: number;
  usedCapacity: number;
  availableCapacity: number;
  utilizationRate: number;
  bottlenecks: string[];
} {
  const activeMachines = machines.filter(m => 
    m.status === 'active' || m.status === 'idle'
  );

  const totalCapacity = activeMachines.reduce((sum, m) => sum + m.capacity, 0);
  const usedCapacity = activeMachines.reduce((sum, m) => sum + m.currentLoad, 0);
  const availableCapacity = totalCapacity - usedCapacity;
  const utilizationRate = (usedCapacity / totalCapacity) * 100;

  const bottlenecks: string[] = [];
  if (utilizationRate > 95) {
    bottlenecks.push('Kritik kapasite aşımı - Acil eylem gerekli');
  }

  return {
    totalCapacity,
    usedCapacity,
    availableCapacity,
    utilizationRate: Math.round(utilizationRate),
    bottlenecks
  };
}

/**
 * Günlük özet
 */
export function generateDailySummary(
  oeeMetrics: OEEMetrics[],
  machines: Machine[],
  materials: RawMaterial[],
  orders: ProductionOrder[]
): DailySummary {
  const today = oeeMetrics[oeeMetrics.length - 1];
  const yesterday = oeeMetrics[oeeMetrics.length - 2];
  
  const oeeChange = today && yesterday ? today.oee - yesterday.oee : 0;

  const criticalStockItems = materials
    .filter(m => m.currentStock < m.minStock * 1.2)
    .map(m => m.code);

  const delayedOrders = orders
    .filter(o => {
      const deliveryDate = new Date(o.estimatedDelivery);
      return deliveryDate < new Date() && o.status !== 'completed';
    })
    .map(o => o.orderNumber);

  const maintenancePreds = predictMaintenance(machines);
  const maintenanceRecommendations = maintenancePreds
    .slice(0, 3)
    .map(m => m.machineName);

  const topIssues: string[] = [];
  
  if (oeeChange < -5) {
    topIssues.push(`Bugün OEE %${Math.abs(oeeChange).toFixed(0)} düştü`);
  }

  if (criticalStockItems.length > 0) {
    topIssues.push(
      `${criticalStockItems.length} ürün kritik stokta: ${criticalStockItems.slice(0, 2).join(', ')}`
    );
  }

  if (delayedOrders.length > 0) {
    topIssues.push(`${delayedOrders.length} sipariş gecikme riskinde`);
  }

  return {
    date: new Date().toISOString().split('T')[0],
    oee: today?.oee || 0,
    oeeChange,
    criticalStockItems,
    delayedOrders,
    maintenanceRecommendations,
    topIssues
  };
}