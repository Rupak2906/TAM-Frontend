"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable } from "@/components/tables/data-table";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { Inquiry } from "@/lib/schemas/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGlobalStore } from "@/lib/store/use-global-store";
import { Textarea } from "@/components/ui/textarea";
import { useApiQuery } from "@/hooks/use-api-query";
import { InquiryResponseSchema } from "@/lib/schemas/types";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  mode?: string;
};

export default function InquiryPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { deal, period, basis } = useGlobalStore();
  const query = useApiQuery(
    ["inquiry", deal, period, basis],
    `/api/deal/inquiry?deal=${encodeURIComponent(deal)}&period=${encodeURIComponent(period)}&basis=${encodeURIComponent(basis)}`,
    InquiryResponseSchema
  );
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "I am TAM Inquiry AI. Ask me about dashboard metrics, risk hotspots, tie-outs, missing documents, or blocking inquiries.",
      mode: "system",
    },
  ]);

  const rows = useMemo(() => {
    if (!query.data) return [];
    const prefill = params.get("prefill");
    if (!prefill) return query.data.inquiries;
    const exists = query.data.inquiries.some((r) => r.request.toLowerCase().includes(prefill.toLowerCase()));
    if (exists) return query.data.inquiries;
    return [{ id: "INQ-NEW", request: prefill, owner: "Unassigned", dueDate: "2026-02-19", status: "Open", blocking: false }, ...query.data.inquiries];
  }, [params, query.data]);

  if (query.isLoading || !query.data) {
    return <div className="h-80 animate-pulse rounded-lg bg-muted" />;
  }

  const quickPrompts = [
    "What are the top risk hotspots right now?",
    "Summarize revenue, adjusted EBITDA, and cash conversion.",
    "Which tie-outs are failing and what should I prioritize?",
    "What is blocking report readiness?",
  ];

  const askCopilot = async (input?: string) => {
    const text = (input ?? question).trim();
    if (!text || loading) return;
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text }]);
    setQuestion("");
    try {
      const res = await fetch("/api/inquiry/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          deal,
          period,
          basis,
        }),
      });
      const json = (await res.json()) as { answer?: string; mode?: string };
      const answer = json.answer ?? "I could not generate a response.";
      setMessages((prev) => [...prev, { role: "assistant", text: answer, mode: json.mode }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I could not reach the assistant service. Please try again.",
          mode: "error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">Inquiry</h2>
      <div className="grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <DataTable
            rows={rows}
            onRowClick={(row) => setSelected(row)}
            columns={[
              { key: "id", header: "ID" },
              { key: "request", header: "Request" },
              { key: "owner", header: "Owner" },
              { key: "dueDate", header: "Due Date" },
              { key: "status", header: "Status" },
              { key: "blocking", header: "Blocking Yes/No", render: (r) => (r.blocking ? "Yes" : "No") },
            ]}
          />
        </div>
        <div className="xl:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Ask TAM AI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <Button key={prompt} size="sm" variant="outline" onClick={() => askCopilot(prompt)} disabled={loading}>
                    {prompt}
                  </Button>
                ))}
              </div>
              <div className="h-80 space-y-2 overflow-y-auto rounded border bg-muted/20 p-2">
                {messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`rounded p-2 text-sm ${message.role === "user" ? "ml-6 bg-primary/15" : "mr-6 bg-card border"}`}
                  >
                    <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                      {message.role}
                      {message.mode ? ` (${message.mode})` : ""}
                    </p>
                    <p>{message.text}</p>
                  </div>
                ))}
                {loading ? <div className="rounded border bg-card p-2 text-sm">Thinking...</div> : null}
              </div>
              <div className="space-y-2">
                <Textarea
                  className="min-h-24"
                  placeholder="Ask about dashboard metrics, risks, tie-outs, or document gaps..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button onClick={() => askCopilot()} disabled={loading || question.trim().length < 2}>
                    Ask TAM
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent side="right" className="w-[460px]">
          {selected ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">{selected.id}</h3>
              <p className="text-sm">{selected.request}</p>
              <div className="rounded border bg-muted/30 p-3 text-sm">Discussion thread placeholder: analyst comments, seller responses, attachment links.</div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push("/documents")}>Go to Documents</Button>
                <Button variant="outline" size="sm" onClick={() => router.push("/risk-assessment")}>Go to Risk Assessment</Button>
                <Button variant="outline" size="sm" onClick={() => router.push("/financial-analysis")}>Go to Financial Analysis</Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
