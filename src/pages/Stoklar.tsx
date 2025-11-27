import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ChartPlaceholder } from "@/components/dashboard/ChartPlaceholder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockHammaddeler, mockUrunler } from "@/lib/mockData";
import { Package, AlertCircle, TrendingDown, Boxes } from "lucide-react";

export default function Stoklar() {
  const kritikHammaddeler = mockHammaddeler.filter(h => h.stok_miktari <= h.kritik_stok_seviyesi);
  const kritikUrunler = mockUrunler.filter(u => u.stok_miktari <= u.kritik_stok_seviyesi);
  const toplamHammaddeStok = mockHammaddeler.reduce((sum, h) => sum + h.stok_miktari, 0);
  const toplamUrunStok = mockUrunler.reduce((sum, u) => sum + u.stok_miktari, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Stok Yönetimi</h1>
          <p className="text-muted-foreground">Hammadde ve ürün stok durumu</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Kritik Stok"
            value={kritikHammaddeler.length + kritikUrunler.length}
            icon={AlertCircle}
            variant="destructive"
            subtitle="Acil sipariş gerekli"
          />
          <KpiCard
            title="Hammadde Stok"
            value={mockHammaddeler.length}
            icon={Package}
            variant="info"
            subtitle={`${toplamHammaddeStok.toLocaleString()} birim`}
          />
          <KpiCard
            title="Ürün Stok"
            value={mockUrunler.length}
            icon={Boxes}
            variant="success"
            subtitle={`${toplamUrunStok} adet`}
          />
          <KpiCard
            title="Tüketim Hızı"
            value="12.5%"
            icon={TrendingDown}
            variant="warning"
            subtitle="Haftalık ortalama"
          />
        </div>

        {/* Kritik Hammadde Stokları */}
        {kritikHammaddeler.length > 0 && (
          <Card className="bg-card border-2 border-destructive/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Kritik Seviyedeki Hammaddeler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hammadde Adı</TableHead>
                    <TableHead>Mevcut Stok</TableHead>
                    <TableHead>Kritik Seviye</TableHead>
                    <TableHead>Birim</TableHead>
                    <TableHead>Tüketim Hızı</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kritikHammaddeler.map((hammadde) => (
                    <TableRow key={hammadde.id}>
                      <TableCell className="font-medium">{hammadde.ad}</TableCell>
                      <TableCell className="text-destructive font-semibold">
                        {hammadde.stok_miktari}
                      </TableCell>
                      <TableCell>{hammadde.kritik_stok_seviyesi}</TableCell>
                      <TableCell>{hammadde.birim}</TableCell>
                      <TableCell>{hammadde.tuketim_hizi} {hammadde.birim}/gün</TableCell>
                      <TableCell>
                        <Badge variant="destructive">Kritik</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Tüm Hammadde Stokları */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">Hammadde Stok Seviyeleri</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hammadde Adı</TableHead>
                  <TableHead>Stok Miktarı</TableHead>
                  <TableHead>Birim</TableHead>
                  <TableHead>Birim Fiyat</TableHead>
                  <TableHead>Toplam Değer</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockHammaddeler.map((hammadde) => {
                  const isDusuk = hammadde.stok_miktari <= hammadde.kritik_stok_seviyesi;
                  const toplamDeger = hammadde.stok_miktari * hammadde.birim_fiyat;
                  
                  return (
                    <TableRow key={hammadde.id}>
                      <TableCell className="font-medium">{hammadde.ad}</TableCell>
                      <TableCell className={isDusuk ? "text-destructive font-semibold" : ""}>
                        {hammadde.stok_miktari}
                      </TableCell>
                      <TableCell>{hammadde.birim}</TableCell>
                      <TableCell>₺{hammadde.birim_fiyat}</TableCell>
                      <TableCell>₺{toplamDeger.toLocaleString()}</TableCell>
                      <TableCell>
                        {isDusuk ? (
                          <Badge variant="destructive">Düşük</Badge>
                        ) : (
                          <Badge variant="default" className="bg-success text-success-foreground">Normal</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Ürün Stokları */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">Ürün Stok Durumu</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün Adı</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Stok Miktarı</TableHead>
                  <TableHead>Satış Fiyatı</TableHead>
                  <TableHead>Toplam Değer</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockUrunler.map((urun) => {
                  const isDusuk = urun.stok_miktari <= urun.kritik_stok_seviyesi;
                  const toplamDeger = urun.stok_miktari * urun.satis_fiyati;
                  
                  return (
                    <TableRow key={urun.id}>
                      <TableCell className="font-medium">{urun.ad}</TableCell>
                      <TableCell>{urun.tur}</TableCell>
                      <TableCell className={isDusuk ? "text-destructive font-semibold" : ""}>
                        {urun.stok_miktari}
                      </TableCell>
                      <TableCell>₺{urun.satis_fiyati.toLocaleString()}</TableCell>
                      <TableCell>₺{toplamDeger.toLocaleString()}</TableCell>
                      <TableCell>
                        {isDusuk ? (
                          <Badge variant="destructive">Düşük</Badge>
                        ) : (
                          <Badge variant="default" className="bg-success text-success-foreground">Normal</Badge>
                        )}
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
            title="Hammadde Tüketim Hızı" 
            type="line"
            height="h-80"
          />
          <ChartPlaceholder 
            title="Stok Değer Dağılımı" 
            type="pie"
            height="h-80"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
