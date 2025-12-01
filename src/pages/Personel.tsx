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
import { Users, Edit } from "lucide-react";

interface PersonelData {
  id: string;
  ad: string | null;
  soyad: string | null;
  email: string | null;
  role: AppRole;
}

export default function Personel() {
  const [personelList, setPersonelList] = useState<PersonelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPersonel, setSelectedPersonel] = useState<PersonelData | null>(null);
  const [newRole, setNewRole] = useState<AppRole | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchPersonel();
  }, []);

  const fetchPersonel = async () => {
    try {
      setLoading(true);
      
      // Tüm profilleri çek
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Tüm rolleri çek
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Profil ve rolleri birleştir
      const combinedData: PersonelData[] = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        return {
          id: profile.id,
          ad: profile.ad,
          soyad: profile.soyad,
          email: profile.email,
          role: userRole?.role || 'uretim_personeli' as AppRole
        };
      }) || [];

      setPersonelList(combinedData);
    } catch (error: any) {
      console.error('Personel listesi yüklenirken hata:', error);
      toast.error('Personel listesi yüklenemedi');
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

      // Delete old role
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedPersonel.id);

      if (deleteError) throw deleteError;

      // Insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedPersonel.id,
          role: newRole
        });

      if (insertError) throw insertError;

      toast.success('Kullanıcı yetkisi güncellendi');
      setEditDialogOpen(false);
      fetchPersonel();
    } catch (error: any) {
      console.error('Yetki güncellenirken hata:', error);
      toast.error('Yetki güncellenemedi');
    } finally {
      setUpdating(false);
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
            <CardTitle>Personel Listesi</CardTitle>
            <CardDescription>Toplam {personelList.length} personel</CardDescription>
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
                    <TableHead>E-posta</TableHead>
                    <TableHead>Görev</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personelList.map((personel) => (
                    <TableRow key={personel.id}>
                      <TableCell className="font-medium">{personel.ad || '-'}</TableCell>
                      <TableCell>{personel.soyad || '-'}</TableCell>
                      <TableCell>{personel.email || '-'}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {ROLE_NAMES[personel.role]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(personel)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Düzenle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {personelList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcı Yetkisini Düzenle</DialogTitle>
            <DialogDescription>
              {selectedPersonel?.ad} {selectedPersonel?.soyad} kullanıcısının yetkisini değiştirin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Yetki/Görev</label>
              <Select value={newRole || undefined} onValueChange={(value) => setNewRole(value as AppRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Yetki seçin" />
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
    </DashboardLayout>
  );
}
