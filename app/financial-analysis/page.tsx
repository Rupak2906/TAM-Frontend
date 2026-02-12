"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KpiCard } from "@/components/kpi-card";
import { ChartCard } from "@/components/charts/chart-card";
import { AreaTrendChart, BarCompareChart, TrendLineChart, WaterfallLikeChart } from "@/components/charts/common-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { useApiQuery } from "@/hooks/use-api-query";
import { AnalysisResponseSchema, type Metric } from "@/lib/schemas/types";
import { useGlobalStore } from "@/lib/store/use-global-store";
import { MetricTraceModal } from "@/components/modals/metric-trace-modal";

const subTabs = [
  { key: "qoe", label: "Quality of Earnings" },
  { key: "revenue", label: "Revenue QoE" },
  { key: "margin", label: "Margin / Cost QoE" },
  { key: "working-capital", label: "Working Capital" },
  { key: "cash-flow", label: "Cash Flow & Conversion" },
  { key: "statements", label: "Statements" },
] as const;

type SubTab = (typeof subTabs)[number]["key"];

const fallbackMetric: Metric = {
  id: "statement-row",
  label: "Statement line trace",
  value: "$0",
  lineage: [
    { title: "Inputs", description: "Mapped statement line item", references: ["TB_FY24.xlsx"] },
    { title: "Transformations", description: "Standardization + period alignment", references: ["Mapping v2.1"] },
    { title: "Formula", description: "Line item trace into standardized statement", references: ["Statements model"] },
    { title: "Filters / Overrides", description: "None", references: ["-" ]},
  ],
  cellTrace: [
    { step: "1", source: "TB_FY24.xlsx/IS", logic: "Mapped source account group", value: "$0" },
  ],
};

export default function FinancialAnalysisPage() {
  const params = useSearchParams();
  const router = useRouter();
  const sub = (params.get("sub") as SubTab) || "qoe";
  const { deal, period, basis } = useGlobalStore();
  const query = useApiQuery(
    ["analysis", deal, period, basis],
    `/api/deal/analysis?deal=${encodeURIComponent(deal)}&period=${encodeURIComponent(period)}&basis=${encodeURIComponent(basis)}`,
    AnalysisResponseSchema
  );
  const [statementMetric, setStatementMetric] = useState<Metric | null>(null);

  if (query.isLoading || !query.data) return <div className="h-80 animate-pulse rounded-lg bg-muted" />;

  const data = query.data;
  const steps = data.qoeMetrics[0].lineage;
  const metricTemplate = data.qoeMetrics[0];
  const createMetric = (
    id: string,
    label: string,
    value: string,
    formula: string,
    delta?: string,
    severity?: "Green" | "Amber" | "Red"
  ): Metric => ({
    ...metricTemplate,
    id,
    label,
    value,
    delta,
    severity,
    lineage: metricTemplate.lineage.map((s, idx) => (idx === 2 ? { ...s, description: formula } : s)),
    cellTrace: metricTemplate.cellTrace.map((s, idx) => (idx === 1 ? { ...s, logic: formula, value } : { ...s, value })),
  });

  const renderSection = () => {
    if (sub === "qoe") {
      const extraQoeMetrics: Metric[] = [
        createMetric("qoe-pos-neg", "Positive vs Negative Adjustments ($)", "$1.44M / -$0.24M", "Split accepted adjustment amounts by sign"),
        createMetric("qoe-runrate", "Run-Rate Earnings", "$13.1M", "Run-Rate Earnings = Adjusted EBITDA +/- run-rate normalization"),
      ];
      const categoryTotals = [
        { category: "One-Time Expenses", amount: "$0.62M" },
        { category: "Owner / Management Compensation", amount: "$0.21M" },
        { category: "Related-Party Charges", amount: "$0.08M" },
        { category: "Non-Operating Income / Expense", amount: "$0.18M" },
        { category: "Accounting Policy Adjustments", amount: "$0.04M" },
        { category: "Run-Rate Cost Savings / Increases", amount: "$0.11M" },
        { category: "Exceptional / Extraordinary Items", amount: "$0.16M" },
      ];
      return (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{data.qoeMetrics.map((m) => <KpiCard key={m.id} metric={m} />)}</div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{extraQoeMetrics.map((m) => <KpiCard key={m.id} metric={m} />)}</div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="EBITDA bridge waterfall" steps={steps} renderChart={(expanded) => <WaterfallLikeChart expanded={expanded} data={[{ step: "Reported", value: 12.2 }, { step: "Adj", value: 1.2 }, { step: "Adjusted", value: 13.4 }]} />} />
            <ChartCard title="Adjustments by category" steps={steps} renderChart={(expanded) => <BarCompareChart expanded={expanded} xKey="category" data={[{ category: "Legal", value: 0.32 }, { category: "Owner Comp", value: 0.21 }, { category: "FX", value: 0.18 }, { category: "Restructuring", value: 0.49 }]} bars={[{ key: "value", color: "#0e7490" }]} />} />
          </div>
          <Card>
            <CardHeader><CardTitle>Adjustment Category Totals</CardTitle></CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {categoryTotals.map((row) => (
                <div key={row.category} className="rounded border bg-white p-3">
                  <p className="text-xs uppercase text-muted-foreground">{row.category}</p>
                  <p className="mt-1 text-lg font-semibold">{row.amount}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Adjustment register</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {Array.from(new Set(data.adjustments.map((a) => a.category))).map((category) => (
                <details key={category} className="rounded border bg-white p-2">
                  <summary className="cursor-pointer font-semibold">{category}</summary>
                  <div className="mt-2 space-y-2">
                    {data.adjustments.filter((a) => a.category === category).map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded border p-2 text-sm">
                        <div><p className="font-medium">{a.id} - {a.description}</p><p className="text-xs text-muted-foreground">Status: {a.status}</p></div>
                        <p className="font-semibold">${(a.amount / 1_000_000).toFixed(2)}M</p>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </CardContent>
          </Card>
        </>
      );
    }

    if (sub === "revenue") {
      const extraRevenueMetrics: Metric[] = [
        createMetric("rev-top5-top10", "Top 5 / Top 10 concentration %", "34% / 41%", "Concentration = Revenue from top customers / Total revenue"),
        createMetric("rev-largest-customer", "Largest Customer %", "12%", "Largest customer concentration = Largest customer revenue / Total revenue"),
        createMetric("rev-period-end", "Revenue recognized near period-end %", "18.6%", "Period-end % = Revenue in final 5 days / Total period revenue", undefined, "Amber"),
        createMetric("rev-project-based", "One-off / project-based revenue %", "14.2%", "One-off % = Non-recurring project revenue / Total revenue", undefined, "Amber"),
        createMetric("rev-churn-proxy", "Customer churn proxy", "6.5%", "Churn proxy = Lost recurring revenue from prior cohort / Prior recurring revenue"),
      ];
      return (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data.revenueMetrics.map((m) => <KpiCard key={m.id} metric={m} />)}</div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{extraRevenueMetrics.map((m) => <KpiCard key={m.id} metric={m} />)}</div>
          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard title="Revenue trend" steps={steps} renderChart={(expanded) => <TrendLineChart data={data.trend} expanded={expanded} />} />
            <ChartCard title="Concentration bars/curve" steps={steps} renderChart={(expanded) => <BarCompareChart expanded={expanded} xKey="label" data={data.concentration} bars={[{ key: "value", color: "#0f4c81" }]} />} />
            <ChartCard title="End-of-month spike chart" steps={steps} renderChart={(expanded) => <AreaTrendChart expanded={expanded} data={data.trend} keyName="revenue" />} />
          </div>
        </>
      );
    }

    if (sub === "margin") {
      const extraMarginMetrics: Metric[] = [
        createMetric("margin-ltm-trend", "Margin Trend (LTM)", "+120 bps", "LTM margin trend = Current LTM EBITDA margin - Prior LTM EBITDA margin"),
        createMetric("margin-marketing", "Marketing %", "11%", "Marketing cost / Revenue"),
        createMetric("margin-it-tech", "IT / Tech %", "8%", "IT and technology cost / Revenue"),
        createMetric("margin-rent", "Rent / Facilities %", "4%", "Facility cost / Revenue"),
        createMetric("margin-contractors", "Contractors / Outsourcing %", "7%", "Contractor spend / Revenue"),
        createMetric("margin-suppressed", "Temporarily suppressed costs ($)", "$0.23M", "Suppressed cost estimate from temporary reductions", undefined, "Amber"),
        createMetric("margin-inflation", "Cost inflation exposure", "Moderate", "Qualitative flag based on vendor and payroll inflation trend", undefined, "Amber"),
      ];
      return (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{data.marginMetrics.map((m) => <KpiCard key={m.id} metric={m} />)}</div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{extraMarginMetrics.map((m) => <KpiCard key={m.id} metric={m} />)}</div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Gross margin trend" steps={steps} renderChart={(expanded) => <AreaTrendChart expanded={expanded} data={data.trend.map((t) => ({ ...t, grossMargin: ((t.revenue - (t.revenue * 0.532)) / t.revenue) * 100 }))} keyName="grossMargin" />} />
            <ChartCard title="Opex mix" steps={steps} renderChart={(expanded) => <BarCompareChart expanded={expanded} xKey="name" data={data.opexMix} bars={[{ key: "value", color: "#059669" }]} />} />
          </div>
        </>
      );
    }

    if (sub === "working-capital") {
      const extraWcMetrics: Metric[] = [
        createMetric("wc-peak-trough", "Peak / Trough NWC", "$6.9M / $5.3M", "Peak/Trough from trailing monthly NWC"),
        createMetric("wc-pct-revenue", "NWC as % of Revenue", "9.6%", "NWC % Revenue = NWC / Revenue"),
        createMetric("wc-norm-adj", "NWC Normalization Adjustments ($)", "$0.18M", "Normalization adjustments applied to NWC peg"),
      ];
      const compositionMetrics: Metric[] = [
        createMetric("wc-ar", "Accounts Receivable", "$6.0M", "AR from latest balance sheet mapping"),
        createMetric("wc-inventory", "Inventory", "$4.1M", "Inventory from latest balance sheet mapping"),
        createMetric("wc-prepaids", "Prepaids / Other CA", "$1.3M", "Prepaids and other current assets mapping"),
        createMetric("wc-ap", "Accounts Payable", "$4.4M", "AP from latest balance sheet mapping"),
        createMetric("wc-accruals", "Accruals / Other CL", "$1.2M", "Accruals and other current liabilities mapping"),
      ];
      const driverRiskMetrics: Metric[] = [
        createMetric("wc-ar-growth-risk", "AR > revenue growth", "Flagged", "AR growth rate compared against revenue growth rate", undefined, "Amber"),
        createMetric("wc-payables-compression", "Payables compression", "Observed", "DPO reduction vs prior period", undefined, "Amber"),
        createMetric("wc-inventory-build", "Inventory buildup", "Watch", "DIO increase trend vs historical baseline", undefined, "Amber"),
        createMetric("wc-seasonality-mismatch", "Seasonality mismatch", "Low", "Variance between seasonal pattern and current cycle"),
      ];
      return (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data.wcMetrics.map((m) => <KpiCard key={m.id} metric={m} />)}</div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{extraWcMetrics.map((m) => <KpiCard key={m.id} metric={m} />)}</div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="NWC trend" steps={steps} renderChart={(expanded) => <AreaTrendChart expanded={expanded} data={data.trend} keyName="nwc" />} />
            <ChartCard title="AR/AP aging buckets" steps={steps} renderChart={(expanded) => <BarCompareChart expanded={expanded} xKey="bucket" data={data.aging} bars={[{ key: "ar", color: "#0284c7" }, { key: "ap", color: "#334155" }]} />} />
          </div>
          <Card>
            <CardHeader><CardTitle>NWC Composition</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                {compositionMetrics.map((m) => <KpiCard key={m.id} metric={m} />)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Working Capital Driver Risk Indicators</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {driverRiskMetrics.map((m) => <KpiCard key={m.id} metric={m} />)}
              </div>
            </CardContent>
          </Card>
        </>
      );
    }

    if (sub === "cash-flow") {
      const conversionThresholdMetrics: Metric[] = [
        createMetric("cash-threshold-60", "Conversion threshold (<60) status", "Weak", "Rule: conversion < 60% -> Weak", undefined, "Amber"),
        createMetric("cash-threshold-30", "Conversion threshold (<30) status", "Not Triggered", "Rule: conversion < 30% -> High Risk"),
        createMetric("cash-threshold-0", "Conversion threshold (<0) status", "Not Triggered", "Rule: conversion < 0% -> Critical"),
      ];
      return (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{data.cashMetrics.map((m) => <KpiCard key={m.id} metric={m} />)}</div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{conversionThresholdMetrics.map((m) => <KpiCard key={m.id} metric={m} />)}</div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="EBITDA->OCF bridge" steps={steps} renderChart={(expanded) => <WaterfallLikeChart expanded={expanded} data={[{ step: "EBITDA", value: 13.4 }, { step: "WC drag", value: -1.2 }, { step: "OCF", value: 6.4 }]} />} />
            <ChartCard title="Conversion % trend" steps={steps} renderChart={(expanded) => <AreaTrendChart expanded={expanded} data={data.trend} keyName="cashConversion" />} />
          </div>
        </>
      );
    }

    const incomeRows = [
      { id: "is1", line: "Net Revenue", latest: "$5.5M", ltm: "$63.7M" },
      { id: "is2", line: "COGS", latest: "$2.9M", ltm: "$33.9M" },
      { id: "is3", line: "EBITDA", latest: "$1.1M", ltm: "$12.2M" },
      { id: "is4", line: "Adjusted EBITDA", latest: "$1.2M", ltm: "$13.4M" },
    ];
    const bsRows = [
      { id: "bs1", line: "Accounts Receivable", latest: "$6.0M", ltm: "$6.1M" },
      { id: "bs2", line: "Inventory", latest: "$4.1M", ltm: "$4.0M" },
      { id: "bs3", line: "Accounts Payable", latest: "$4.4M", ltm: "$4.5M" },
      { id: "bs4", line: "Accruals", latest: "$1.2M", ltm: "$1.1M" },
    ];

    const openTrace = (line: string, value: string) => {
      setStatementMetric({ ...fallbackMetric, label: line, value, lineage: data.qoeMetrics[0].lineage, cellTrace: data.qoeMetrics[0].cellTrace });
    };

    return (
      <>
        <DataTable title="Standardized Income Statement (Latest + LTM)" rows={incomeRows} onRowClick={(r) => openTrace(r.line, r.ltm)} columns={[{ key: "line", header: "Line Item" }, { key: "latest", header: "Latest" }, { key: "ltm", header: "LTM" }]} />
        <DataTable title="Standardized Balance Sheet (Latest + LTM)" rows={bsRows} onRowClick={(r) => openTrace(r.line, r.ltm)} columns={[{ key: "line", header: "Line Item" }, { key: "latest", header: "Latest" }, { key: "ltm", header: "LTM" }]} />
        {statementMetric ? <MetricTraceModal open={!!statementMetric} onOpenChange={(v) => !v && setStatementMetric(null)} metric={statementMetric} /> : null}
      </>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {subTabs.map((tab) => (
          <Button key={tab.key} variant={tab.key === sub ? "default" : "outline"} size="sm" onClick={() => router.push(`/financial-analysis?sub=${tab.key}`)}>
            {tab.label}
          </Button>
        ))}
      </div>
      {renderSection()}
    </div>
  );
}
