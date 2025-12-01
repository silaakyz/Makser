import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, TrendingDown, Wrench, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DailyFinancial {
  tarih: string;
  gelir: number;
  maliyet: number;
  bakim: number;
  ariza: number;
}

export default function Finansal() {
  const [daily, setDaily] = useState<DailyFinancial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinancial = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const start = new Date();
        start.setDate(today.getDate() - 6);
        const startStr = start.toISOString().split("T")[0];

        const [
          { data: orders, error: ordersError },
          { data: maint, error: maintError },
          { data: faults, error: faultsError },
        ] = await Promise.all([
          supabase
            .from("siparis")
            .select("siparis_tarihi, siparis_maliyeti")
            .gte("siparis_tarihi", startStr),
          supabase
            .from("bakim_kaydi")
            .select("bakim_tarihi, maliyet")
            .gte("bakim_tarihi", startStr),
          supabase
            .from("ariza_kaydi")
            .select("baslangic_tarihi, maliyet")
            .gte("baslangic_tarihi", startStr),
        ]);

        if (ordersError) throw ordersError;
        if (maintError) throw maintError;
        if (faultsError) throw faultsError;

        const byDate: Record<string, DailyFinancial> = {};

        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const key = d.toISOString().split("T")[0];
          byDate[key] = { tarih: key.slice(5), gelir: 0, maliyet: 0, bakim: 0, ariza: 0 };
        }

        (orders || []).forEach((o: any) => {
          const key = o.siparis_tarihi;
          if (!byDate[key]) return;
          const val = Number(o.siparis_maliyeti || 0);
          byDate[key].gelir += val;
          byDate[key].maliyet += val; // maliyet = siparis_maliyeti varsayımı
        });

        (maint || []).forEach((m: any) => {
          const key = m.bakim_tarihi;
          if (!byDate[key]) return;
          const val = Number(m.maliyet || 0);
          byDate[key].bakim += val;
        });

        (faults || []).forEach((f: any) => {
          const key = f.baslangic_tarihi?.split("T")[0];
          if (!key || !byDate[key]) return;
          const val = Number(f.maliyet || 0);
          byDate[key].ariza += val;
        });

        setDaily(Object.values(byDate));
      } catch (error: any) {
        console.error("Finansal veriler yüklenirken hata:", error);
        toast.error("Finansal veriler yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    fetchFinancial();
  }, []);

  const toplamGelir = daily.reduce((sum, d) => sum + d.gelir, 0);
  const toplamMaliyet = daily.reduce((sum, d) => sum + d.maliyet, 0);
  const toplamBakim = daily.reduce((sum, d) => sum + d.bakim, 0);
  const toplamAriza = daily.reduce((sum, d) => sum + d.ariza, 0);
  const toplamKar = toplamGelir - toplamMaliyet - toplamBakim - toplamAriza;
  const karMarji = toplamGelir > 0 ? ((toplamKar / toplamGelir) * 100).toFixed(1) : "0";

  const exportToExcel = () => {
    const maliyetData = daily.map((d) => ({
      Tarih: d.tarih,
      "Gelir (₺)": d.gelir,
      "Sipariş Maliyeti (₺)": d.maliyet,
      "Bakım Maliyeti (₺)": d.bakim,
      "Arıza Maliyeti (₺)": d.ariza,
    }));

    const wb = XLSX.utils.book_new();
    const wsMaliyet = XLSX.utils.json_to_sheet(maliyetData);

    XLSX.utils.book_append_sheet(wb, wsMaliyet, "Maliyet Özeti");

    const fileName = `Finansal_Rapor_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Finansal rapor başarıyla indirildi!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Finansal Özet</h1>
            <p className="text-white/70">Maliyet analizi ve kârlılık raporları</p>
          </div>
          <Button onClick={exportToExcel} className="gap-2">
            <Download className="w-4 h-4" />
            Excel Raporu İndir
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Günlük Maliyet"
            value={`₺${(daily.at(-1)?.maliyet || 0).toLocaleString("tr-TR", {
              maximumFractionDigits: 0,
            })}`}
            icon={DollarSign}
            variant="info"
            subtitle="Bugünkü toplam sipariş maliyeti"
          />
          <KpiCard
            title="7 Günlük Maliyet"
            value={`₺${toplamMaliyet.toLocaleString("tr-TR", {
              maximumFractionDigits: 0,
            })}`}
            icon={TrendingDown}
            variant="warning"
            subtitle="Son 7 gün"
          />
          <KpiCard
            title="Toplam Kâr"
            value={`₺${toplamKar.toLocaleString("tr-TR", {
              maximumFractionDigits: 0,
            })}`}
            icon={TrendingUp}
            variant="success"
            subtitle={`%${karMarji} kâr marjı`}
          />
          <KpiCard
            title="Bakım + Arıza"
            value={`₺${(toplamBakim + toplamAriza).toLocaleString("tr-TR", {
              maximumFractionDigits: 0,
            })}`}
            icon={Wrench}
            variant="destructive"
            subtitle="Bakım ve arıza giderleri"
          />
        </div>

        {/* Grafikler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border hover:border-primary/30 transition-all">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-card-foreground">
                Günlük Gelir / Maliyet Trendi (Son 7 Gün)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {daily.length === 0 || loading ? (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  Finansal veri bulunamadı
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="tarih" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="gelir"
                      name="Gelir"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="maliyet"
                      name="Sipariş Maliyeti"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary/30 transition-all">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-card-foreground">
                Toplam Maliyet Dağılımı
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {toplamMaliyet + toplamBakim + toplamAriza === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  Maliyet verisi bulunamadı
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Sipariş Maliyeti", value: toplamMaliyet },
                        { name: "Bakım", value: toplamBakim },
                        { name: "Arıza", value: toplamAriza },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {["#3b82f6", "#eab308", "#ef4444"].map((color, idx) => (
                        <Cell key={idx} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) =>
                        `₺${Number(value).toLocaleString("tr-TR")}`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
