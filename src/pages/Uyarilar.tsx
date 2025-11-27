import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AlertBadge } from "@/components/dashboard/AlertBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockUyarilar } from "@/lib/mockData";
import { AlertCircle, AlertTriangle, Info, Bell } from "lucide-react";

export default function Uyarilar() {
  const kritikUyarilar = mockUyarilar.filter(u => u.tip === "kritik");
  const ortaUyarilar = mockUyarilar.filter(u => u.tip === "uyari");
  const bilgiUyarilar = mockUyarilar.filter(u => u.tip === "bilgi");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Uyarılar & Bildirimler</h1>
          <p className="text-muted-foreground">Sistem uyarıları ve önemli bildirimler</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Kritik Uyarılar"
            value={kritikUyarilar.length}
            icon={AlertCircle}
            variant="destructive"
            subtitle="Acil müdahale gerekli"
          />
          <KpiCard
            title="Orta Uyarılar"
            value={ortaUyarilar.length}
            icon={AlertTriangle}
            variant="warning"
            subtitle="Dikkat edilmeli"
          />
          <KpiCard
            title="Bilgi"
            value={bilgiUyarilar.length}
            icon={Info}
            variant="info"
            subtitle="Bilgilendirme"
          />
          <KpiCard
            title="Toplam Uyarı"
            value={mockUyarilar.length}
            icon={Bell}
            variant="default"
            subtitle="Son 24 saat"
          />
        </div>

        {/* Kritik Uyarılar */}
        {kritikUyarilar.length > 0 && (
          <Card className="bg-card border-2 border-destructive/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Kritik Uyarılar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {kritikUyarilar.map((uyari) => (
                  <AlertBadge
                    key={uyari.id}
                    type={uyari.tip as "kritik" | "uyari" | "bilgi"}
                    title={uyari.baslik}
                    message={uyari.mesaj}
                    timestamp={uyari.tarih}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orta Seviye Uyarılar */}
        {ortaUyarilar.length > 0 && (
          <Card className="bg-card border-2 border-warning/30 shadow-[0_0_15px_rgba(251,146,60,0.1)]">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Orta Seviye Uyarılar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ortaUyarilar.map((uyari) => (
                  <AlertBadge
                    key={uyari.id}
                    type={uyari.tip as "kritik" | "uyari" | "bilgi"}
                    title={uyari.baslik}
                    message={uyari.mesaj}
                    timestamp={uyari.tarih}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bilgilendirme */}
        {bilgiUyarilar.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Info className="w-5 h-5 text-accent" />
                Bilgilendirme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bilgiUyarilar.map((uyari) => (
                  <AlertBadge
                    key={uyari.id}
                    type={uyari.tip as "kritik" | "uyari" | "bilgi"}
                    title={uyari.baslik}
                    message={uyari.mesaj}
                    timestamp={uyari.tarih}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
