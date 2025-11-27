import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface AlertBadgeProps {
  type: "kritik" | "uyari" | "bilgi";
  title: string;
  message: string;
  timestamp: string;
  className?: string;
}

const typeConfig = {
  kritik: {
    icon: AlertCircle,
    className: "bg-destructive/10 text-destructive border-destructive/30",
    iconClassName: "text-destructive",
  },
  uyari: {
    icon: AlertTriangle,
    className: "bg-warning/10 text-warning border-warning/30",
    iconClassName: "text-warning",
  },
  bilgi: {
    icon: Info,
    className: "bg-accent/10 text-accent border-accent/30",
    iconClassName: "text-accent",
  },
};

export function AlertBadge({ type, title, message, timestamp, className }: AlertBadgeProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn(
      "p-4 rounded-lg border-2 transition-all hover:shadow-lg",
      config.className,
      className
    )}>
      <div className="flex items-start gap-3">
        <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", config.iconClassName)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-sm">{title}</h4>
            <Badge variant="outline" className="text-xs flex-shrink-0">
              {timestamp}
            </Badge>
          </div>
          <p className="text-sm opacity-90">{message}</p>
        </div>
      </div>
    </div>
  );
}
