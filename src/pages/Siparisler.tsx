import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CreateOrderDialog } from "@/components/orders/CreateOrderDialog";
import { ShoppingCart, Clock, CheckCircle, Loader, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface SiparisData {
  id: string;
  musteri: string;
  urun_id: string | null;
  miktar: number;
  durum: "beklemede" | "uretimde" | "tamamlandi";
  kaynak: string | null;
  siparis_tarihi: string;
  teslim_tarihi: string | null;
  siparis_maliyeti: number;
  urun?: {
    id: string;
    ad: string;
  } | null;
}

const KPI_DEFAULT = {
  sipariseTamamlamaOrani: 85,
};

export default function Siparisler() {
  const { roles } = useAuth();
  const [siparisler, setSiparisler] = useState<SiparisData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const canManageOrders = roles.some(role =>
    ["sirket_sahibi", "genel_mudur", "uretim_sefi"].includes(role)
  );

  useEffect(() => {
    fetchSiparisler();
  }, []);

  const fetchSiparisler = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("siparis")
        .select(`
          *,
          urun:urun_id (
            id,
            ad
          )
        `)
        .order("siparis_tarihi", { ascending: false });

      if (error) throw error;
      setSiparisler(data || []);
    } catch (error: any) {
      console.error("Sipariş listesi yüklenirken hata:", error);
      toast.error("Sipariş listesi yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const bekleyenSiparisler = siparisler.filter(s => s.durum === "beklemede");
  const uretimdeSiparisler = siparisler.filter(s => s.durum === "uretimde");
  const tamamlananSiparisler = siparisler.filter(s => s.durum === "tamamlandi");
  const toplamTutar = siparisler.reduce((sum, s) => sum + (s.siparis_maliyeti || 0), 0);

  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = { Bekleyen: 0, Üretimde: 0, Tamamlanan: 0 };
    siparisler.forEach((s) => {
      if (s.durum === "beklemede") counts.Bekleyen += 1;
      if (s.durum === "uretimde") counts["Üretimde"] += 1;
      if (s.durum === "tamamlandi") counts["Tamamlanan"] += 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [siparisler]);

  const trendChartData = useMemo(() => {
    const byMonth: Record<string, { ay: string; adet: number }> = {};
    siparisler.forEach((s) => {
      const d = s.siparis_tarihi ? new Date(s.siparis_tarihi) : null;
      if (!d || Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[key]) {
        byMonth[key] = { ay: key, adet: 0 };
      }
      byMonth[key].adet += 1;
    });
    return Object.values(byMonth).sort((a, b) => (a.ay > b.ay ? 1 : -1));
  }, [siparisler]);

  const statusColors = ["#fbbf24", "#3b82f6", "#22c55e"];

  const handleApproveOrder = async (order: SiparisData) => {
    try {
      setActionLoading(order.id);
      const { error } = await supabase
        .from("siparis")
        .update({ durum: "uretimde" })
        .eq("id", order.id);

      if (error) throw error;
      toast.success("Sipariş üretim sürecine alındı");
      fetchSiparisler();
    } catch (error: any) {
      console.error("Sipariş onaylanırken hata:", error);
      toast.error("Sipariş onaylanamadı");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteOrder = async (order: SiparisData) => {
    if (!order.urun_id) {
      toast.error("Siparişe ait ürün bulunamadı");
      return;
    }

    try {
      setActionLoading(order.id);

      const shouldHandleStockManually = order.kaynak !== "uretim";

      if (shouldHandleStockManually) {
        const { data: product, error: productError } = await supabase
          .from("urun")
          .select("stok_miktari")
          .eq("id", order.urun_id)
          .maybeSingle();

        if (productError) throw productError;
        const newProductStock = Math.max(0, (product?.stok_miktari || 0) - order.miktar);

        const { error: updateProductError } = await supabase
          .from("urun")
          .update({ stok_miktari: newProductStock })
          .eq("id", order.urun_id);

        if (updateProductError) throw updateProductError;

        const { data: recipe, error: recipeError } = await supabase
          .from("urun_hammadde")
          .select("hammadde_id, miktar")
          .eq("urun_id", order.urun_id);

        if (recipeError) throw recipeError;

        for (const row of recipe || []) {
          const usage = (row.miktar || 0) * order.miktar;
          const { data: material, error: materialError } = await supabase
            .from("hammadde")
            .select("stok_miktari")
            .eq("id", row.hammadde_id)
            .maybeSingle();

          if (materialError) throw materialError;

          const newMaterialStock = Math.max(0, (material?.stok_miktari || 0) - usage);
          const { error: updateMaterialError } = await supabase
            .from("hammadde")
            .update({ stok_miktari: newMaterialStock })
            .eq("id", row.hammadde_id);

          if (updateMaterialError) throw updateMaterialError;
        }
      }

      const { error: orderError } = await supabase
        .from("siparis")
        .update({
          durum: "tamamlandi",
          teslim_tarihi: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (orderError) throw orderError;

      toast.success(
        shouldHandleStockManually
          ? "Sipariş tamamlandı, stoklar güncellendi"
          : "Sipariş tamamlandı"
      );
      fetchSiparisler();
    } catch (error: any) {
      console.error("Sipariş tamamlanırken hata:", error);
      toast.error("Sipariş tamamlanamadı");
    } finally {
      setActionLoading(null);
    }
  };

  const exportToExcel = () => {
    const siparisData = siparisler.map((s) => ({
      "Müşteri": s.musteri,
      "Ürün": s.urun?.ad || "Bilinmiyor",
      "Miktar": s.miktar,
      "Durum": s.durum,
      "Kaynak": s.kaynak,
      "Sipariş Tarihi": s.siparis_tarihi,
      "Teslim Tarihi": s.teslim_tarihi || "-",
      "Sipariş Maliyeti (₺)": s.siparis_maliyeti,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(siparisData);
    XLSX.utils.book_append_sheet(wb, ws, "Siparişler");

    const fileName = `Siparis_Raporu_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Sipariş raporu başarıyla indirildi!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Sipariş Yönetimi</h1>
            <p className="text-white/70">Sipariş takibi ve durum kontrolü</p>
          </div>
          <div className="flex gap-2">
            <CreateOrderDialog />
            <Button onClick={exportToExcel} className="gap-2" variant="outline">
              <Download className="w-4 h-4" />
              Excel Raporu İndir
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Bekleyen Siparişler"
            value={bekleyenSiparisler.length}
            icon={Clock}
            variant="warning"
            subtitle="Onay bekleyen"
          />
          <KpiCard
            title="Üretimde"
            value={uretimdeSiparisler.length}
            icon={Loader}
            variant="info"
            subtitle="Devam eden"
          />
          <KpiCard
            title="Tamamlanan"
            value={tamamlananSiparisler.length}
            icon={CheckCircle}
            variant="success"
            subtitle={`%${KPI_DEFAULT.sipariseTamamlamaOrani} tamamlama`}
          />
          <KpiCard
            title="Toplam Tutar"
            value={`₺${toplamTutar.toLocaleString("tr-TR", {
              maximumFractionDigits: 0,
            })}`}
            icon={ShoppingCart}
            variant="default"
            subtitle="Aylık sipariş değeri"
          />
        </div>

        <Card className="bg-card border-l-4 border-l-warning shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              Bekleyen Siparişler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>Sipariş Tarihi</TableHead>
                  <TableHead>Teslim Tarihi</TableHead>
                  <TableHead>Maliyet</TableHead>
                  <TableHead>Durum</TableHead>
                  {canManageOrders && <TableHead>İşlemler</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {bekleyenSiparisler.map((siparis) => (
                  <TableRow key={siparis.id}>
                    <TableCell className="font-medium">{siparis.musteri}</TableCell>
                    <TableCell>{siparis.urun?.ad || "-"}</TableCell>
                    <TableCell>{siparis.miktar}</TableCell>
                    <TableCell>{siparis.siparis_tarihi}</TableCell>
                    <TableCell>{siparis.teslim_tarihi || "-"}</TableCell>
                    <TableCell>₺{siparis.siparis_maliyeti.toLocaleString()}</TableCell>
                    <TableCell>
                      <StatusBadge status={siparis.durum} />
                    </TableCell>
                    {canManageOrders && (
                      <TableCell>
                        <Button
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                          size="sm"
                          onClick={() => handleApproveOrder(siparis)}
                          disabled={actionLoading === siparis.id}
                        >
                          {actionLoading === siparis.id ? "Onaylanıyor..." : "Onayla"}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {bekleyenSiparisler.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canManageOrders ? 8 : 7} className="text-center text-muted-foreground py-6">
                      Bekleyen sipariş bulunmamaktadır
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-card border-l-4 border-l-primary shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Loader className="w-5 h-5 text-primary" />
              Üretimdeki Siparişler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>Kaynak</TableHead>
                  <TableHead>Teslim Tarihi</TableHead>
                  <TableHead>Maliyet</TableHead>
                  <TableHead>Durum</TableHead>
                  {canManageOrders && <TableHead>İşlemler</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {uretimdeSiparisler.map((siparis) => (
                  <TableRow key={siparis.id}>
                    <TableCell className="font-medium">{siparis.musteri}</TableCell>
                    <TableCell>{siparis.urun?.ad || "-"}</TableCell>
                    <TableCell>{siparis.miktar}</TableCell>
                    <TableCell>
                      <StatusBadge status={siparis.kaynak} />
                    </TableCell>
                    <TableCell>{siparis.teslim_tarihi || "-"}</TableCell>
                    <TableCell>₺{siparis.siparis_maliyeti.toLocaleString()}</TableCell>
                    <TableCell>
                      <StatusBadge status={siparis.durum} />
                    </TableCell>
                    {canManageOrders && (
                      <TableCell>
                        <Button
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                          size="sm"
                          onClick={() => handleCompleteOrder(siparis)}
                          disabled={actionLoading === siparis.id}
                        >
                          {actionLoading === siparis.id ? "Tamamlanıyor..." : "Tamamla"}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {uretimdeSiparisler.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canManageOrders ? 8 : 7} className="text-center text-muted-foreground py-6">
                      Üretimde sipariş bulunmamaktadır
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-primary/30 transition-all">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Tamamlanan Siparişler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>Sipariş Tarihi</TableHead>
                  <TableHead>Teslim Tarihi</TableHead>
                  <TableHead>Maliyet</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tamamlananSiparisler.map((siparis) => (
                  <TableRow key={siparis.id}>
                    <TableCell className="font-medium">{siparis.musteri}</TableCell>
                    <TableCell>{siparis.urun?.ad || "-"}</TableCell>
                    <TableCell>{siparis.miktar}</TableCell>
                    <TableCell>{siparis.siparis_tarihi}</TableCell>
                    <TableCell>{siparis.teslim_tarihi || "-"}</TableCell>
                    <TableCell>₺{siparis.siparis_maliyeti.toLocaleString()}</TableCell>
                    <TableCell>
                      <StatusBadge status={siparis.durum} />
                    </TableCell>
                  </TableRow>
                ))}
                {tamamlananSiparisler.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                      Tamamlanan sipariş bulunmamaktadır
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border hover:border-primary/30 transition-all">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-card-foreground">
                Sipariş Durum Dağılımı
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {statusChartData.every(d => d.value === 0) ? (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  Sipariş verisi bulunamadı
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {statusChartData.map((_, idx) => (
                        <Cell key={idx} fill={statusColors[idx % statusColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary/30 transition-all">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-card-foreground">
                Aylık Sipariş Trendi
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {trendChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  Sipariş verisi bulunamadı
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="ay" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="adet"
                      name="Sipariş Adedi"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

