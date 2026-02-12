"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { useApiQuery } from "@/hooks/use-api-query";
import { DocumentsResponseSchema, FileInventorySchema } from "@/lib/schemas/types";
import { formatDateTime } from "@/lib/utils/format";
import { z } from "zod";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/severity-badge";
import { DocumentUploadTool } from "@/components/documents/document-upload-tool";

export default function DocumentsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const highlightedFile = params.get("file");
  const query = useApiQuery(["documents"], "/api/deal/documents", DocumentsResponseSchema);
  const [selectedFile, setSelectedFile] = useState<z.infer<typeof FileInventorySchema> | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<z.infer<typeof FileInventorySchema>[]>([]);

  const legend = useMemo(() => ({ Available: "bg-emerald-200", Partial: "bg-amber-200", Missing: "bg-rose-200" }), []);
  const inventoryRows = useMemo(
    () => [...uploadedFiles, ...(query.data?.inventory ?? [])],
    [query.data?.inventory, uploadedFiles]
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("tam-uploaded-files");
      if (!raw) return;
      const parsed = JSON.parse(raw) as z.infer<typeof FileInventorySchema>[];
      setUploadedFiles(parsed);
    } catch {
      setUploadedFiles([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("tam-uploaded-files", JSON.stringify(uploadedFiles));
  }, [uploadedFiles]);

  if (query.isLoading || !query.data) return <div className="grid gap-4"><div className="h-72 animate-pulse rounded-lg bg-muted" /><div className="h-72 animate-pulse rounded-lg bg-muted" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Documents</h2><p className="text-xs text-muted-foreground">Last updated: {formatDateTime(query.data.lastUpdated)}</p></div>

      <DocumentUploadTool
        onFilesProcessed={(rows) =>
          setUploadedFiles((prev) => {
            const merged = [...rows, ...prev];
            const uniqueByName = merged.filter((row, idx, arr) => arr.findIndex((x) => x.file === row.file) === idx);
            return uniqueByName;
          })
        }
      />

      <Card>
        <CardHeader><CardTitle>Coverage heatmap</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-3 flex gap-3 text-xs">
            <span className="inline-flex items-center gap-1"><span className={`h-3 w-3 rounded ${legend.Available}`} /> Available</span>
            <span className="inline-flex items-center gap-1"><span className={`h-3 w-3 rounded ${legend.Partial}`} /> Partial</span>
            <span className="inline-flex items-center gap-1"><span className={`h-3 w-3 rounded ${legend.Missing}`} /> Missing</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr><th className="px-2 py-2 text-left">Schedule</th>{query.data.coverage[0]?.months.map((m) => <th key={m.month} className="px-2 py-2">{m.month}</th>)}</tr>
              </thead>
              <tbody>
                {query.data.coverage.map((row) => (
                  <tr key={row.schedule} className="border-t">
                    <td className="px-2 py-2 font-medium">{row.schedule}</td>
                    {row.months.map((cell) => (
                      <td key={cell.month} className="px-2 py-2">
                        <div className={`mx-auto h-4 w-6 rounded ${legend[cell.status]}`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <DataTable
        title="File inventory"
        rows={inventoryRows}
        onRowClick={(row) => setSelectedFile(row)}
        columns={[
          { key: "file", header: "File", render: (r) => <span className={r.file === highlightedFile ? "font-semibold text-primary" : ""}>{r.file}</span> },
          { key: "detectedType", header: "Detected Type" },
          { key: "periodCoverage", header: "Period Coverage" },
          { key: "entity", header: "Entity" },
          { key: "status", header: "Status" },
          { key: "confidence", header: "Confidence", render: (r) => `${Math.round(r.confidence * 100)}%` },
        ]}
      />

      <Card>
        <CardHeader><CardTitle>Missing / PBC suggestions</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {query.data.pbc.map((pbc) => (
            <div key={pbc.id} className="flex flex-wrap items-center justify-between gap-2 rounded border bg-white p-3">
              <div>
                <p className="font-medium">{pbc.request}</p>
                <p className="text-xs text-muted-foreground">Owner: {pbc.owner}</p>
              </div>
              <div className="flex items-center gap-2">
                <SeverityBadge severity={pbc.severity} />
                <Button size="sm" variant="outline" onClick={() => router.push(`/inquiry?prefill=${encodeURIComponent(pbc.request)}`)}>Create inquiry</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Sheet open={!!selectedFile} onOpenChange={(v) => !v && setSelectedFile(null)}>
        <SheetContent side="right" className="w-[420px]">
          {selectedFile ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">File Preview</h3>
              <p className="text-sm"><span className="font-semibold">File:</span> {selectedFile.file}</p>
              <p className="text-sm"><span className="font-semibold">Type:</span> {selectedFile.detectedType}</p>
              <p className="text-sm"><span className="font-semibold">Coverage:</span> {selectedFile.periodCoverage}</p>
              <div className="rounded border bg-muted/30 p-3 text-sm">Mock preview pane for parsed sheet structure and detected mappings.</div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
