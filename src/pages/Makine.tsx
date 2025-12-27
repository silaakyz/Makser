import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Settings, AlertTriangle, Wrench, Activity, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface MakineData {
  id: string;
  ad: string;
  tur: string;
  uretim_kapasitesi: number;
  durum: 'aktif' | 'boşta' | 'arızalı' | 'bakımda';
  son_bakim_tarihi: string | null;
  sonraki_bakim_tarihi: string | null;
}

export default function Makine() {
  const { roles } = useAuth();
  const [makineler, setMakineler] = useState<MakineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [dailyWork, setDailyWork] = useState<Array<{ tarih: string; saat: number }>>([]);
  const [statusUsage, setStatusUsage] = useState<Array<{ durum: string; oran: number }>>([]);

  const isAdmin = roles.includes('sirket_sahibi') || roles.includes('genel_mudur');

  useEffect(() => {
    fetchMakineler();
    fetchDailyWork();
  }, []);

  const fetchMakineler = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("makine")
        .select(`
          makine_id,
          ad,
          tur,
          kapasite,
          toplam_calisma_saati,
          makine_bakim (
            bakim_tarihi,
            sonraki_bakim_tarihi
          )
        `)
        .order("ad");

      if (error) throw error;

      // Map to component interface with mocks
      const mappedData: MakineData[] = (data || []).map((m: any) => {
        // Derive maintenance info from joined makine_bakim table
        const bakimlar = m.makine_bakim || [];
        // Sort by date desc to get latest
        bakimlar.sort((a: any, b: any) => new Date(b.bakim_tarihi).getTime() - new Date(a.bakim_tarihi).getTime());
        const lastMaint = bakimlar[0];

        return {
          id: m.makine_id,
          ad: m.ad,
          tur: m.tur,
          uretim_kapasitesi: parseInt(m.kapasite || '0'),
          durum: "aktif", // Mock status as schema has no status col
          son_bakim_tarihi: lastMaint?.bakim_tarihi ? new Date(lastMaint.bakim_tarihi).toISOString().split('T')[0] : null,
          sonraki_bakim_tarihi: lastMaint?.sonraki_bakim_tarihi ? new Date(lastMaint.sonraki_bakim_tarihi).toISOString().split('T')[0] : null,
        }
      });

      setMakineler(mappedData);
    } catch (error: any) {
      console.error('Makine verileri yüklenirken hata:', error);
      toast.error('Makine verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const updateMakineDurum = async (makineId: string, yeniDurum: 'aktif' | 'boşta' | 'arızalı' | 'bakımda') => {
    try {
      setUpdating(makineId);

      setUpdating(makineId);

      // Feature disabled: 'durum' column does not exist in 'makine' table
      // const { error } = await supabase
      //   .from('makine')
      //   .update({ durum: yeniDurum })
      //   .eq('makine_id', makineId);

      // Mock delay
      await new Promise(r => setTimeout(r, 500));
      // if (error) throw error;

      toast.info("Bu özellik veritabanı şema kısıtlaması nedeniyle şu an devre dışıdır.");
      return; // Exit

      // toast.success('Makine durumu güncellendi');
      // fetchMakineler();
    } catch (error: any) {
      console.error('Makine durumu güncellenirken hata:', error);
      toast.error('Makine durumu güncellenemedi: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setUpdating(null);
    }
  };

  const aktifMakineler = makineler.filter(m => m.durum === "aktif").length;
  const arizaliMakineler = makineler.filter(m => m.durum === "arızalı").length;
  const bakimdaMakineler = makineler.filter(m => m.durum === "bakımda").length;

  useEffect(() => {
    if (!makineler.length) {
      setStatusUsage([]);
      return;
    }

    const toplam = makineler.length || 1;
    const counts = makineler.reduce(
      (acc, m) => {
        acc[m.durum] = (acc[m.durum] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const data = [
      { durum: "Aktif", oran: ((counts["aktif"] || 0) / toplam) * 100 },
      { durum: "Boşta", oran: ((counts["boşta"] || 0) / toplam) * 100 },
      { durum: "Arızalı", oran: ((counts["arızalı"] || 0) / toplam) * 100 },
      { durum: "Bakımda", oran: ((counts["bakımda"] || 0) / toplam) * 100 },
    ];

    setStatusUsage(data);
  }, [makineler]);

  const fetchDailyWork = async () => {
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);

      const { data, error } = await supabase
        .from("uretim_kayit")
        .select("baslama_zamani, bitis_zamani")
        .gte("baslama_zamani", start.toISOString());

      if (error) throw error;

      const byDay: Record<string, number> = {};

      (data || []).forEach((row: any) => {
        const bas = row.baslama_zamani ? new Date(row.baslama_zamani) : null;
        const bit = row.bitis_zamani ? new Date(row.bitis_zamani) : null;
        if (!bas) return;
        const endTime = bit || new Date();
        const hours = Math.max(0, (endTime.getTime() - bas.getTime()) / 36e5);
        const key = bas.toISOString().split("T")[0];
        byDay[key] = (byDay[key] || 0) + hours;
      });

      const result: Array<{ tarih: string; saat: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(end.getDate() - i);
        const key = d.toISOString().split("T")[0];
        result.push({
          tarih: key.slice(5), // MM-DD
          saat: Number((byDay[key] || 0).toFixed(1)),
        });
      }

      setDailyWork(result);
    } catch (error: any) {
      console.error("Günlük çalışma süresi hesaplanırken hata:", error);
    }
  };

  const exportToExcel = () => {
    // Makineler için worksheet
    const machineData = makineler.map((m) => ({
      "Makine Adı": m.ad,
      "Makine Türü": m.tur,
      "Durum": m.durum,
      "Kapasite (adet/saat)": m.uretim_kapasitesi,
      "Son Bakım": m.son_bakim_tarihi || "-",
      "Sonraki Bakım": m.sonraki_bakim_tarihi || "-",
    }));

    // Bakımlar için worksheet
    const bakimData = mockBakimlar.map((b) => ({
      "Makine": b.makine,
      "Bakım Tarihi": b.bakim_tarihi,
      "Bakım Türü": b.bakim_turu,
      "Maliyet (₺)": b.maliyet,
      "Açıklama": b.aciklama,
    }));

    // Arızalar için worksheet
    const arizaData = mockArizalar.map((a) => ({
      "Makine": a.makine,
      "Başlangıç": a.baslangic_tarihi,
      "Bitiş": a.bitis_tarihi || "Devam ediyor",
      "Süre (Saat)": a.sure_saat || "-",
      "Maliyet (₺)": a.maliyet || "-",
      "Açıklama": a.aciklama,
    }));

    const wb = XLSX.utils.book_new();
    const wsMachines = XLSX.utils.json_to_sheet(machineData);
    const wsBakim = XLSX.utils.json_to_sheet(bakimData);
    const wsAriza = XLSX.utils.json_to_sheet(arizaData);

    XLSX.utils.book_append_sheet(wb, wsMachines, "Makineler");
    XLSX.utils.book_append_sheet(wb, wsBakim, "Bakım Kayıtları");
    XLSX.utils.book_append_sheet(wb, wsAriza, "Arıza Kayıtları");

    const fileName = `Makine_Raporu_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast.success("Makine raporu başarıyla indirildi!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Makine Yönetimi</h1>
            <p className="text-white/70">Makine durumu, bakım ve arıza takibi</p>
          </div>
          <Button
            onClick={exportToExcel}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Download className="w-4 h-4" />
            Excel Raporu İndir
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Aktif Makineler"
            value={aktifMakineler}
            icon={Activity}
            variant="success"
            subtitle={`${makineler.length} toplam makine`}
          />
          <KpiCard
            title="Çalışma Oranı"
            value={makineler.length > 0 ? `${Math.round((aktifMakineler / makineler.length) * 100)}%` : '0%'}
            icon={Settings}
            variant="info"
            subtitle="Ortalama"
          />
          <KpiCard
            title="Arızalı"
            value={arizaliMakineler}
            icon={AlertTriangle}
            variant="destructive"
            subtitle="Acil müdahale gerekli"
          />
          <KpiCard
            title="Bakımda"
            value={bakimdaMakineler}
            icon={Wrench}
            variant="warning"
            subtitle="Planlı bakım"
          />
        </div>

        {/* Makine Durum Kartları */}
        <Card className="bg-card border-border hover:border-primary/30 transition-all">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-card-foreground">Makine Durumları</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {makineler.map((makine) => (
                  <Card
                    key={makine.id}
                    className="bg-card border-2 border-border hover:border-primary/50 transition-all"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <Settings className="w-8 h-8 text-primary" />
                        <div className="flex items-center gap-2">
                          <StatusBadge status={makine.durum} />
                          {isAdmin && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  className="h-6 w-6 p-0 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                  disabled={updating === makine.id}
                                >
                                  <Wrench className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => updateMakineDurum(makine.id, 'bakımda')}
                                  disabled={makine.durum === 'bakımda' || updating === makine.id}
                                >
                                  Bakıma Al
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => updateMakineDurum(makine.id, 'arızalı')}
                                  disabled={makine.durum === 'arızalı' || updating === makine.id}
                                >
                                  Arızalı İşaretle
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => updateMakineDurum(makine.id, 'aktif')}
                                  disabled={makine.durum === 'aktif' || updating === makine.id}
                                >
                                  Aktif Yap
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => updateMakineDurum(makine.id, 'boşta')}
                                  disabled={makine.durum === 'boşta' || updating === makine.id}
                                >
                                  Boşta Yap
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      <h4 className="font-semibold text-card-foreground mb-1">{makine.ad}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{makine.tur}</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Kapasite:</span>
                          <span className="text-card-foreground font-medium">{makine.uretim_kapasitesi}/saat</span>
                        </div>
                        {makine.sonraki_bakim_tarihi && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sonraki Bakım:</span>
                            <span className="text-card-foreground font-medium">{makine.sonraki_bakim_tarihi}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {makineler.length === 0 && (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                    Henüz makine kaydı bulunmamaktadır
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Yaklaşan Bakımlar */}
        <Card className="bg-card border-border hover:border-primary/30 transition-all">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-card-foreground">Yaklaşan Bakımlar</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Makine</TableHead>
                  <TableHead>Bakım Tarihi</TableHead>
                  <TableHead>Bakım Türü</TableHead>
                  <TableHead>Tahmini Maliyet</TableHead>
                  <TableHead>Açıklama</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {makineler
                  .filter(m => m.sonraki_bakim_tarihi)
                  .map((makine) => (
                    <TableRow key={makine.id}>
                      <TableCell className="font-medium">{makine.ad}</TableCell>
                      <TableCell>{makine.sonraki_bakim_tarihi}</TableCell>
                      <TableCell>
                        <StatusBadge status="bakımda" className="text-xs" />
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-muted-foreground">Planlı bakım</TableCell>
                    </TableRow>
                  ))}
                {makineler.filter(m => m.sonraki_bakim_tarihi).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Yaklaşan bakım kaydı bulunmamaktadır
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Arıza Geçmişi */}
        <Card className="bg-card border-border hover:border-primary/30 transition-all">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-card-foreground">Arızalı Makineler</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Makine</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Makine Türü</TableHead>
                  <TableHead>Kapasite</TableHead>
                  {isAdmin && <TableHead>İşlemler</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {makineler
                  .filter(m => m.durum === 'arızalı')
                  .map((makine) => (
                    <TableRow key={makine.id}>
                      <TableCell className="font-medium">{makine.ad}</TableCell>
                      <TableCell>
                        <StatusBadge status="arızalı" className="text-xs" />
                      </TableCell>
                      <TableCell>{makine.tur}</TableCell>
                      <TableCell>{makine.uretim_kapasitesi}/saat</TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Button
                            size="sm"
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => updateMakineDurum(makine.id, 'aktif')}
                            disabled={updating === makine.id}
                          >
                            {updating === makine.id ? 'Güncelleniyor...' : 'Aktif Yap'}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                {makineler.filter(m => m.durum === 'arızalı').length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 5 : 4} className="text-center text-muted-foreground py-8">
                      Arızalı makine bulunmamaktadır
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Grafikler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border hover:border-primary/30 transition-all">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-card-foreground">
                Günlük Çalışma Süresi (Son 7 Gün)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {dailyWork.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  Veri bulunamadı
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyWork}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="tarih" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="saat" name="Çalışma Saati" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary/30 transition-all">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-card-foreground">
                Makine Kullanım Oranı
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {statusUsage.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  Veri bulunamadı
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={statusUsage}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="durum" stroke="#9ca3af" />
                    <YAxis unit="%" stroke="#9ca3af" />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="oran"
                      name="Kullanım Oranı"
                      stroke="#10b981"
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
