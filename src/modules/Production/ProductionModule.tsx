// src/modules/production/ProductionModule.tsx
import React, { useEffect, useState } from "react";
import type { Machine, OEEMetrics } from "@/modules/types";
import { productionService, machineService } from "@/services/manufacturing";

const ProductionModule: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [oee, setOee] = useState<OEEMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const machinesData = await machineService.getAll();
        const oeeData = await productionService.getOEEMetrics();
        setMachines(machinesData);
        setOee(oeeData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Üretim Modülü</h2>

      <div className="mb-4">
        <h3 className="font-semibold">Aktif Makineler</h3>
        <ul>
          {machines.map((m) => (
            <li key={m.id}>
              {m.name} - Durum: {m.status} - Yük: {m.currentLoad}/{m.capacity}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">OEE Son 7 Gün</h3>
        <ul>
          {oee.map((o, idx) => (
            <li key={idx}>
              {o.date}: OEE %{o.oee} (Av:{o.availability}%, Perf:{o.performance}%, Q:{o.quality}%)
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProductionModule;
