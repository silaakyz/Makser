import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  variant?: "default" | "success" | "warning" | "destructive" | "info";
  className?: string;
}

const variantStyles = {
  default: "border-primary/30 shadow-[0_0_15px_rgba(34,197,94,0.15)]",
  success: "border-success/30 shadow-[0_0_15px_rgba(34,197,94,0.15)]",
  warning: "border-warning/30 shadow-[0_0_15px_rgba(251,146,60,0.15)]",
  destructive: "border-destructive/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]",
  info: "border-accent/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]",
};

const iconVariantStyles = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-accent/10 text-accent",
};

export function KpiCard({ 
  title, 
  value, 
  icon: Icon, 
  subtitle, 
  variant = "default",
  className 
}: KpiCardProps) {
  return (
    <Card 
      className={cn(
        "p-6 bg-card border-2 transition-all hover:shadow-[0_0_25px_rgba(34,197,94,0.2)]",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-foreground mb-1">{value}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center",
          iconVariantStyles[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}
