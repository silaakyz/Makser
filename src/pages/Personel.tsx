import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_NAMES } from "@/config/rolePermissions";
import type { AppRole } from "@/config/rolePermissions";
import { Users, Edit, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PersonelData {
  id: string;
  ad: string | null;
  soyad: string | null;
  email: string | null;
  unvan?: string | null;
  role: AppRole;
}

export default function Personel() {
  const { roles } = useAuth();
  const [personelList, setPersonelList] = useState<PersonelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPersonel, setSelectedPersonel] = useState<PersonelData | null>(null);
  const [newRole, setNewRole] = useState<AppRole | null>(null);
  const [updating, setUpdating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Yeni personel form alanları
  const [newPersonel, setNewPersonel] = useState({
    ad: '',
    soyad: '',
    unvan: '',
    mail: ''
  });

  // Yönetici kontrolü
  const isAdmin = roles.includes('sirket_sahibi') || roles.includes('genel_mudur');

  useEffect(() => {
    fetchPersonel();
  }, []);

  const fetchPersonel = async () => {
    try {
      setLoading(true);
      
      // Personel tablosundan veri çek - ad, soyad, unvan alanlarını seç (mail opsiyonel)
      // @ts-ignore - personel tablosu type tanımlarında yok olabilir
      const { data: personelData, error: personelError } = await supabase
        .from('personel' as any)
        .select('ad, soyad, unvan, mail')
        .not('ad', 'is', null)
        .not('soyad', 'is', null);

      if (personelError) {
        console.error('Personel tablosu hatası:', personelError);
        
        // Eğer tablo bulunamazsa, kullanıcıya bilgi ver
        if (personelError.message.includes('could not find the table') || 
            personelError.message.includes('schema cache') ||
            personelError.message.includes('relation') ||
            personelError.code === 'PGRST116') {
          toast.error('Personel tablosu bulunamadı. Lütfen Supabase Dashboard\'dan SQL Editor\'de aşağıdaki SQL\'i çalıştırın.', {
            duration: 10000
          });
          console.error('Personel tablosu mevcut değil. Lütfen aşağıdaki SQL\'i Supabase Dashboard > SQL Editor\'de çalıştırın:');
          console.log(`
CREATE TABLE IF NOT EXISTS public.personel (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    personel_id uuid DEFAULT gen_random_uuid(),
    ad text NOT NULL,
    soyad text NOT NULL,
    unvan text,
    mail text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.personel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Personel tablosu herkese açık okuma"
ON public.personel
FOR SELECT
USING (true);

INSERT INTO public.personel (ad, soyad, unvan, mail) VALUES
('Salih', 'Şener', 'Şirket Sahibi', 'salihsener@yonetici.com'),
('Yağız', 'Şener', 'Genel Müdür', 'yagizsener@yonetici.com'),
('Muhammed Tahir', 'Tüzün', 'Muhasebe', 'mtahirtuzun@muhasebe.com'),
('Murat', 'Karabıyık', 'Teknisyen', 'muratkarabiyik@teknisyen.com'),
('Ekrem', 'Ercan', 'Saha Montaj', NULL),
('Mustafa', 'Erten', 'Servis personeli', NULL),
('Arda', 'Ünal', 'Saha Montaj', NULL),
('İbrahim', 'Şengün', 'Saha Montaj', NULL),
('Yusuf', 'Hokkabaz', 'Saha Montaj', NULL),
('Zafer', 'Sezer', 'Üretim Şefi', 'zafersezer@uretimsefi.com'),
('Ahmet', 'Erli', 'Üretim Personeli', NULL)
ON CONFLICT DO NOTHING;
          `);
        } else {
          toast.error('Personel listesi yüklenemedi: ' + personelError.message);
        }
        setPersonelList([]);
        return;
      }

      if (!personelData || personelData.length === 0) {
        console.log('Personel tablosu boş - veriler eklenmemiş olabilir');
        toast.info('Personel tablosu oluşturuldu ancak veri bulunamadı. Lütfen verileri Supabase Dashboard\'dan ekleyin.');
        setPersonelList([]);
        return;
      }

      // Personel verilerini dönüştür
      const combinedData: PersonelData[] = personelData.map((personel: any, index: number) => {
        // Unvan'a göre role eşleştirme
        let role: AppRole = 'uretim_personeli';
        const unvan = (personel.unvan || '').toLowerCase().trim();
        
        if (unvan.includes('şirket sahibi') || unvan.includes('sahip')) {
          role = 'sirket_sahibi';
        } else if (unvan.includes('genel müdür') || unvan.includes('müdür') || unvan.includes('mudur')) {
          role = 'genel_mudur';
        } else if (unvan.includes('muhasebe')) {
          role = 'muhasebe';
        } else if (unvan.includes('üretim şefi') || unvan.includes('uretim sefi') || unvan.includes('üretim şef')) {
          role = 'uretim_sefi';
        } else if (unvan.includes('üretim personeli') || unvan.includes('uretim personeli')) {
          role = 'uretim_personeli';
        } else if (unvan.includes('teknisyen')) {
          role = 'teknisyen';
        } else if (unvan.includes('servis')) {
          role = 'servis_personeli';
        } else if (unvan.includes('saha montaj') || unvan.includes('montaj')) {
          role = 'saha_montaj';
        }

        // Email opsiyonel - NULL olabilir
        let email = personel.mail;
        if (email === 'NULL' || email === 'EMPTY' || email === '') {
          email = null;
        }

        return {
          id: personel.id || `personel-${index}-${personel.ad}-${personel.soyad}`,
          ad: personel.ad,
          soyad: personel.soyad,
          email: email || null,
          unvan: personel.unvan || null,
          role: role
        };
      });

      console.log('Personel verileri yüklendi:', combinedData.length, 'kayıt');
      setPersonelList(combinedData);
    } catch (error: any) {
      console.error('Personel listesi yüklenirken hata:', error);
      toast.error('Personel listesi yüklenemedi: ' + (error.message || 'Bilinmeyen hata'));
      setPersonelList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (personel: PersonelData) => {
    setSelectedPersonel(personel);
    setNewRole(personel.role);
    setEditDialogOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedPersonel || !newRole) return;

    try {
      setUpdating(true);

      // Personel tablosundaki unvan'ı güncelle
      // @ts-ignore
      const { error: updateError } = await supabase
        .from('personel' as any)
        .update({ unvan: ROLE_NAMES[newRole] })
        .eq('id', selectedPersonel.id);

      if (updateError) throw updateError;

      toast.success('Personel görevi güncellendi');
      setEditDialogOpen(false);
      fetchPersonel();
    } catch (error: any) {
      console.error('Görev güncellenirken hata:', error);
      toast.error('Görev güncellenemedi');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddPersonel = async () => {
    if (!newPersonel.ad || !newPersonel.soyad) {
      toast.error('Ad ve soyad alanları zorunludur');
      return;
    }

    try {
      setAdding(true);

      // @ts-ignore
      const { error: insertError } = await supabase
        .from('personel' as any)
        .insert({
          ad: newPersonel.ad,
          soyad: newPersonel.soyad,
          unvan: newPersonel.unvan || null,
          mail: newPersonel.mail || null
        });

      if (insertError) throw insertError;

      toast.success('Personel eklendi');
      setAddDialogOpen(false);
      setNewPersonel({ ad: '', soyad: '', unvan: '', mail: '' });
      fetchPersonel();
    } catch (error: any) {
      console.error('Personel eklenirken hata:', error);
      toast.error('Personel eklenemedi: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setAdding(false);
    }
  };

  const handleDeletePersonel = async () => {
    if (!selectedPersonel) return;

    try {
      setDeleting(true);

      // @ts-ignore
      const { error: deleteError } = await supabase
        .from('personel' as any)
        .delete()
        .eq('id', selectedPersonel.id);

      if (deleteError) throw deleteError;

      toast.success('Personel silindi');
      setDeleteDialogOpen(false);
      setSelectedPersonel(null);
      fetchPersonel();
    } catch (error: any) {
      console.error('Personel silinirken hata:', error);
      toast.error('Personel silinemedi: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Personel Yönetimi</h1>
            <p className="text-muted-foreground">Tüm personellerin listesi ve görevleri</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Personel Listesi</CardTitle>
                <CardDescription>Toplam {personelList.length} personel</CardDescription>
              </div>
              {isAdmin && (
                <Button 
                  onClick={() => setAddDialogOpen(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Personel Ekle
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad</TableHead>
                    <TableHead>Soyad</TableHead>
                    <TableHead>Ünvan</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Görev</TableHead>
                    {isAdmin && <TableHead>İşlemler</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personelList.map((personel) => (
                    <TableRow key={personel.id}>
                      <TableCell className="font-medium">{personel.ad || '-'}</TableCell>
                      <TableCell>{personel.soyad || '-'}</TableCell>
                      <TableCell>{personel.unvan || '-'}</TableCell>
                      <TableCell>{personel.email || '-'}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {ROLE_NAMES[personel.role]}
                        </span>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPersonel(personel);
                                setNewRole(personel.role);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Düzenle
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPersonel(personel);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {personelList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-muted-foreground py-8">
                        Henüz kayıtlı personel bulunmamaktadır
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Personel Ekleme Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Personel Ekle</DialogTitle>
            <DialogDescription>
              Personel bilgilerini girin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ad">Ad *</Label>
              <Input
                id="ad"
                value={newPersonel.ad}
                onChange={(e) => setNewPersonel({ ...newPersonel, ad: e.target.value })}
                placeholder="Ad"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="soyad">Soyad *</Label>
              <Input
                id="soyad"
                value={newPersonel.soyad}
                onChange={(e) => setNewPersonel({ ...newPersonel, soyad: e.target.value })}
                placeholder="Soyad"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unvan">Ünvan</Label>
              <Input
                id="unvan"
                value={newPersonel.unvan}
                onChange={(e) => setNewPersonel({ ...newPersonel, unvan: e.target.value })}
                placeholder="Örn: Üretim Personeli, Teknisyen"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mail">E-posta</Label>
              <Input
                id="mail"
                type="email"
                value={newPersonel.mail}
                onChange={(e) => setNewPersonel({ ...newPersonel, mail: e.target.value })}
                placeholder="ornek@fabrika.com"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddDialogOpen(false);
              setNewPersonel({ ad: '', soyad: '', unvan: '', mail: '' });
            }} disabled={adding}>
              İptal
            </Button>
            <Button onClick={handleAddPersonel} disabled={adding || !newPersonel.ad || !newPersonel.soyad}>
              {adding ? "Ekleniyor..." : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Personel Düzenleme Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Personel Görevini Düzenle</DialogTitle>
            <DialogDescription>
              {selectedPersonel?.ad} {selectedPersonel?.soyad} personelinin görevini değiştirin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Görev/Ünvan</label>
              <Select value={newRole || undefined} onValueChange={(value) => setNewRole(value as AppRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Görev seçin" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_NAMES) as AppRole[]).map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_NAMES[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={updating}>
              İptal
            </Button>
            <Button onClick={handleUpdateRole} disabled={updating || !newRole}>
              {updating ? "Güncelleniyor..." : "Güncelle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Personel Silme Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Personel Sil</DialogTitle>
            <DialogDescription>
              {selectedPersonel?.ad} {selectedPersonel?.soyad} personelini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedPersonel(null);
            }} disabled={deleting}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDeletePersonel} disabled={deleting}>
              {deleting ? "Siliniyor..." : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
