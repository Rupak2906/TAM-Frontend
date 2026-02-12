import { analysisData, customerData, documentsData, riskData, summaryData } from "@/lib/mock-data/data";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function dealFactor(deal: string | null) {
  const input = (deal ?? "Project Atlas").trim().toLowerCase();
  const hash = Array.from(input).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return 0.88 + (hash % 31) / 100;
}

function computeMultiplier(period: string | null, basis: string | null, deal: string | null) {
  const periodFactor = period === "Annual" ? 1.04 : period === "Quarterly" ? 1.02 : 1;
  const basisFactor = basis === "Pro Forma" ? 1.05 : basis === "Reported" ? 0.97 : 1;
  const companyFactor = dealFactor(deal);
  return periodFactor * basisFactor * companyFactor;
}

function formatMoneyM(value: number) {
  return `$${value.toFixed(1)}M`;
}

function formatPct(value: number) {
  return `${value.toFixed(1)}%`;
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export async function getSummary(period: string | null, basis: string | null, deal: string | null) {
  await delay(300 + Math.round(Math.random() * 300));
  const data = clone(summaryData);
  const mult = computeMultiplier(period, basis, deal);
  data.trend = data.trend.map((t) => ({
    ...t,
    revenue: Number((t.revenue * mult).toFixed(2)),
    adjustedEbitda: Number((t.adjustedEbitda * mult).toFixed(2)),
    reportedEbitda: Number((t.reportedEbitda * mult).toFixed(2)),
    nwc: Number((t.nwc * (mult * 0.96)).toFixed(2)),
    cashConversion: Number(Math.max(22, Math.min(74, t.cashConversion * (0.94 + (mult - 1) * 0.25))).toFixed(1)),
    ocf: Number((t.ocf * (mult * 0.93)).toFixed(2)),
  }));

  const revenueLtm = data.trend.reduce((sum, t) => sum + t.revenue, 0);
  const reportedEbitdaLtm = data.trend.reduce((sum, t) => sum + t.reportedEbitda, 0);
  const adjustedEbitdaLtm = data.trend.reduce((sum, t) => sum + t.adjustedEbitda, 0);
  const avgNwc = data.trend.reduce((sum, t) => sum + t.nwc, 0) / data.trend.length;
  const avgCashConversion = data.trend.reduce((sum, t) => sum + t.cashConversion, 0) / data.trend.length;
  const adjustmentValue = Math.max(0.4, adjustedEbitdaLtm - reportedEbitdaLtm);
  const riskScore = Math.max(3.8, Math.min(8.7, 6.2 + (mult - 1) * 4.2));

  data.metrics = data.metrics.map((m) => {
    if (m.id === "revenue-ltm") return { ...m, value: formatMoneyM(revenueLtm), delta: `${(2 + mult * 2.1).toFixed(1)}%` };
    if (m.id === "reported-ebitda") return { ...m, value: formatMoneyM(reportedEbitdaLtm), delta: `${(1.8 + mult * 1.4).toFixed(1)}%` };
    if (m.id === "adjusted-ebitda") return { ...m, value: formatMoneyM(adjustedEbitdaLtm), delta: `${(2.4 + mult * 1.6).toFixed(1)}%` };
    if (m.id === "adj-pct") return { ...m, value: formatPct((adjustmentValue / Math.max(reportedEbitdaLtm, 0.1)) * 100) };
    if (m.id === "avg-nwc") return { ...m, value: formatMoneyM(avgNwc) };
    if (m.id === "nwc-peg") return { ...m, value: formatMoneyM(avgNwc * 1.03) };
    if (m.id === "cash-conv") return { ...m, value: `${avgCashConversion.toFixed(0)}%` };
    if (m.id === "overall-risk") return { ...m, value: `${riskScore.toFixed(1)} / 10`, severity: riskScore >= 7 ? "Red" : riskScore >= 4.8 ? "Amber" : "Green" };
    return m;
  });

  return data;
}

export async function getAnalysis(period: string | null, basis: string | null, deal: string | null) {
  await delay(300 + Math.round(Math.random() * 300));
  const data = clone(analysisData);
  const mult = computeMultiplier(period, basis, deal);
  data.trend = data.trend.map((t) => ({ ...t, revenue: Number((t.revenue * mult).toFixed(2)), adjustedEbitda: Number((t.adjustedEbitda * mult).toFixed(2)), reportedEbitda: Number((t.reportedEbitda * mult).toFixed(2)) }));
  return data;
}

export async function getRisk() {
  await delay(300 + Math.round(Math.random() * 300));
  return clone(riskData);
}

export async function getDocuments() {
  await delay(300 + Math.round(Math.random() * 300));
  return clone(documentsData);
}

export async function getCustomer(period: string | null, basis: string | null, deal: string | null) {
  await delay(300 + Math.round(Math.random() * 300));
  const data = clone(customerData);
  const mult = computeMultiplier(period, basis, deal);
  data.topTrend = data.topTrend.map((row) => ({ ...row, top1: Number((row.top1 * Math.min(mult, 1.08)).toFixed(2)), top10: Number((row.top10 * Math.min(mult, 1.08)).toFixed(2)) }));
  return data;
}
