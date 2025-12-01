import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockUrunler } from "@/lib/mockData";
import { Factory, TrendingUp, Clock, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface UretimRow {
  id: string;
  hedef_adet: number;
  uretilen_adet: number;
  baslangic_zamani: string;
  bitis_zamani: string | null;
  durum: string;
  makine_id: string | null;
  urun_id: string | null;
  urun?: { ad: string } | null;
  makine?: { ad: string } | null;
}

interface MakineRow {
  id: string;
  ad: string;
  uretim_kapasitesi: number;
}

export default function Uretim() {
  const [uretimler, setUretimler] = useState<UretimRow[]>([]);
  const [makineler, setMakineler] = useState<MakineRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const start = new Date();
        start.setDate(today.getDate() - 6);

        const [{ data: uData, error: uError }, { data: mData, error: mError }] =
          await Promise.all([
            supabase
              .from("uretim")
              .select(
                `id, hedef_adet, uretilen_adet, baslangic_zamani, bitis_zamani, durum, makine_id, urun_id,
                 urun:urun_id (ad),
                 makine:makine_id (ad)`
              )
              .gte("baslangic_zamani", start.toISOString()),
            supabase.from("makine").select("id, ad, uretim_kapasitesi"),
          ]);

        if (uError) throw uError;
        if (mError) throw mError;

        setUretimler((uData as UretimRow[]) || []);
        setMakineler((mData as MakineRow[]) || []);
      } catch (error: any) {
        console.error("Üretim verileri yüklenirken hata:", error);
        toast.error("Üretim verileri yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const aktifUretimler = useMemo(
    () => uretimler.filter((u) => u.durum === "devam_ediyor"),
    [uretimler]
  );

  const toplamHedef = useMemo(
    () => uretimler.reduce((sum, u) => sum + (u.hedef_adet || 0), 0),
    [uretimler]
  );
  const toplamUretilen = useMemo(
    () => uretimler.reduce((sum, u) => sum + (u.uretilen_adet || 0), 0),
    [uretimler]
  );

  const uretimVerimlilik = toplamHedef > 0 ? Math.round((toplamUretilen / toplamHedef) * 100) : 0;
  const oeeSkoru = uretimVerimlilik; // Basit yaklaşım: şimdilik aynı

  const ortalamaSure = useMemo(() => {
    const completed = uretimler.filter(
      (u) => u.bitis_zamani && !Number.isNaN(new Date(u.bitis_zamani).getTime())
    );
    if (!completed.length) return 0;
    const totalHours = completed.reduce((sum, u) => {
      const start = new Date(u.baslangic_zamani);
      const end = new Date(u.bitis_zamani as string);
      return sum + Math.max(0, (end.getTime() - start.getTime()) / 36e5);
    }, 0);
    return totalHours / completed.length;
  }, [uretimler]);

  const weeklyTrend = useMemo(() => {
    const today = new Date();
    const byDay: Record<string, { tarih: string; adet: number }> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split("T")[0];
      byDay[key] = { tarih: key.slice(5), adet: 0 };
    }

    uretimler.forEach((u) => {
      const d = new Date(u.baslangic_zamani);
      if (Number.isNaN(d.getTime())) return;
      const key = d.toISOString().split("T")[0];
      if (!byDay[key]) return;
      const qty = u.uretilen_adet || u.hedef_adet || 0;
      byDay[key].adet += qty;
    });

    return Object.values(byDay);
  }, [uretimler]);

  const machineUsage = useMemo(() => {
    if (!makineler.length) return [];

    const producedByMachine: Record<string, number> = {};

    uretimler.forEach((u) => {
      if (!u.makine_id) return;
      const qty = u.uretilen_adet || u.hedef_adet || 0;
      producedByMachine[u.makine_id] = (producedByMachine[u.makine_id] || 0) + qty;
    });

    const hoursPerMachine = 8 * 7; // Son 7 gün, günde 8 saat varsayımı

    return makineler.map((m) => {
      const produced = producedByMachine[m.id] || 0;
      const theoretical = m.uretim_kapasitesi > 0 ? m.uretim_kapasitesi * hoursPerMachine : 0;
      const usage = theoretical > 0 ? Math.min(100, (produced / theoretical) * 100) : 0;

      return {
        makine: m.ad,
        kullanim: Number(usage.toFixed(1)),
      };
    });
  }, [makineler, uretimler]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Üretim Yönetimi</h1>
          <p className="text-white/70">Anlık üretim durumu ve performans metrikleri</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="OEE Skoru"
            value={`${oeeSkoru}%`}
            icon={Target}
            variant="info"
            subtitle="Overall Equipment Effectiveness"
          />
          <KpiCard
            title="Üretim Verimliliği"
            value={`${uretimVerimlilik}%`}
            icon={TrendingUp}
            variant="success"
            subtitle="Hedef: 85%"
          />
          <KpiCard
            title="Aktif Üretim"
            value={aktifUretimler.length}
            icon={Factory}
            variant="default"
            subtitle={`${uretimler.length} toplam üretim`}
          />
          <KpiCard
            title="Ortalama Süre"
            value={`${ortalamaSure.toFixed(1)} saat`}
            icon={Clock}
            variant="warning"
            subtitle="Üretim başına"
          />
        </div>

        {/* Aktif Üretimler */}
        <Card className="bg-card border-border hover:border-primary/30 transition-all">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-card-foreground">Aktif Üretimler</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Makine Adı</TableHead>
                  <TableHead>Ürün Adı</TableHead>
                  <TableHead>Başlangıç</TableHead>
                  <TableHead>İlerleme</TableHead>
                  <TableHead>Üretilen</TableHead>
                  <TableHead>Personel</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      Üretim verileri yükleniyor...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && aktifUretimler.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      Aktif üretim bulunmamaktadır
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  aktifUretimler.map((uretim) => {
                    const oran =
                      uretim.hedef_adet > 0
                        ? Math.round((uretim.uretilen_adet / uretim.hedef_adet) * 100)
                        : 0;
                    return (
                      <TableRow key={uretim.id}>
                        <TableCell className="font-medium">
                          {uretim.makine?.ad || "Bilinmiyor"}
                        </TableCell>
                        <TableCell>{uretim.urun?.ad || "Bilinmiyor"}</TableCell>
                        <TableCell>{uretim.baslangic_zamani}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${oran}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">{oran}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {uretim.uretilen_adet} / {uretim.hedef_adet}
                        </TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>
                          <StatusBadge status={uretim.durum} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Grafikler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border hover:border-primary/30 transition-all">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-card-foreground">
                Haftalık Üretim Trendi
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {weeklyTrend.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  Üretim verisi bulunamadı
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="tarih" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="adet" name="Üretilen Adet" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary/30 transition-all">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-card-foreground">
                Makine Kapasite Kullanımı (Son 7 Gün)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {machineUsage.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  Makine verisi bulunamadı
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={machineUsage}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="makine" stroke="#9ca3af" />
                    <YAxis unit="%" stroke="#9ca3af" />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="kullanim"
                      name="Kapasite Kullanımı"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* OEE Bileşenleri */}
        <Card className="bg-card border-border hover:border-primary/30 transition-all">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-card-foreground">OEE Bileşenleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Kullanılabilirlik</span>
                  <span className="text-lg font-bold text-foreground">85%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-success" style={{ width: "85%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Performans</span>
                  <span className="text-lg font-bold text-foreground">78%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-warning" style={{ width: "78%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Kalite</span>
                  <span className="text-lg font-bold text-foreground">92%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: "92%" }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Üretilen Kazan Ölçüleri ve Resimleri */}
        <Card className="bg-card border-border hover:border-primary/30 transition-all">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-card-foreground">Kazan Ürünleri - Teknik Özellikler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockUrunler.map((urun) => (
                <div key={urun.id} className="border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all">
                  {urun.resim_url && (
                    <div className="relative h-48 bg-muted">
                      <img 
                        src={urun.resim_url} 
                        alt={urun.ad}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{urun.ad}</h3>
                      <p className="text-sm text-muted-foreground">{urun.tur}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {urun.en && (
                        <div>
                          <span className="text-muted-foreground">En:</span>
                          <span className="ml-1 text-foreground font-medium">{urun.en} cm</span>
                        </div>
                      )}
                      {urun.boy && (
                        <div>
                          <span className="text-muted-foreground">Boy:</span>
                          <span className="ml-1 text-foreground font-medium">{urun.boy} cm</span>
                        </div>
                      )}
                      {urun.yukseklik && (
                        <div>
                          <span className="text-muted-foreground">Yükseklik:</span>
                          <span className="ml-1 text-foreground font-medium">{urun.yukseklik} cm</span>
                        </div>
                      )}
                      {urun.hacim && (
                        <div>
                          <span className="text-muted-foreground">Hacim:</span>
                          <span className="ml-1 text-foreground font-medium">{urun.hacim} L</span>
                        </div>
                      )}
                      {urun.agirlik && (
                        <div>
                          <span className="text-muted-foreground">Ağırlık:</span>
                          <span className="ml-1 text-foreground font-medium">{urun.agirlik} kg</span>
                        </div>
                      )}
                      {urun.max_basinc && (
                        <div>
                          <span className="text-muted-foreground">Max Basınç:</span>
                          <span className="ml-1 text-foreground font-medium">{urun.max_basinc} bar</span>
                        </div>
                      )}
                      {urun.max_sicaklik && (
                        <div>
                          <span className="text-muted-foreground">Max Sıcaklık:</span>
                          <span className="ml-1 text-foreground font-medium">{urun.max_sicaklik}°C</span>
                        </div>
                      )}
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Stok:</span>
                        <span className="ml-1 text-foreground font-medium">{urun.stok_miktari} adet</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Satış Fiyatı:</span>
                        <span className="text-lg font-bold text-primary">{urun.satis_fiyati.toLocaleString('tr-TR')} ₺</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
