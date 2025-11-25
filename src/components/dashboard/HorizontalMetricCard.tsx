import { Card, CardContent } from "@/components/ui/card";

interface HorizontalMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

export function HorizontalMetricCard({ title, value, subtitle }: HorizontalMetricCardProps) {
  return (
    <Card className="shadow-card border-2 border-border hover:border-primary transition-all">
      <CardContent className="p-6">
        <div className="text-center">
          <h3 className="text-sm font-semibold text-secondary uppercase tracking-wide mb-3">
            {title}
          </h3>
          <p className="text-4xl font-bold text-primary mb-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
