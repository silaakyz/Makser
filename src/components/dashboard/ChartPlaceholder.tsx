import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BarChart3, LineChart, PieChart } from "lucide-react";

interface ChartPlaceholderProps {
  title: string;
  type?: "bar" | "line" | "pie";
  height?: string;
  className?: string;
}

export function ChartPlaceholder({ 
  title, 
  type = "bar", 
  height = "h-64",
  className 
}: ChartPlaceholderProps) {
  const Icon = type === "bar" ? BarChart3 : type === "line" ? LineChart : PieChart;

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn(
          "w-full rounded-lg bg-muted/20 border border-border flex items-center justify-center",
          height
        )}>
          <div className="text-center">
            <Icon className="w-12 h-12 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Grafik verisi yükleniyor...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
