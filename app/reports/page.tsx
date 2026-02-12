"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { inquiryData } from "@/lib/mock-data/data";
import { useApiQuery } from "@/hooks/use-api-query";
import { RiskResponseSchema } from "@/lib/schemas/types";

const exports = [
  "QoE Report (PDF)",
  "Executive Summary (PDF)",
  "Schedules Pack (Excel)",
  "Tie-out Report (Excel)",
  "Mapping Dictionary (CSV)",
];

export default function ReportsPage() {
  const params = useSearchParams();
  const query = useApiQuery(["risk-reports"], "/api/deal/risk", RiskResponseSchema);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (params.get("exportPack") === "true") setOpen(true);
  }, [params]);

  const readiness = useMemo(() => {
    if (!query.data) return "Draft";
    const blockingInquiries = inquiryData.filter((i) => i.blocking && i.status !== "Closed").length;
    const failedTieOuts = query.data.tieOuts.filter((t) => t.status === "Fail").length;
    if (blockingInquiries > 0 || failedTieOuts > 0) return "Blocked";
    const warns = query.data.tieOuts.filter((t) => t.status === "Warn").length;
    return warns > 0 ? "Draft" : "Ready";
  }, [query.data]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Reports</h2>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${readiness === "Ready" ? "bg-emerald-100 text-emerald-700" : readiness === "Draft" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
          Report Readiness: {readiness}
        </span>
      </div>

      <Card>
        <CardHeader><CardTitle>Export Center</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {exports.map((item) => (
            <div key={item} className="flex items-center justify-between rounded border bg-white p-3">
              <p className="font-medium">{item}</p>
              <Button size="sm" variant="outline">Export</Button>
            </div>
          ))}
          <Button onClick={() => setOpen(true)}>Export Pack</Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogTitle className="text-lg font-semibold">Export Pack Contents</DialogTitle>
          <div className="space-y-2 text-sm">
            <p>Included outputs:</p>
            <ul className="list-disc pl-5">
              {exports.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p>Pack also includes methodology notes, lineage snippets, and inquiry status appendix (mock).</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
