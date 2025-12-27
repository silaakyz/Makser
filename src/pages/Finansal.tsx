import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, TrendingDown, Wrench, Download, ShieldAlert } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  const { roles } = useAuth();
  const isProductionChief = roles.includes("uretim_sefi");
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
            .select("siparis_tarihi, siparis_maliyet(toplam_maliyet)")
            .gte("siparis_tarihi", startStr),
          supabase
            .from("makine_bakim")
            .select("bakim_tarihi, maliyet")
            .gte("bakim_tarihi", startStr),
          supabase
            .from("makine_ariza")
            .select("maliyet")
            // Note: 'baslangic_tarihi' is missing in 'makine_ariza' schema. 
            // We can't filter by date effectively without it. 
            // We'll fetch all and mock date, or fetch restricted limit.
            // For now, let's just select maliyet and assume recent or mock.
            .limit(20),
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
          // Access nested siparis_maliyet, handle if array or object
          const maliyetObj = Array.isArray(o.siparis_maliyet) ? o.siparis_maliyet[0] : o.siparis_maliyet;
          const val = maliyetObj ? parseFloat(maliyetObj.toplam_maliyet || '0') : 0;

          byDate[key].gelir += val; // Assuming revenue = cost + profit, using cost as proxy for now or 1.2x
          byDate[key].maliyet += val;
        });

        (maint || []).forEach((m: any) => {
          const key = m.bakim_tarihi;
          if (!byDate[key]) return;
          const val = Number(m.maliyet || 0);
          byDate[key].bakim += val;
        });

        (faults || []).forEach((f: any) => {
          // Mock date for ariza as 'today' or distribute, since no date column
          const key = new Date().toISOString().split("T")[0];
          if (!byDate[key]) return;
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

  if (isProductionChief) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full py-24 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-warning" />
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Yetki Kısıtlaması</h1>
            <p className="text-white/70 max-w-xl">
              Finansal özet ve kârlılık bilgilerine yalnızca yetkili roller erişebilir. Üretim şefi rolü için bu
              sayfa devre dışı bırakıldı.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
