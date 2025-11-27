import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ChartPlaceholder } from "@/components/dashboard/ChartPlaceholder";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockUretimler, mockKPIs, mockUretimTrendi, mockMakineKullanimi } from "@/lib/mockData";
import { Factory, TrendingUp, Clock, Target } from "lucide-react";

export default function Uretim() {
  const aktifUretimler = mockUretimler.filter(u => u.durum === "devam_ediyor");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Üretim Yönetimi</h1>
          <p className="text-muted-foreground">Anlık üretim durumu ve performans metrikleri</p>
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
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">Aktif Üretimler</CardTitle>
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
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">OEE Bileşenleri</CardTitle>
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
      </div>
    </DashboardLayout>
  );
}
