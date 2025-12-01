import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NavLink } from "@/components/NavLink";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Factory,
  TrendingUp,
  Activity,
  AlertCircle,
  Package,
  ShoppingCart,
  DollarSign,
  Bell,
  Settings,
  Boxes,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function Dashboard() {
  const { data: activeProductions } = useQuery({
    queryKey: ["active-productions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("uretim")
        .select(`
          *,
          urun:urun_id (ad),
          makine:makine_id (ad)
        `)
        .eq("durum", "devam_ediyor")
        .order("baslangic_zamani", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const { data: machineStatus } = useQuery({
    queryKey: ["machine-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("makine")
        .select("durum")
        .limit(100);

      if (error) throw error;

      const statusCounts = data.reduce((acc, machine) => {
        acc[machine.durum] = (acc[machine.durum] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return statusCounts;
    },
  });

  const { data: criticalStock } = useQuery({
    queryKey: ["critical-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hammadde")
        .select("*")
        .limit(100);

      if (error) throw error;

      const critical = data.filter(
        (h) => h.stok_miktari <= (h.kritik_stok_seviyesi || 0)
      );

      return critical.length;
    },
  });

  const { data: pendingOrders } = useQuery({
    queryKey: ["pending-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("siparis")
        .select("*")
        .eq("durum", "beklemede")
        .limit(100);

      if (error) throw error;
      return data?.length || 0;
    },
  });

  const { data: completedOrders } = useQuery({
    queryKey: ["completed-orders-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("siparis")
        .select("id")
        .eq("durum", "tamamlandi")
        .limit(1000);

      if (error) throw error;
      return data?.length || 0;
    },
  });

  const { data: financialSummary } = useQuery({
    queryKey: ["dashboard-financial-summary"],
    queryFn: async () => {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const last7 = new Date();
      last7.setDate(today.getDate() - 6);
      const last7Str = last7.toISOString().split("T")[0];

      const [{ data: orders, error: ordersError }, { data: maint, error: maintError }, { data: faults, error: faultsError }] =
        await Promise.all([
          supabase
            .from("siparis")
            .select("siparis_maliyeti, siparis_tarihi")
            .gte("siparis_tarihi", last7Str),
          supabase
            .from("bakim_kaydi")
            .select("maliyet, bakim_tarihi")
            .gte("bakim_tarihi", last7Str),
          supabase
            .from("ariza_kaydi")
            .select("maliyet, baslangic_tarihi")
            .gte("baslangic_tarihi", last7Str),
        ]);

      if (ordersError) throw ordersError;
      if (maintError) throw maintError;
      if (faultsError) throw faultsError;

      const weeklyRevenue =
        orders?.reduce((sum: number, o: any) => sum + (o.siparis_maliyeti || 0), 0) || 0;

      const dailyRevenue =
        orders
          ?.filter((o: any) => o.siparis_tarihi === todayStr)
          .reduce((sum: number, o: any) => sum + (o.siparis_maliyeti || 0), 0) || 0;

      const maintenanceCost =
        maint?.reduce((sum: number, m: any) => sum + (m.maliyet || 0), 0) || 0;
      const faultCost =
        faults?.reduce((sum: number, f: any) => sum + (f.maliyet || 0), 0) || 0;

      const weeklyCost = weeklyRevenue; // siparis_maliyeti toplamı
      const profit = weeklyRevenue - maintenanceCost - faultCost;

      return {
        dailyCost: dailyRevenue,
        weeklyCost,
        profit,
      };
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-white/70">Üretim yönetim sistemi ana görünümü</p>
        </div>

        {/* Ana KPI Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Üretim Verimliliği"
            value={machineStatus ? `${Math.min(99, Math.max(60, Math.round(((machineStatus?.aktif || 0) / ((machineStatus?.aktif || 0) + (machineStatus?.boşta || 0) + (machineStatus?.arızalı || 0) + (machineStatus?.bakımda || 0) || 1)) * 100)))}%` : "—"}
            icon={TrendingUp}
            variant="success"
            subtitle="Günlük hedef: 85%"
          />
          <KpiCard
            title="Aktif Üretimler"
            value={activeProductions?.length || 0}
            icon={Factory}
            variant="info"
            subtitle="Devam eden işler"
          />
          <KpiCard
            title="Çalışan Makineler"
            value={machineStatus?.aktif || 0}
            icon={Activity}
            variant="default"
            subtitle={`${machineStatus?.arızalı || 0} arızalı`}
          />
          <KpiCard
            title="Kritik Stok"
            value={criticalStock || 0}
            icon={AlertCircle}
            variant="destructive"
            subtitle="Acil sipariş gerekli"
          />
        </div>

        {/* Modül Önizleme Kartları */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Üretim Durumu */}
          <Card className="bg-card border-border hover:border-primary/30 transition-all">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                <Factory className="w-5 h-5 text-primary" />
                Üretim Durumu
              </CardTitle>
              <NavLink to="/uretim" className="text-sm text-primary hover:underline">
                Detaylar →
              </NavLink>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Makine</TableHead>
                    <TableHead>Ürün</TableHead>
                    <TableHead>İlerleme</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeProductions?.slice(0, 3).map((prod: any) => {
                    const progress = Math.round(
                      (prod.uretilen_adet / prod.hedef_adet) * 100
                    );
                    return (
                      <TableRow key={prod.id}>
                        <TableCell className="font-medium">
                          {prod.makine?.ad || "N/A"}
                        </TableCell>
                        <TableCell>{prod.urun?.ad || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[80px]">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {progress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={prod.durum} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Makine Durumu */}
          <Card className="bg-card border-border hover:border-primary/30 transition-all">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Makine Durumu
              </CardTitle>
              <NavLink to="/makine" className="text-sm text-primary hover:underline">
                Detaylar →
              </NavLink>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-primary/10 border-l-4 border-l-primary">
                  <p className="text-sm text-muted-foreground mb-1">Aktif</p>
                  <p className="text-2xl font-bold text-card-foreground">
                    {machineStatus?.aktif || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/30 border-l-4 border-l-secondary">
                  <p className="text-sm text-muted-foreground mb-1">Boşta</p>
                  <p className="text-2xl font-bold text-card-foreground">
                    {machineStatus?.boşta || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-destructive/10 border-l-4 border-l-destructive">
                  <p className="text-sm text-muted-foreground mb-1">Arızalı</p>
                  <p className="text-2xl font-bold text-card-foreground">
                    {machineStatus?.arızalı || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-warning/10 border-l-4 border-l-warning">
                  <p className="text-sm text-muted-foreground mb-1">Bakımda</p>
                  <p className="text-2xl font-bold text-card-foreground">
                    {machineStatus?.bakımda || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stok Durumu */}
          <Card className="bg-card border-border hover:border-primary/30 transition-all">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Stok Durumu
              </CardTitle>
              <NavLink to="/stoklar" className="text-sm text-primary hover:underline">
                Detaylar →
              </NavLink>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border-l-4 border-l-destructive bg-destructive/5">
                  <div>
                    <p className="text-sm text-muted-foreground">Kritik Hammadde</p>
                    <p className="text-2xl font-bold text-card-foreground">
                      {criticalStock || 0}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border-l-4 border-l-primary bg-primary/5">
                  <div>
                    <p className="text-sm text-muted-foreground">Toplam Stok Kalemi</p>
                    <p className="text-2xl font-bold text-card-foreground">20</p>
                  </div>
                  <Boxes className="w-8 h-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sipariş Durumu */}
          <Card className="bg-card border-border hover:border-primary/30 transition-all">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Sipariş Durumu
              </CardTitle>
              <NavLink to="/siparisler" className="text-sm text-primary hover:underline">
                Detaylar →
              </NavLink>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border-l-4 border-l-warning bg-warning/5">
                  <div>
                    <p className="text-sm text-muted-foreground">Bekleyen</p>
                    <p className="text-2xl font-bold text-card-foreground">
                      {pendingOrders}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-warning" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border-l-4 border-l-success bg-success/5">
                  <div>
                    <p className="text-sm text-muted-foreground">Tamamlanan</p>
                    <p className="text-2xl font-bold text-card-foreground">48</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Finansal Özet ve Uyarılar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Finansal Özet */}
          <Card className="bg-card border-border hover:border-primary/30 transition-all">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Finansal Özet
              </CardTitle>
              <NavLink to="/finansal" className="text-sm text-primary hover:underline">
                Detaylar →
              </NavLink>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Günlük Maliyet</span>
                  <span className="text-lg font-bold text-card-foreground">
                    {financialSummary
                      ? `₺${financialSummary.dailyCost.toLocaleString("tr-TR", {
                          maximumFractionDigits: 0,
                        })}`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Haftalık Maliyet</span>
                  <span className="text-lg font-bold text-card-foreground">
                    {financialSummary
                      ? `₺${financialSummary.weeklyCost.toLocaleString("tr-TR", {
                          maximumFractionDigits: 0,
                        })}`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-sm text-success">Toplam Kâr</span>
                  <span className="text-lg font-bold text-success">
                    {financialSummary
                      ? `₺${financialSummary.profit.toLocaleString("tr-TR", {
                          maximumFractionDigits: 0,
                        })}`
                      : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Uyarılar */}
          <Card className="bg-card border-border hover:border-primary/30 transition-all">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Uyarılar
              </CardTitle>
              <NavLink to="/uyarilar" className="text-sm text-primary hover:underline">
                Tümü →
              </NavLink>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border-l-4 border-l-destructive">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground">Makine Arızası</p>
                    <p className="text-xs text-muted-foreground">Montaj Hattı 1 - Konveyör</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border-l-4 border-l-destructive">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground">Kritik Stok</p>
                    <p className="text-xs text-muted-foreground">4 hammadde kritik seviyede</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/5 border-l-4 border-l-warning">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground">Yaklaşan Bakım</p>
                    <p className="text-xs text-muted-foreground">3 makine bakım tarihi yaklaşıyor</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
