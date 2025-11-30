import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ChartPlaceholder } from "@/components/dashboard/ChartPlaceholder";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockUretimler, mockKPIs, mockUretimTrendi, mockMakineKullanimi, mockUrunler } from "@/lib/mockData";
import { Factory, TrendingUp, Clock, Target } from "lucide-react";

export default function Uretim() {
  const aktifUretimler = mockUretimler.filter(u => u.durum === "devam_ediyor");

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
            value={`${mockKPIs.oee}%`}
            icon={Target}
            variant="info"
            subtitle="Overall Equipment Effectiveness"
          />
          <KpiCard
            title="Üretim Verimliliği"
            value={`${mockKPIs.uretimVerimlilik}%`}
            icon={TrendingUp}
            variant="success"
            subtitle="Hedef: 85%"
          />
          <KpiCard
            title="Aktif Üretim"
            value={aktifUretimler.length}
            icon={Factory}
            variant="default"
            subtitle={`${mockUretimler.length} toplam üretim`}
          />
          <KpiCard
            title="Ortalama Süre"
            value="4.2 saat"
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
                {aktifUretimler.map((uretim) => {
                  const oran = Math.round((uretim.uretilen_adet / uretim.hedef_adet) * 100);
                  return (
                    <TableRow key={uretim.id}>
                      <TableCell className="font-medium">{uretim.makine}</TableCell>
                      <TableCell>{uretim.urun}</TableCell>
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
                      <TableCell>{uretim.calisan_personel}</TableCell>
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
          <ChartPlaceholder 
            title="Haftalık Üretim Trendi" 
            type="bar"
            height="h-80"
          />
          <ChartPlaceholder 
            title="Makine Kapasite Kullanımı" 
            type="line"
            height="h-80"
          />
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
