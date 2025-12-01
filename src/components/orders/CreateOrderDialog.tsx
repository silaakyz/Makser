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
  const [products, setProducts] = useState<Array<{ id: string; ad: string }>>([]);
  const [estimatedDelivery, setEstimatedDelivery] = useState<{
    days: number;
    date: string;
    canProduce: boolean;
    insufficientMaterials: any[];
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
        .select("id, ad")
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
          insufficientMaterials: data.insufficientMaterials || []
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
            <Label htmlFor="musteri">Müşteri Adı</Label>
            <Input
              id="musteri"
              value={formData.musteri}
              onChange={(e) => setFormData({ ...formData, musteri: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="urun" className="text-foreground">Ürün</Label>
            <Select
              value={formData.urun_id}
              onValueChange={(value) => setFormData({ ...formData, urun_id: value })}
              required
            >
              <SelectTrigger className="bg-card text-card-foreground border-border">
                <SelectValue placeholder="Ürün seçin" className="text-foreground" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                {products.map((product) => (
                  <SelectItem 
                    key={product.id} 
                    value={product.id}
                    className="text-card-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    {product.ad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="miktar" className="text-foreground">Miktar</Label>
            <Input
              id="miktar"
              type="number"
              min="1"
              value={formData.miktar}
              onChange={(e) => setFormData({ ...formData, miktar: e.target.value })}
              required
              className="bg-card text-card-foreground border-border"
            />
          </div>

          {calculating && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="w-4 h-4 animate-spin" />
              <span>Teslimat süresi hesaplanıyor...</span>
            </div>
          )}

          {estimatedDelivery && (
            <Alert className={estimatedDelivery.canProduce ? "border-primary/50 bg-primary/5" : "border-destructive/50 bg-destructive/5"}>
              <Clock className="h-4 w-4" />
              <AlertDescription className="text-card-foreground">
                {estimatedDelivery.canProduce ? (
                  <>
                    <strong>Tahmini Teslimat:</strong> {estimatedDelivery.days} gün içinde ({estimatedDelivery.date})
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
          )}

          <div className="space-y-2">
            <Label htmlFor="siparis_maliyeti" className="text-foreground">Sipariş Maliyeti (₺)</Label>
            <Input
              id="siparis_maliyeti"
              type="number"
              step="0.01"
              min="0"
              value={formData.siparis_maliyeti}
              onChange={(e) => setFormData({ ...formData, siparis_maliyeti: e.target.value })}
              required
              className="bg-card text-card-foreground border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kaynak" className="text-foreground">Kaynak</Label>
            <Select value={formData.kaynak} onValueChange={(value) => setFormData({ ...formData, kaynak: value })}>
              <SelectTrigger className="bg-card text-card-foreground border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="stok" className="text-card-foreground">Stok</SelectItem>
                <SelectItem value="uretim" className="text-card-foreground">Üretim</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="teslim_tarihi" className="text-foreground">Teslim Tarihi</Label>
            <Input
              id="teslim_tarihi"
              type="date"
              value={formData.teslim_tarihi}
              onChange={(e) => setFormData({ ...formData, teslim_tarihi: e.target.value })}
              className="bg-card text-card-foreground border-border"
            />
            {estimatedDelivery && (
              <p className="text-xs text-muted-foreground">
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