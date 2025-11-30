import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export function CreateOrderDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { hasAnyRole } = useAuth();

  const [formData, setFormData] = useState({
    musteri: "",
    miktar: "",
    siparis_maliyeti: "",
    teslim_tarihi: "",
    kaynak: "stok",
  });

  const canCreateOrder = hasAnyRole(['sirket_sahibi', 'genel_mudur', 'muhasebe']);

  if (!canCreateOrder) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('siparis')
        .insert({
          musteri: formData.musteri,
          miktar: parseInt(formData.miktar),
          siparis_maliyeti: parseFloat(formData.siparis_maliyeti),
          teslim_tarihi: formData.teslim_tarihi || null,
          kaynak: formData.kaynak,
          durum: 'beklemede',
        });

      if (error) throw error;

      toast.success("Sipariş başarıyla oluşturuldu!");
      setOpen(false);
      setFormData({
        musteri: "",
        miktar: "",
        siparis_maliyeti: "",
        teslim_tarihi: "",
        kaynak: "stok",
      });
      
      // Sayfayı yenile
      window.location.reload();
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Sipariş Oluştur</DialogTitle>
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
            <Label htmlFor="miktar">Miktar</Label>
            <Input
              id="miktar"
              type="number"
              min="1"
              value={formData.miktar}
              onChange={(e) => setFormData({ ...formData, miktar: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="siparis_maliyeti">Sipariş Maliyeti (₺)</Label>
            <Input
              id="siparis_maliyeti"
              type="number"
              step="0.01"
              min="0"
              value={formData.siparis_maliyeti}
              onChange={(e) => setFormData({ ...formData, siparis_maliyeti: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kaynak">Kaynak</Label>
            <Select value={formData.kaynak} onValueChange={(value) => setFormData({ ...formData, kaynak: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stok">Stok</SelectItem>
                <SelectItem value="uretim">Üretim</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="teslim_tarihi">Teslim Tarihi (Opsiyonel)</Label>
            <Input
              id="teslim_tarihi"
              type="date"
              value={formData.teslim_tarihi}
              onChange={(e) => setFormData({ ...formData, teslim_tarihi: e.target.value })}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}