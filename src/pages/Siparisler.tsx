import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ChartPlaceholder } from "@/components/dashboard/ChartPlaceholder";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockSiparisler, mockKPIs } from "@/lib/mockData";
import { ShoppingCart, Clock, CheckCircle, Loader } from "lucide-react";

export default function Siparisler() {
  const bekleyenSiparisler = mockSiparisler.filter(s => s.durum === "beklemede");
  const uretimdeSiparisler = mockSiparisler.filter(s => s.durum === "uretimde");
  const tamamlananSiparisler = mockSiparisler.filter(s => s.durum === "tamamlandi");
  const toplamTutar = mockSiparisler.reduce((sum, s) => sum + s.siparis_maliyeti, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Sipariş Yönetimi</h1>
          <p className="text-muted-foreground">Sipariş takibi ve durum kontrolü</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Bekleyen Siparişler"
            value={bekleyenSiparisler.length}
            icon={Clock}
            variant="warning"
            subtitle="Üretime alınacak"
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
            subtitle={`%${mockKPIs.sipariseTamamlamaOrani} tamamlama oranı`}
          />
          <KpiCard
            title="Toplam Tutar"
            value={`₺${(toplamTutar / 1000).toFixed(0)}K`}
            icon={ShoppingCart}
            variant="default"
            subtitle="Aylık sipariş değeri"
          />
        </div>

        {/* Bekleyen Siparişler */}
        <Card className="bg-card border-2 border-warning/30 shadow-[0_0_15px_rgba(251,146,60,0.1)]">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {bekleyenSiparisler.map((siparis) => (
                  <TableRow key={siparis.id}>
                    <TableCell className="font-medium">{siparis.musteri}</TableCell>
                    <TableCell>{siparis.urun}</TableCell>
                    <TableCell>{siparis.miktar}</TableCell>
                    <TableCell>{siparis.siparis_tarihi}</TableCell>
                    <TableCell>{siparis.teslim_tarihi}</TableCell>
                    <TableCell>₺{siparis.siparis_maliyeti.toLocaleString()}</TableCell>
                    <TableCell>
                      <StatusBadge status={siparis.durum} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Üretimdeki Siparişler */}
        <Card className="bg-card border-2 border-accent/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Loader className="w-5 h-5 text-accent" />
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {uretimdeSiparisler.map((siparis) => (
                  <TableRow key={siparis.id}>
                    <TableCell className="font-medium">{siparis.musteri}</TableCell>
                    <TableCell>{siparis.urun}</TableCell>
                    <TableCell>{siparis.miktar}</TableCell>
                    <TableCell>
                      <StatusBadge status={siparis.kaynak} />
                    </TableCell>
                    <TableCell>{siparis.teslim_tarihi}</TableCell>
                    <TableCell>₺{siparis.siparis_maliyeti.toLocaleString()}</TableCell>
                    <TableCell>
                      <StatusBadge status={siparis.durum} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tamamlanan Siparişler */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
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
                    <TableCell>{siparis.urun}</TableCell>
                    <TableCell>{siparis.miktar}</TableCell>
                    <TableCell>{siparis.siparis_tarihi}</TableCell>
                    <TableCell>{siparis.teslim_tarihi}</TableCell>
                    <TableCell>₺{siparis.siparis_maliyeti.toLocaleString()}</TableCell>
                    <TableCell>
                      <StatusBadge status={siparis.durum} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Grafikler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartPlaceholder 
            title="Sipariş Durum Dağılımı" 
            type="pie"
            height="h-80"
          />
          <ChartPlaceholder 
            title="Aylık Sipariş Trendi" 
            type="line"
            height="h-80"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
