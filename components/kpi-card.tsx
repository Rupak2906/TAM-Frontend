"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { Metric } from "@/lib/schemas/types";
import { MetricTraceModal } from "@/components/modals/metric-trace-modal";
import { SeverityBadge } from "@/components/severity-badge";
import { useGlobalStore } from "@/lib/store/use-global-store";

export function KpiCard({ metric }: { metric: Metric }) {
  const [open, setOpen] = useState(false);
  const { setSelectedMetricId } = useGlobalStore();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    setSelectedMetricId(next ? metric.id : null);
  };

  return (
    <>
      <Card className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-soft" onClick={() => handleOpenChange(true)}>
        <CardContent className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-2xl font-bold">{metric.value}</p>
            {metric.severity ? <SeverityBadge severity={metric.severity} /> : null}
          </div>
          {metric.delta ? <p className="mt-2 text-xs text-muted-foreground">vs last run: {metric.delta}</p> : null}
        </CardContent>
      </Card>
      <MetricTraceModal open={open} onOpenChange={handleOpenChange} metric={metric} />
    </>
  );
}
