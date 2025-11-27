import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ChartPlaceholder } from "@/components/dashboard/ChartPlaceholder";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockMachines, mockArizalar, mockBakimlar, mockKPIs } from "@/lib/mockData";
import { Settings, AlertTriangle, Wrench, Activity } from "lucide-react";

export default function Makine() {
  const aktifMakineler = mockMachines.filter(m => m.durum === "aktif").length;
  const arizaliMakineler = mockMachines.filter(m => m.durum === "arızalı").length;
  const bakimdaMakineler = mockMachines.filter(m => m.durum === "bakımda").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Makine Yönetimi</h1>
          <p className="text-muted-foreground">Makine durumu, bakım ve arıza takibi</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Aktif Makineler"
            value={aktifMakineler}
            icon={Activity}
            variant="success"
            subtitle={`${mockMachines.length} toplam makine`}
          />
          <KpiCard
            title="Çalışma Oranı"
            value={`${mockKPIs.makineCalismaOrani}%`}
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
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">Makine Durumları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {mockMachines.map((makine) => (
                <Card 
                  key={makine.id}
                  className="bg-card/50 border-2 border-border hover:border-primary/50 transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Settings className="w-8 h-8 text-muted-foreground" />
                      <StatusBadge status={makine.durum} />
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">{makine.ad}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{makine.tur}</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Kapasite:</span>
                        <span className="text-foreground font-medium">{makine.uretim_kapasitesi}/saat</span>
                      </div>
                      {makine.sonraki_bakim_tarihi && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sonraki Bakım:</span>
                          <span className="text-foreground font-medium">{makine.sonraki_bakim_tarihi}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Yaklaşan Bakımlar */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">Yaklaşan Bakımlar</CardTitle>
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
                {mockBakimlar.map((bakim) => (
                  <TableRow key={bakim.id}>
                    <TableCell className="font-medium">{bakim.makine}</TableCell>
                    <TableCell>{bakim.bakim_tarihi}</TableCell>
                    <TableCell>
                      <StatusBadge status="bakımda" className="text-xs" />
                    </TableCell>
                    <TableCell>₺{bakim.maliyet.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{bakim.aciklama}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Arıza Geçmişi */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">Arıza Geçmişi (Son 30 Gün)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Makine</TableHead>
                  <TableHead>Başlangıç</TableHead>
                  <TableHead>Bitiş</TableHead>
                  <TableHead>Süre (Saat)</TableHead>
                  <TableHead>Maliyet</TableHead>
                  <TableHead>Açıklama</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockArizalar.map((ariza) => (
                  <TableRow key={ariza.id}>
                    <TableCell className="font-medium">{ariza.makine}</TableCell>
                    <TableCell>{ariza.baslangic_tarihi}</TableCell>
                    <TableCell>
                      {ariza.bitis_tarihi || (
                        <StatusBadge status="arızalı" className="text-xs" />
                      )}
                    </TableCell>
                    <TableCell>
                      {ariza.sure_saat ? `${ariza.sure_saat}h` : "-"}
                    </TableCell>
                    <TableCell>
                      {ariza.maliyet ? `₺${ariza.maliyet.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{ariza.aciklama}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Grafikler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartPlaceholder 
            title="Günlük Çalışma Süresi" 
            type="bar"
            height="h-80"
          />
          <ChartPlaceholder 
            title="Makine Kullanım Oranı" 
            type="line"
            height="h-80"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
