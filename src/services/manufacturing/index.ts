// src/services/manufacturing/index.ts

import axios from 'axios';
import type { Machine, RawMaterial, Product, ProductionOrder, OEEMetrics, Alert } from '@/modules/types';
import { mockData } from './mockData';

const USE_MOCK = true; // Gerçek API için false yapın

const mockDelay = (ms: number = 300) => 
  new Promise(resolve => setTimeout(resolve, ms));

export const productionService = {
  async getOEEMetrics(days: number = 7): Promise<OEEMetrics[]> {
    await mockDelay();
    return mockData.oeeMetrics.slice(-days);
  },

  async getActiveMachines(): Promise<Machine[]> {
    await mockDelay();
    return mockData.machines.filter(m => m.status === 'active');
  }
};

export const machineService = {
  async getAll(): Promise<Machine[]> {
    await mockDelay();
    return mockData.machines;
  },

  async getById(id: string): Promise<Machine> {
    await mockDelay();
    const machine = mockData.machines.find(m => m.id === id);
    if (!machine) throw new Error('Machine not found');
    return machine;
  }
};

export const stockService = {
  async getRawMaterials(): Promise<RawMaterial[]> {
    await mockDelay();
    return mockData.materials;
  },

  async getProducts(): Promise<Product[]> {
    await mockDelay();
    return mockData.products;
  }
};

export const orderService = {
  async getAll(): Promise<ProductionOrder[]> {
    await mockDelay();
    return mockData.orders;
  }
};

export const alertService = {
  async getAll(): Promise<Alert[]> {
    await mockDelay();
    return mockData.alerts;
  }
};

export default {
  production: productionService,
  machine: machineService,
  stock: stockService,
  order: orderService,
  alert: alertService
};