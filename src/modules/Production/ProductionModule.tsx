import React, { useEffect, useState } from "react";
import type { Machine, OEEMetrics } from "@/modules/types";
import { productionService, machineService } from "@/services/manufacturing";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

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

  const exportToExcel = () => {
    // Makineler için worksheet
    const machinesData = machines.map((m) => ({
      "Makine ID": m.id,
      "Makine Adı": m.name,
      "Durum": m.status,
      "Ürün": m.currentProduct || "-",
      "Başlangıç": m.startTime || "-",
      "Bitiş (Tahmini)": m.estimatedEnd || "-",
      "Kapasite": m.capacity,
      "Mevcut Yük": m.currentLoad,
      "Yük %": ((m.currentLoad / m.capacity) * 100).toFixed(1),
      "Son Bakım": m.lastMaintenance,
      "Sonraki Bakım": m.nextMaintenance,
    }));

    // OEE için worksheet
    const oeeData = oee.map((o) => ({
      "Tarih": o.date,
      "Kullanılabilirlik %": o.availability,
      "Performans %": o.performance,
      "Kalite %": o.quality,
      "OEE %": o.oee,
    }));

    // Workbook oluştur
    const wb = XLSX.utils.book_new();
    const wsMachines = XLSX.utils.json_to_sheet(machinesData);
    const wsOEE = XLSX.utils.json_to_sheet(oeeData);

    XLSX.utils.book_append_sheet(wb, wsMachines, "Makineler");
    XLSX.utils.book_append_sheet(wb, wsOEE, "OEE Metrikleri");

    // Excel dosyasını indir
    const fileName = `Uretim_Raporu_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success("Rapor başarıyla indirildi!");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Yeni Üretim</h1>
          <Button onClick={exportToExcel} className="gap-2">
            <Download className="w-4 h-4" />
            Excel Raporu İndir
          </Button>
        </div>

        {/* Makineler Tablosu */}
        <Card>
          <CardHeader>
            <CardTitle>Aktif Makineler</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Makine</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Başlangıç</TableHead>
                  <TableHead>Tahmini Bitiş</TableHead>
                  <TableHead>Yük</TableHead>
                  <TableHead>Kapasite %</TableHead>
                  <TableHead>Son Bakım</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {machines.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={m.status} />
                    </TableCell>
                    <TableCell>{m.currentProduct || "-"}</TableCell>
                    <TableCell>{m.startTime || "-"}</TableCell>
                    <TableCell>{m.estimatedEnd || "-"}</TableCell>
                    <TableCell>
                      {m.currentLoad} / {m.capacity}
                    </TableCell>
                    <TableCell>
                      {((m.currentLoad / m.capacity) * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell>{m.lastMaintenance}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* OEE Metrikleri Tablosu */}
        <Card>
          <CardHeader>
            <CardTitle>OEE Metrikleri (Son 7 Gün)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Kullanılabilirlik %</TableHead>
                  <TableHead>Performans %</TableHead>
                  <TableHead>Kalite %</TableHead>
                  <TableHead>OEE %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {oee.map((o, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{o.date}</TableCell>
                    <TableCell>{o.availability}%</TableCell>
                    <TableCell>{o.performance}%</TableCell>
                    <TableCell>{o.quality}%</TableCell>
                    <TableCell className="font-bold text-primary">
                      {o.oee}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProductionModule;
