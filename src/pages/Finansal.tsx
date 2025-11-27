import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ChartPlaceholder } from "@/components/dashboard/ChartPlaceholder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockFinansal } from "@/lib/mockData";
import { DollarSign, TrendingUp, TrendingDown, Wrench } from "lucide-react";

export default function Finansal() {
  const toplamGelir = mockFinansal.urunKarliligi.reduce(
    (sum, u) => sum + (u.satis * u.miktar), 0
  );
  const toplamMaliyet = mockFinansal.urunKarliligi.reduce(
    (sum, u) => sum + (u.maliyet * u.miktar), 0
  );
  const toplamKar = toplamGelir - toplamMaliyet;
  const karMarji = ((toplamKar / toplamGelir) * 100).toFixed(1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Finansal Özet</h1>
          <p className="text-muted-foreground">Maliyet analizi ve kârlılık raporları</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Günlük Maliyet"
            value={`₺${(mockFinansal.gunlukMaliyet / 1000).toFixed(0)}K`}
            icon={DollarSign}
            variant="info"
            subtitle="Bugünkü toplam harcama"
          />
          <KpiCard
            title="Haftalık Maliyet"
            value={`₺${(mockFinansal.haftalikMaliyet / 1000).toFixed(0)}K`}
            icon={TrendingDown}
            variant="warning"
            subtitle="7 günlük toplam"
          />
          <KpiCard
            title="Toplam Kâr"
            value={`₺${(toplamKar / 1000).toFixed(0)}K`}
            icon={TrendingUp}
            variant="success"
            subtitle={`%${karMarji} kâr marjı`}
          />
          <KpiCard
            title="Bakım Maliyeti"
            value={`₺${(mockFinansal.bakimMaliyeti / 1000).toFixed(0)}K`}
            icon={Wrench}
            variant="destructive"
            subtitle="Aylık bakım gideri"
          />
        </div>

        {/* Maliyet Dağılımı */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Hammadde Maliyeti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-foreground">
                  ₺{(mockFinansal.hammaddeMaliyeti / 1000).toFixed(0)}K
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ 
                        width: `${(mockFinansal.hammaddeMaliyeti / mockFinansal.haftalikMaliyet) * 100}%` 
                      }} 
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {((mockFinansal.hammaddeMaliyeti / mockFinansal.haftalikMaliyet) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Bakım Maliyeti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-foreground">
                  ₺{(mockFinansal.bakimMaliyeti / 1000).toFixed(0)}K
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-warning" 
                      style={{ 
                        width: `${(mockFinansal.bakimMaliyeti / mockFinansal.haftalikMaliyet) * 100}%` 
                      }} 
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {((mockFinansal.bakimMaliyeti / mockFinansal.haftalikMaliyet) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Arıza Maliyeti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-foreground">
                  ₺{(mockFinansal.arizaMaliyeti / 1000).toFixed(0)}K
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-destructive" 
                      style={{ 
                        width: `${(mockFinansal.arizaMaliyeti / mockFinansal.haftalikMaliyet) * 100}%` 
                      }} 
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {((mockFinansal.arizaMaliyeti / mockFinansal.haftalikMaliyet) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ürün Bazlı Kârlılık */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">Ürün Bazlı Kârlılık Analizi</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Birim Maliyet</TableHead>
                  <TableHead>Satış Fiyatı</TableHead>
                  <TableHead>Birim Kâr</TableHead>
                  <TableHead>Üretilen Miktar</TableHead>
                  <TableHead>Toplam Kâr</TableHead>
                  <TableHead>Kâr Marjı</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockFinansal.urunKarliligi.map((urun) => {
                  const toplamKar = urun.kar * urun.miktar;
                  const karMarji = ((urun.kar / urun.satis) * 100).toFixed(1);
                  
                  return (
                    <TableRow key={urun.urun}>
                      <TableCell className="font-medium">{urun.urun}</TableCell>
                      <TableCell>₺{urun.maliyet}</TableCell>
                      <TableCell>₺{urun.satis}</TableCell>
                      <TableCell className="text-success font-semibold">₺{urun.kar}</TableCell>
                      <TableCell>{urun.miktar}</TableCell>
                      <TableCell className="text-success font-bold">
                        ₺{toplamKar.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${
                          parseFloat(karMarji) > 20 
                            ? "text-success" 
                            : parseFloat(karMarji) > 10 
                            ? "text-warning" 
                            : "text-destructive"
                        }`}>
                          %{karMarji}
                        </span>
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
            title="Günlük/Haftalık Maliyet Trendi" 
            type="line"
            height="h-80"
          />
          <ChartPlaceholder 
            title="Maliyet Dağılımı" 
            type="pie"
            height="h-80"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
