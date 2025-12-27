import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export function CreateProductionDialog({ onProductionCreated }: { onProductionCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [products, setProducts] = useState<Array<{ urun_id: number; ad: string }>>([]);
    const [machines, setMachines] = useState<Array<{ makine_id: number; ad: string; isActive?: boolean; activeDetail?: any }>>([]);

    const [formData, setFormData] = useState({
        urun_id: "",
        makine_id: "",
        baslama_zamani: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm format for input type="datetime-local"
    });

    useEffect(() => {
        if (open) {
            fetchOptions();
        }
    }, [open]);

    const fetchOptions = async () => {
        try {
            // Fetch Products
            const { data: pData, error: pError } = await supabase
                .from("urun")
                .select("urun_id, ad")
                .order("ad");

            if (pError) throw pError;
            setProducts(pData || []);

            // Fetch Active Productions (Machines currently working)
            const { data: activeData, error: activeError } = await supabase
                .from("uretim_kayit")
                .select("makine_id")
                .is("bitis_zamani", null);

            if (activeError) throw activeError;
            const activeMachineIds = new Set((activeData || []).map(d => d.makine_id));

            // Fetch Machines
            const { data: mData, error: mError } = await supabase
                .from("makine")
                .select("makine_id, ad")
                .order("ad");

            if (mError) throw mError;

            // Mark active machines
            const machinesWithStatus = (mData || []).map((m: any) => ({
                ...m,
                isActive: activeMachineIds.has(m.makine_id)
            }));

            setMachines(machinesWithStatus);

        } catch (error) {
            console.error("Seçenekler yüklenirken hata:", error);
            toast.error("Veriler yüklenemedi");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.urun_id || !formData.makine_id) {
                toast.error("Lütfen ürün ve makine seçiniz");
                return;
            }

            // 1. Get the max ID to generate a new manual ID (since DB sequence might be missing/broken)
            const { data: lastRecord, error: lastRecordError } = await supabase
                .from("uretim_kayit")
                .select("uretim_id")
                .order("uretim_id", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (lastRecordError) throw lastRecordError;

            const nextId = (lastRecord?.uretim_id || 0) + 1;

            const { error } = await supabase
                .from("uretim_kayit")
                .insert({
                    uretim_id: nextId,
                    urun_id: parseInt(formData.urun_id),
                    makine_id: parseInt(formData.makine_id),
                    baslama_zamani: new Date(formData.baslama_zamani).toISOString(),
                    // bitis_zamani null ise "devam ediyor" demektir.
                } as any);

            if (error) throw error;

            toast.success("Üretim kaydı oluşturuldu");
            setOpen(false);
            onProductionCreated(); // Refresh parent list

            // Reset form
            setFormData({
                urun_id: "",
                makine_id: "",
                baslama_zamani: new Date().toISOString().slice(0, 16),
            });

        } catch (error: any) {
            console.error("Üretim ekleme hatası:", error);
            toast.error("Kayıt oluşturulamadı: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4" />
                    Yeni Üretim
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
                <DialogHeader>
                    <DialogTitle>Yeni Üretim Başlat</DialogTitle>
                    <DialogDescription>
                        Manuel olarak bir üretim kaydı oluşturun.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="urun">Ürün</Label>
                        <Select
                            value={formData.urun_id}
                            onValueChange={(val) => setFormData({ ...formData, urun_id: val })}
                        >
                            <SelectTrigger className="bg-secondary border-border text-foreground">
                                <SelectValue placeholder="Ürün Seçin" />
                            </SelectTrigger>
                            <SelectContent className="bg-secondary border-border text-foreground">
                                {products.map((p) => (
                                    <SelectItem key={p.urun_id} value={String(p.urun_id)}>
                                        {p.ad}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="makine">Makine</Label>
                        <Select
                            value={formData.makine_id}
                            onValueChange={(val) => setFormData({ ...formData, makine_id: val })}
                        >
                            <SelectTrigger className="bg-secondary border-border text-foreground">
                                <SelectValue placeholder="Makine Seçin" />
                            </SelectTrigger>
                            <SelectContent className="bg-secondary border-border text-foreground">
                                {machines.map((m) => (
                                    <SelectItem key={m.makine_id} value={String(m.makine_id)} disabled={m.isActive}>
                                        {m.ad} {m.isActive ? `(DOLU | ${m.activeDetail?.urunAd} | Baş: ${m.activeDetail?.baslangic} | %${m.activeDetail?.oran})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="baslama">Başlama Zamanı</Label>
                        <Input
                            id="baslama"
                            type="datetime-local"
                            value={formData.baslama_zamani}
                            onChange={(e) => setFormData({ ...formData, baslama_zamani: e.target.value })}
                            className="bg-secondary border-border text-foreground"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                            className="border-border text-foreground hover:bg-secondary"
                        >
                            İptal
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Kaydediliyor..." : "Oluştur"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
