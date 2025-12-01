import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CreateOrderDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [products, setProducts] = useState<Array<{ id: string; ad: string; satis_fiyati: number }>>([]);
  const [estimatedDelivery, setEstimatedDelivery] = useState<{
    days: number;
    date: string;
    canProduce: boolean;
    insufficientMaterials: any[];
    details?: {
      avgCapacity: number;
      currentWorkload: number;
      totalHours: number;
      availableMachines: number;
    };
    machineEstimates?: Array<{
      id: string;
      ad: string;
      durum: string;
      currentWorkload: number;
      totalHours: number;
      estimatedFinish: string;
    }>;
  } | null>(null);
  const { hasAnyRole } = useAuth();

  const [formData, setFormData] = useState({
    musteri: "",
    urun_id: "",
    miktar: "",
    siparis_maliyeti: "",
    teslim_tarihi: "",
    kaynak: "stok",
  });

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("urun")
        .select("id, ad, satis_fiyati")
        .order("ad");
      
      if (error) {
        toast.error("Ürünler yüklenemedi");
        console.error(error);
      } else {
        setProducts(data || []);
      }
    };

    if (open) {
      fetchProducts();
      setEstimatedDelivery(null);
    }
  }, [open]);

  // Calculate estimated delivery when product and quantity are selected
  useEffect(() => {
    if (formData.urun_id && formData.miktar) {
      calculateEstimatedDelivery();
    } else {
      setEstimatedDelivery(null);
    }
  }, [formData.urun_id, formData.miktar]);

  // Auto-calculate cost when product is selected
  const handleProductChange = (productId: string) => {
    const selectedProduct = products.find(p => p.id === productId);
    const quantity = parseInt(formData.miktar) || 1;
    const cost = selectedProduct ? selectedProduct.satis_fiyati * quantity : 0;
    
    setFormData({ 
      ...formData, 
      urun_id: productId,
      siparis_maliyeti: cost > 0 ? cost.toString() : formData.siparis_maliyeti
    });
  };

  // Update cost when quantity changes
  useEffect(() => {
    if (formData.urun_id && formData.miktar) {
      const selectedProduct = products.find(p => p.id === formData.urun_id);
      if (selectedProduct) {
        const quantity = parseInt(formData.miktar);
        const cost = selectedProduct.satis_fiyati * quantity;
        setFormData(prev => ({ ...prev, siparis_maliyeti: cost.toString() }));
      }
    }
  }, [formData.miktar, formData.urun_id, products]);

  const calculateEstimatedDelivery = async () => {
    setCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-order-details', {
        body: {
          urun_id: formData.urun_id,
          miktar: parseInt(formData.miktar)
        }
      });

      if (error) throw error;

      if (data.success) {
        setEstimatedDelivery({
          days: data.estimatedDays,
          date: data.deliveryDate,
          canProduce: data.canProduce,
          insufficientMaterials: data.insufficientMaterials || [],
          details: data.details,
          machineEstimates: data.machineEstimates || [],
        });
        
        // Auto-fill delivery date if not set
        if (!formData.teslim_tarihi) {
          setFormData(prev => ({ ...prev, teslim_tarihi: data.deliveryDate }));
        }
      }
    } catch (error: any) {
      console.error('Delivery calculation error:', error);
    } finally {
      setCalculating(false);
    }
  };

  const canCreateOrder = hasAnyRole(['sirket_sahibi', 'genel_mudur', 'muhasebe']);

  if (!canCreateOrder) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.urun_id) {
      toast.error("Lütfen bir ürün seçin");
      return;
    }

    if (estimatedDelivery && !estimatedDelivery.canProduce) {
      toast.error("Yetersiz hammadde! Sipariş oluşturulamaz.");
      return;
    }
    
    setLoading(true);

    try {
      // Use edge function to process order and deduct materials
      const { data, error } = await supabase.functions.invoke('process-order', {
        body: {
          musteri: formData.musteri,
          urun_id: formData.urun_id,
          miktar: parseInt(formData.miktar),
          siparis_maliyeti: parseFloat(formData.siparis_maliyeti),
          teslim_tarihi: formData.teslim_tarihi || null,
          kaynak: formData.kaynak,
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message || "Sipariş başarıyla oluşturuldu!");
        setOpen(false);
        setFormData({
          musteri: "",
          urun_id: "",
          miktar: "",
          siparis_maliyeti: "",
          teslim_tarihi: "",
          kaynak: "stok",
        });
        setEstimatedDelivery(null);
        
        // Sayfayı yenile
        window.location.reload();
      } else {
        throw new Error(data.error || "Sipariş oluşturulamadı");
      }
    } catch (error: any) {
      toast.error(error.message || "Sipariş oluşturulamadı");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Yeni Sipariş
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Sipariş Oluştur</DialogTitle>
          <DialogDescription>
            Sipariş detaylarını girin. Teslimat süresi otomatik hesaplanacaktır.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="musteri" className="text-white">Müşteri Adı</Label>
            <Input
              id="musteri"
              value={formData.musteri}
              onChange={(e) => setFormData({ ...formData, musteri: e.target.value })}
              required
              className="bg-secondary text-white border-border placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="urun" className="text-white">Ürün</Label>
            <Select
              value={formData.urun_id}
              onValueChange={handleProductChange}
              required
            >
              <SelectTrigger className="bg-secondary text-white border-border">
                <SelectValue placeholder="Ürün seçin" className="text-white" />
              </SelectTrigger>
              <SelectContent className="bg-secondary border-border z-50">
                {products.map((product) => (
                  <SelectItem 
                    key={product.id} 
                    value={product.id}
                    className="text-white hover:bg-primary/20 focus:bg-primary/20 cursor-pointer"
                  >
                    {product.ad} - {product.satis_fiyati.toLocaleString('tr-TR')} ₺
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="miktar" className="text-white">Miktar</Label>
            <Input
              id="miktar"
              type="number"
              min="1"
              value={formData.miktar}
              onChange={(e) => setFormData({ ...formData, miktar: e.target.value })}
              required
              className="bg-secondary text-white border-border placeholder:text-white/50"
            />
          </div>

          {calculating && (
            <div className="flex items-center gap-2 text-white text-sm">
              <Clock className="w-4 h-4 animate-spin" />
              <span>Teslimat süresi hesaplanıyor...</span>
            </div>
          )}

          {estimatedDelivery && (
            <div className="space-y-3">
              <Alert className={estimatedDelivery.canProduce ? "border-primary/50 bg-primary/10" : "border-destructive/50 bg-destructive/10"}>
                <Clock className="h-4 w-4 text-white" />
                <AlertDescription className="text-white">
                  {estimatedDelivery.canProduce ? (
                    <>
                      <strong>Genel Tahmini Teslimat:</strong> {estimatedDelivery.days} gün içinde ({estimatedDelivery.date})
                      {estimatedDelivery.details && (
                        <p className="mt-2 text-xs text-white/80">
                          {estimatedDelivery.details.availableMachines} makinenin ortalama kapasitesi{" "}
                          {Math.round(estimatedDelivery.details.avgCapacity)} adet/saat. Toplam iş yükü yaklaşık{" "}
                          {estimatedDelivery.details.totalHours.toFixed(1)} saat (~{estimatedDelivery.days} gün).
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 inline mr-2" />
                      <strong>Yetersiz Hammadde!</strong>
                      <ul className="mt-2 ml-4 list-disc text-sm">
                        {estimatedDelivery.insufficientMaterials.map((mat, idx) => (
                          <li key={idx}>
                            {mat.name}: Gerekli {mat.needed.toFixed(2)}, Mevcut {mat.available.toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </AlertDescription>
              </Alert>

              {estimatedDelivery.canProduce && estimatedDelivery.machineEstimates && estimatedDelivery.machineEstimates.length > 0 && (
                <div className="border border-border rounded-lg p-3 text-xs text-white/90 bg-secondary/30 space-y-2">
                  <p className="font-semibold text-white text-sm">Makine Bazlı Tahmini Teslim Zamanı</p>
                  <div className="max-h-40 overflow-y-auto">
                    <table className="w-full text-[11px]">
                      <thead className="text-white/70">
                        <tr>
                          <th className="text-left font-normal pr-2">Makine</th>
                          <th className="text-left font-normal pr-2">Durum</th>
                          <th className="text-right font-normal pr-2">Toplam Saat</th>
                          <th className="text-right font-normal">Tahmini Tarih</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estimatedDelivery.machineEstimates
                          .sort((a, b) => a.totalHours - b.totalHours)
                          .map((m) => {
                            const finishDate = new Date(m.estimatedFinish);
                            const dateStr = isNaN(finishDate.getTime())
                              ? "-"
                              : finishDate.toLocaleDateString("tr-TR", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                });
                            return (
                              <tr key={m.id}>
                                <td className="pr-2">{m.ad}</td>
                                <td className="pr-2 capitalize">{m.durum}</td>
                                <td className="pr-2 text-right">{m.totalHours.toFixed(1)} sa</td>
                                <td className="text-right">{dateStr}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="siparis_maliyeti" className="text-white">Sipariş Maliyeti (₺)</Label>
            <Input
              id="siparis_maliyeti"
              type="number"
              step="0.01"
              min="0"
              value={formData.siparis_maliyeti}
              onChange={(e) => setFormData({ ...formData, siparis_maliyeti: e.target.value })}
              required
              className="bg-secondary text-white border-border placeholder:text-white/50"
            />
            {formData.urun_id && formData.miktar && (
              <p className="text-xs text-white/70">
                Otomatik hesaplanan tutar
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="kaynak" className="text-white">Kaynak</Label>
            <Select value={formData.kaynak} onValueChange={(value) => setFormData({ ...formData, kaynak: value })}>
              <SelectTrigger className="bg-secondary text-white border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-secondary border-border">
                <SelectItem value="stok" className="text-white hover:bg-primary/20 focus:bg-primary/20">Stok</SelectItem>
                <SelectItem value="uretim" className="text-white hover:bg-primary/20 focus:bg-primary/20">Üretim</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="teslim_tarihi" className="text-white">Teslim Tarihi</Label>
            <Input
              id="teslim_tarihi"
              type="date"
              value={formData.teslim_tarihi}
              onChange={(e) => setFormData({ ...formData, teslim_tarihi: e.target.value })}
              className="bg-secondary text-white border-border placeholder:text-white/50"
            />
            {estimatedDelivery && (
              <p className="text-xs text-white/70">
                Önerilen: {estimatedDelivery.date}
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={loading || calculating || (estimatedDelivery && !estimatedDelivery.canProduce)}
            >
              {loading ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}