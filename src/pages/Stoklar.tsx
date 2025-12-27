import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, AlertCircle, TrendingDown, Boxes, Download, Plus } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Hammadde {
  id: string;
  ad: string;
  stok_miktari: number;
  birim: string;
  birim_fiyat: number;
  kritik_stok_seviyesi: number;
  tuketim_hizi: number;
}

interface Urun {
  id: string;
  ad: string;
  tur: string;
  stok_miktari: number;
  satis_fiyati: number;
  kritik_stok_seviyesi: number;
}

export default function Stoklar() {
  const { roles } = useAuth();
  const [hammaddeler, setHammaddeler] = useState<Hammadde[]>([]);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [loading, setLoading] = useState(true);

  const [hammaddeDialogOpen, setHammaddeDialogOpen] = useState(false);
  const [urunDialogOpen, setUrunDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [hammaddeForm, setHammaddeForm] = useState({
    id: "",
    miktar: "",
    type: "artis",
  });

  const [urunForm, setUrunForm] = useState({
    id: "",
    miktar: "",
    type: "artis",
  });

  const isManager = roles.some(role =>
    ["sirket_sahibi", "genel_mudur", "muhasebe", "uretim_sefi"].includes(role)
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [{ data: hData, error: hError }, { data: uData, error: uError }] = await Promise.all([
        supabase.from("hammadde").select("*").order("stok_adi"),
        supabase.from("urun").select("*, urun_stok(miktar)").order("ad"),
      ]);

      if (hError) throw hError;
      if (uError) throw uError;

      // Map hammadde (schema: hammadde_id, stok_adi, kalan_miktar, birim...)
      const hMapped = (hData || []).map((h: any) => ({
        id: h.hammadde_id,
        ad: h.stok_adi,
        stok_miktari: parseFloat(h.kalan_miktar || '0'),
        birim: h.birim,
        birim_fiyat: parseFloat(h.alis_fiyati || '0'), // Using alis_fiyati as cost
        kritik_stok_seviyesi: parseFloat(h.kritik_stok || '0'),
        tuketim_hizi: 0 // Missing in schema
      }));

      // Map urun with joined stock
      const uMapped = (uData || []).map((u: any) => {
        const stokInfo = u.urun_stok && u.urun_stok.length > 0 ? u.urun_stok[0] : null;
        return {
          id: u.urun_id,
          ad: u.ad,
          tur: u.tur || 'Standart',
          stok_miktari: stokInfo ? (stokInfo.miktar || 0) : 0,
          satis_fiyati: u.satis_fiyati || 0,
          kritik_stok_seviyesi: 10 // Mock
        };
      });

      setHammaddeler(hMapped);
      setUrunler(uMapped);
    } catch (error: any) {
      console.error("Stoklar yüklenirken hata:", error);
      toast.error("Stok verileri yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleHammaddeEntry = async () => {
    if (!hammaddeForm.id || !hammaddeForm.miktar) {
      toast.error("Tüm alanları doldurun");
      return;
    }

    const selected = hammaddeler.find(h => h.id === Number(hammaddeForm.id) || h.id === hammaddeForm.id); // Check ID match (str vs number)
    if (!selected) {
      toast.error("Hammadde bulunamadı");
      return;
    }

    try {
      setActionLoading(true);
      const miktar = Number(hammaddeForm.miktar);
      const yeniStok = hammaddeForm.type === "azalis"
        ? Math.max(0, selected.stok_miktari - miktar)
        : selected.stok_miktari + miktar;

      const { error } = await supabase
        .from("hammadde")
        .update({ kalan_miktar: String(yeniStok) }) // Schema expects string for amount? Based on types.ts it is string | null
        .eq("hammadde_id", selected.id);

      if (error) throw error;

      toast.success("Hammadde stoğu güncellendi");
      setHammaddeDialogOpen(false);
      setHammaddeForm({ id: "", miktar: "", type: "artis" });
      fetchData();
    } catch (error: any) {
      console.error("Hammadde girişi yapılırken hata:", error);
      toast.error("Hammadde girişi yapılamadı: " + (error.message || "Bilinmeyen hata"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUrunEntry = async () => {
    if (!urunForm.id || !urunForm.miktar) {
      toast.error("Tüm alanları doldurun");
      return;
    }

    const selected = urunler.find(u => u.id === Number(urunForm.id));
    if (!selected) {
      toast.error("Ürün bulunamadı");
      return;
    }

    try {
      setActionLoading(true);
      const miktar = Number(urunForm.miktar);

      // Get current stock from urun_stok table
      const { data: currentStock, error: fetchError } = await supabase
        .from("urun_stok")
        .select("*")
        .eq("urun_id", selected.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const currentQty = currentStock ? (currentStock.miktar || 0) : 0;
      const yeniStok = urunForm.type === "azalis"
        ? Math.max(0, currentQty - miktar)
        : currentQty + miktar;

      let error;

      if (currentStock) {
        // Update existing
        const { error: updateError } = await supabase
          .from("urun_stok")
          .update({ miktar: yeniStok, son_guncelleme: new Date().toISOString() })
          .eq("urun_stok_id", currentStock.urun_stok_id);
        error = updateError;
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from("urun_stok")
          .insert({
            urun_stok_id: Math.floor(Date.now() / 1000), // Generate ID as it is not identity in provided schema
            urun_id: selected.id,
            miktar: yeniStok,
            son_guncelleme: new Date().toISOString()
          });
        error = insertError;
      }

      if (error) throw error;

      toast.success("Ürün stoğu güncellendi");
      setUrunDialogOpen(false);
      setUrunForm({ id: "", miktar: "", type: "artis" });
      fetchData();
    } catch (error: any) {
      console.error("Ürün girişi yapılırken hata:", error);
      toast.error("Ürün girişi yapılamadı: " + (error.message || "Bilinmeyen hata"));
    } finally {
      setActionLoading(false);
    }
  };

  const kritikHammaddeler = useMemo(
    () => hammaddeler.filter(h => h.stok_miktari <= (h.kritik_stok_seviyesi || 0)),
    [hammaddeler]
  );

  const kritikUrunler = useMemo(
    () => urunler.filter(u => u.stok_miktari <= (u.kritik_stok_seviyesi || 0)),
    [urunler]
  );

  const toplamHammaddeStok = useMemo(
    () => hammaddeler.reduce((sum, h) => sum + (h.stok_miktari || 0), 0),
    [hammaddeler]
  );

  const toplamUrunStok = useMemo(
    () => urunler.reduce((sum, u) => sum + (u.stok_miktari || 0), 0),
    [urunler]
  );

  const hammaddeTuketimData = useMemo(
    () =>
      [...hammaddeler]
        .map((h) => ({
          ad: h.ad,
          hiz: Number(h.tuketim_hizi || 0),
        }))
        .sort((a, b) => b.hiz - a.hiz)
        .slice(0, 10),
    [hammaddeler]
  );

  const stokDegerData = useMemo(
    () =>
      [...urunler]
        .map((u) => ({
          ad: u.ad,
          deger: (u.stok_miktari || 0) * (u.satis_fiyati || 0),
        }))
        .sort((a, b) => b.deger - a.deger)
        .slice(0, 8),
    [urunler]
  );

  const pieColors = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#a855f7", "#06b6d4", "#f97316", "#64748b"];

  const exportToExcel = () => {
    const hammaddeData = hammaddeler.map((h) => {
      const isDusuk = (h.stok_miktari || 0) <= (h.kritik_stok_seviyesi || 0);
      const toplamDeger = (h.stok_miktari || 0) * (h.birim_fiyat || 0);
      return {
        "Hammadde Adı": h.ad,
        "Stok Miktarı": h.stok_miktari,
        "Birim": h.birim,
        "Kritik Seviye": h.kritik_stok_seviyesi,
        "Birim Fiyat (₺)": h.birim_fiyat,
        "Toplam Değer (₺)": toplamDeger,
        "Tüketim Hızı": `${h.tuketim_hizi || 0} ${h.birim}/gün`,
        "Durum": isDusuk ? "Kritik" : "Normal",
      };
    });

    const urunData = urunler.map((u) => {
      const isDusuk = (u.stok_miktari || 0) <= (u.kritik_stok_seviyesi || 0);
      const toplamDeger = (u.stok_miktari || 0) * (u.satis_fiyati || 0);
      return {
        "Ürün Adı": u.ad,
        "Ürün Türü": u.tur,
        "Stok Miktarı": u.stok_miktari,
        "Kritik Seviye": u.kritik_stok_seviyesi,
        "Satış Fiyatı (₺)": u.satis_fiyati,
        "Toplam Değer (₺)": toplamDeger,
        "Durum": isDusuk ? "Kritik" : "Normal",
      };
    });

    const wb = XLSX.utils.book_new();
    const wsHammadde = XLSX.utils.json_to_sheet(hammaddeData);
    const wsUrun = XLSX.utils.json_to_sheet(urunData);

    XLSX.utils.book_append_sheet(wb, wsHammadde, "Hammaddeler");
    XLSX.utils.book_append_sheet(wb, wsUrun, "Ürünler");

    const fileName = `Stok_Raporu_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Stok raporu başarıyla indirildi!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Stok Yönetimi</h1>
            <p className="text-white/70">Hammadde ve ürün stok durumunu yönetin</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isManager && (
              <>
                <Button className="gap-2" onClick={() => setHammaddeDialogOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Hammadde Girişi
                </Button>
                <Button className="gap-2" onClick={() => setUrunDialogOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Ürün Stok Girişi
                </Button>
              </>
            )}
            <Button onClick={exportToExcel} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Excel Raporu
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Kritik Stok"
            value={kritikHammaddeler.length + kritikUrunler.length}
            icon={AlertCircle}
            variant="destructive"
            subtitle="Acil müdahale gerekli"
          />
          <KpiCard
            title="Hammadde Çeşidi"
            value={hammaddeler.length}
            icon={Package}
            variant="info"
            subtitle={`${toplamHammaddeStok.toLocaleString()} birim`}
          />
          <KpiCard
            title="Ürün Çeşidi"
            value={urunler.length}
            icon={Boxes}
            variant="success"
            subtitle={`${toplamUrunStok.toLocaleString()} adet`}
          />
          <KpiCard
            title="Tüketim Hızı"
            value="12.5%"
            icon={TrendingDown}
            variant="warning"
            subtitle="Haftalık ortalama"
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        )}

        {!loading && kritikHammaddeler.length > 0 && (
          <Card className="bg-card border-l-4 border-l-destructive shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
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
                      <TableCell>{hammadde.tuketim_hizi || 0} {hammadde.birim}/gün</TableCell>
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

        <Card className="bg-card border-border hover:border-primary/30 transition-all">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center justify-between gap-4">
              Hammadde Stok Seviyeleri
              {isManager && (
                <Button variant="ghost" size="sm" onClick={() => setHammaddeDialogOpen(true)}>
                  Stok Girişi
                </Button>
              )}
            </CardTitle>
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
                {hammaddeler.map((hammadde) => {
                  const isDusuk = (hammadde.stok_miktari || 0) <= (hammadde.kritik_stok_seviyesi || 0);
                  const toplamDeger = (hammadde.stok_miktari || 0) * (hammadde.birim_fiyat || 0);

                  return (
                    <TableRow key={hammadde.id}>
                      <TableCell className="font-medium">{hammadde.ad}</TableCell>
                      <TableCell className={isDusuk ? "text-destructive font-semibold" : ""}>
                        {hammadde.stok_miktari}
                      </TableCell>
                      <TableCell>{hammadde.birim}</TableCell>
                      <TableCell>₺{(hammadde.birim_fiyat || 0).toLocaleString()}</TableCell>
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
                {hammaddeler.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                      Hammadde kaydı bulunamadı
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-primary/30 transition-all">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center justify-between gap-4">
              Ürün Stok Durumu
              {isManager && (
                <Button variant="ghost" size="sm" onClick={() => setUrunDialogOpen(true)}>
                  Stok Girişi
                </Button>
              )}
            </CardTitle>
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
                {urunler.map((urun) => {
                  const isDusuk = (urun.stok_miktari || 0) <= (urun.kritik_stok_seviyesi || 0);
                  const toplamDeger = (urun.stok_miktari || 0) * (urun.satis_fiyati || 0);

                  return (
                    <TableRow key={urun.id}>
                      <TableCell className="font-medium">{urun.ad}</TableCell>
                      <TableCell>{urun.tur}</TableCell>
                      <TableCell className={isDusuk ? "text-destructive font-semibold" : ""}>
                        {urun.stok_miktari}
                      </TableCell>
                      <TableCell>₺{(urun.satis_fiyati || 0).toLocaleString()}</TableCell>
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
                {urunler.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                      Ürün kaydı bulunamadı
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
                Hammadde Tüketim Hızı (En Çok Tüketilen 10)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {hammaddeTuketimData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  Hammadde verisi bulunamadı
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hammaddeTuketimData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="ad" stroke="#9ca3af" hide />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="hiz" name="Tüketim (birim/gün)" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary/30 transition-all">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-card-foreground">
                Ürün Stok Değer Dağılımı (En Yüksek 8)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {stokDegerData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  Ürün verisi bulunamadı
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stokDegerData}
                      dataKey="deger"
                      nameKey="ad"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {stokDegerData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={pieColors[index % pieColors.length]}
                        />
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

      <Dialog open={hammaddeDialogOpen} onOpenChange={setHammaddeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hammadde Stok Girişi</DialogTitle>
            <DialogDescription>Mevcut hammadde stoklarına miktar ekleyin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Hammadde</Label>
              <Select
                value={hammaddeForm.id}
                onValueChange={(value) => setHammaddeForm(prev => ({ ...prev, id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Hammadde seçin" />
                </SelectTrigger>
                <SelectContent>
                  {hammaddeler.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.ad} ({h.stok_miktari} {h.birim})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Miktar</Label>
              <Input
                type="number"
                placeholder="Eklenecek miktar"
                value={hammaddeForm.miktar}
                onChange={(e) => setHammaddeForm(prev => ({ ...prev, miktar: e.target.value }))}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>İşlem Türü</Label>
              <Select
                value={hammaddeForm.type}
                onValueChange={(value) => setHammaddeForm(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="İşlem türü seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="artis">Stoğa Ekle</SelectItem>
                  <SelectItem value="azalis">Stoktan Düş</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHammaddeDialogOpen(false)} disabled={actionLoading}>
              İptal
            </Button>
            <Button onClick={handleHammaddeEntry} disabled={actionLoading}>
              {actionLoading ? "Kaydediliyor..." : "Stoğa Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={urunDialogOpen} onOpenChange={setUrunDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ürün Stok Girişi</DialogTitle>
            <DialogDescription>Tamamlanan üretimlerden stoğa giriş yapın.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Ürün</Label>
              <Select
                value={urunForm.id}
                onValueChange={(value) => setUrunForm(prev => ({ ...prev, id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ürün seçin" />
                </SelectTrigger>
                <SelectContent>
                  {urunler.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.ad} ({u.stok_miktari} adet)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Miktar</Label>
              <Input
                type="number"
                placeholder="Eklenecek miktar"
                value={urunForm.miktar}
                onChange={(e) => setUrunForm(prev => ({ ...prev, miktar: e.target.value }))}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>İşlem Türü</Label>
              <Select
                value={urunForm.type}
                onValueChange={(value) => setUrunForm(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="İşlem türü seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="artis">Stoğa Ekle</SelectItem>
                  <SelectItem value="azalis">Stoktan Düş</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUrunDialogOpen(false)} disabled={actionLoading}>
              İptal
            </Button>
            <Button onClick={handleUrunEntry} disabled={actionLoading}>
              {actionLoading ? "Kaydediliyor..." : "Stoğa Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
