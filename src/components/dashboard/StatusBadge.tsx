import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: string; className: string }> = {
  aktif: { label: "Aktif", variant: "default", className: "bg-success text-success-foreground font-semibold" },
  boşta: { label: "Boşta", variant: "secondary", className: "bg-muted text-muted-foreground font-semibold" },
  arızalı: { label: "Arızalı", variant: "destructive", className: "bg-destructive text-destructive-foreground font-semibold" },
  bakımda: { label: "Bakımda", variant: "default", className: "bg-warning text-warning-foreground font-semibold" },
  devam_ediyor: { label: "Devam Ediyor", variant: "default", className: "bg-primary text-primary-foreground font-semibold" },
  tamamlandi: { label: "Tamamlandı", variant: "default", className: "bg-success text-success-foreground font-semibold" },
  iptal: { label: "İptal", variant: "destructive", className: "bg-destructive text-destructive-foreground font-semibold" },
  beklemede: { label: "Beklemede", variant: "secondary", className: "bg-warning text-warning-foreground font-semibold" },
  uretimde: { label: "Üretimde", variant: "default", className: "bg-primary text-primary-foreground font-semibold" },
  stok: { label: "Stok", variant: "default", className: "bg-secondary text-secondary-foreground font-semibold" },
  uretim: { label: "Üretim", variant: "default", className: "bg-primary text-primary-foreground font-semibold" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: "secondary", className: "" };
  
  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
