import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HorizontalMetricCard } from "@/components/dashboard/HorizontalMetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DashboardStats {
  activeProduction: number;
  activeMachines: number;
  criticalStock: number;
  pendingOrders: number;
  totalMachines: number;
  productionRate: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeProduction: 0,
    activeMachines: 0,
    criticalStock: 0,
    pendingOrders: 0,
    totalMachines: 0,
    productionRate: 0,
  });

  const [recentProductions, setRecentProductions] = useState<any[]>([]);
  const [machineStatus, setMachineStatus] = useState<any[]>([]);

  const [completedOrders, setCompletedOrders] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Aktif üretimler
    const { data: activeProductions } = await supabase
      .from("uretim")
      .select("*")
      .eq("durum", "devam_ediyor");

    // Makineler
    const { data: machines } = await supabase.from("makine").select("*");
    const activeMachines = machines?.filter((m) => m.durum === "aktif").length || 0;

    // Kritik stok
    const { data: products } = await supabase.from("urun").select("*");
    const criticalStock =
      products?.filter((p) => p.stok_miktari <= p.kritik_stok_seviyesi).length || 0;

    // Bekleyen siparişler
    const { data: orders } = await supabase
      .from("siparis")
      .select("*")
      .eq("durum", "beklemede");

    // Tamamlanan siparişler
    const { data: completedOrdersData } = await supabase
      .from("siparis")
      .select("*")
      .eq("durum", "tamamlandi");

    // Son üretimler
    const { data: productions } = await supabase
      .from("uretim")
      .select(`*, urun(ad), makine(ad)`)
      .order("created_at", { ascending: false })
      .limit(10);

    // Bakım kayıtları
    const { data: maintenanceRecords } = await supabase
      .from("bakim_kaydi")
      .select(`*, makine(ad, tur)`)
      .order("bakim_tarihi", { ascending: false })
      .limit(10);

    setStats({
      activeProduction: activeProductions?.length || 0,
      activeMachines: activeMachines,
      criticalStock: criticalStock,
      pendingOrders: orders?.length || 0,
      totalMachines: machines?.length || 0,
      productionRate: 87,
    });

    setCompletedOrders(completedOrdersData?.length || 0);
    setRecentProductions(productions || []);
    setMachineStatus(maintenanceRecords || []);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Yatay Metrik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <HorizontalMetricCard
            title="Üretim Verimliliği"
            value={`${stats.productionRate}%`}
            subtitle="Güncel performans"
          />
          <HorizontalMetricCard
            title="Ürün Stok Durumu"
            value={stats.criticalStock === 0 ? "Normal" : `${stats.criticalStock} Kritik`}
            subtitle={`${stats.criticalStock} ürün düşük stokta`}
          />
          <HorizontalMetricCard
            title="Üretimde / Tamamlanan Siparişler"
            value={`${stats.activeProduction} / ${completedOrders}`}
            subtitle="Aktif ve tamamlanan"
          />
          <HorizontalMetricCard
            title="Makine Bakım Geçmişi"
            value={machineStatus.length}
            subtitle="Toplam bakım kaydı"
          />
        </div>

        {/* Alt Bölüm - Tablolar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Üretim Tablosu */}
          <Card className="shadow-card border-2 border-border">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg font-bold text-secondary">
                Üretim
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead>Makine</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İlerleme</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentProductions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Henüz üretim kaydı bulunmuyor
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentProductions.map((prod) => (
                      <TableRow key={prod.id}>
                        <TableCell className="font-medium">
                          {prod.urun?.ad || "Bilinmeyen"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {prod.makine?.ad || "Bilinmeyen"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={prod.durum} />
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {prod.uretilen_adet}/{prod.hedef_adet}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Makine Bakım Tablosu */}
          <Card className="shadow-card border-2 border-border">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg font-bold text-secondary">
                Makine
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Makine</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead className="text-right">Maliyet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machineStatus.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Henüz bakım kaydı bulunmuyor
                      </TableCell>
                    </TableRow>
                  ) : (
                    machineStatus.map((record: any) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.makine?.ad || "Bilinmeyen"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.bakim_turu}
                        </TableCell>
                        <TableCell>
                          {new Date(record.bakim_tarihi).toLocaleDateString("tr-TR")}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          ₺{record.maliyet?.toLocaleString("tr-TR") || "0"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Stoklar ve Siparişler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-card border-2 border-border">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg font-bold text-secondary">
                Stoklar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">Toplam Ürün</span>
                  <span className="text-xl font-bold text-primary">
                    {stats.activeProduction + stats.criticalStock + 15}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">Kritik Seviye</span>
                  <span className="text-xl font-bold text-destructive">
                    {stats.criticalStock}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-2 border-border">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg font-bold text-secondary">
                Siparişler
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">Bekleyen</span>
                  <span className="text-xl font-bold text-warning">
                    {stats.pendingOrders}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">Tamamlanan</span>
                  <span className="text-xl font-bold text-success">
                    {completedOrders}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Finansal Özet */}
        <Card className="shadow-card border-2 border-border">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg font-bold text-secondary">
              Finansal Özet
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Günlük Maliyet</p>
                <p className="text-3xl font-bold text-primary">₺12,450</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Hammadde Gideri</p>
                <p className="text-3xl font-bold text-primary">₺8,200</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Bakım Maliyeti</p>
                <p className="text-3xl font-bold text-primary">₺4,250</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
