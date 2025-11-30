// src/modules/types.ts

export interface Machine {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'fault' | 'maintenance';
  currentProduct?: string;
  startTime?: string;
  estimatedEnd?: string;
  capacity: number;
  currentLoad: number;
  lastMaintenance: string;
  nextMaintenance: string;
  totalUptime: number;
  totalDowntime: number;
  mtbf: number;
  faults: Fault[];
}

export interface Fault {
  id: string;
  machineId: string;
  issue: string;
  startTime: string;
  endTime?: string;
  duration: number;
  cost: number;
}

export interface RawMaterial {
  id: string;
  code: string;
  name: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  costPerUnit: number;
  supplier: string;
  averageConsumption: number;
  lastOrderDate: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
  productionCost: number;
  sellingPrice: number;
  requiredMaterials: MaterialRequirement[];
  // Kazan ölçüleri
  width?: number; // En (cm)
  length?: number; // Boy (cm)
  height?: number; // Yükseklik (cm)
  volume?: number; // Hacim/Kapasite (L veya m³)
  weight?: number; // Ağırlık (kg)
  maxPressure?: number; // Maksimum Basınç
  maxTemperature?: number; // Maksimum Sıcaklık (°C)
  imageUrl?: string; // Ürün resim URL
}

export interface MaterialRequirement {
  materialId: string;
  quantity: number;
}

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  customer: string;
  productId: string;
  quantity: number;
  status: 'pending' | 'in-production' | 'completed' | 'delayed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  orderDate: string;
  startDate?: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  progress: number;
  assignedMachines: string[];
}

export interface OEEMetrics {
  date: string;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  source: string;
  read: boolean;
}

export interface StockPrediction {
  materialId: string;
  materialName: string;
  currentStock: number;
  daysUntilStockout: number;
  recommendedOrderDate: string;
  recommendedQuantity: number;
}

export interface MaintenancePrediction {
  machineId: string;
  machineName: string;
  currentMTBF: number;
  averageMTBF: number;
  riskScore: number;
  recommendedDate: string;
  reason: string;
}

export interface DelayRisk {
  orderId: string;
  orderNumber: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  recommendations: string[];
}

export interface RiskFactor {
  factor: string;
  impact: number;
  description: string;
}

export interface DailySummary {
  date: string;
  oee: number;
  oeeChange: number;
  criticalStockItems: string[];
  delayedOrders: string[];
  maintenanceRecommendations: string[];
  topIssues: string[];
}