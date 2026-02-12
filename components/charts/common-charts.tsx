"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Cell,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const numberFormat = (value: number) => `${value.toFixed(1)}`;

export function TrendLineChart({ data, expanded = false }: { data: Array<Record<string, string | number>>; expanded?: boolean }) {
  return (
    <div className={expanded ? "h-[420px]" : "h-64"}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value: number) => numberFormat(value)} />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#0f4c81" strokeWidth={2} dot />
          <Line type="monotone" dataKey="adjustedEbitda" stroke="#16a34a" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AreaTrendChart({ data, keyName, expanded = false }: { data: Array<Record<string, string | number>>; keyName: string; expanded?: boolean }) {
  return (
    <div className={expanded ? "h-[420px]" : "h-64"}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value: number) => numberFormat(value)} />
          <Area type="monotone" dataKey={keyName} stroke="#0891b2" fill="#67e8f9" fillOpacity={0.45} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarCompareChart({ data, xKey, bars, expanded = false }: { data: Array<Record<string, string | number>>; xKey: string; bars: Array<{ key: string; color: string }>; expanded?: boolean }) {
  return (
    <div className={expanded ? "h-[420px]" : "h-64"}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value: number) => numberFormat(value)} />
          <Legend />
          {bars.map((b) => (
            <Bar key={b.key} dataKey={b.key} fill={b.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RiskZoneMapChart({ data, expanded = false }: { data: Array<{ subject: string; score: number }>; expanded?: boolean }) {
  const plotted = data.map((row) => ({
    ...row,
    zone: row.score >= 7 ? "High" : row.score >= 4.5 ? "Watch" : "Low",
  }));

  const zoneColor = (score: number) => (score >= 7 ? "#ef4444" : score >= 4.5 ? "#f59e0b" : "#22c55e");

  return (
    <div className={expanded ? "h-[420px]" : "h-72"}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <ReferenceArea x1={0} x2={4.5} fill="#dcfce7" fillOpacity={0.6} />
          <ReferenceArea x1={4.5} x2={7} fill="#fef3c7" fillOpacity={0.6} />
          <ReferenceArea x1={7} x2={10} fill="#fee2e2" fillOpacity={0.7} />
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="score" domain={[0, 10]} tick={{ fontSize: 11 }} label={{ value: "Risk Score", position: "insideBottom", offset: -8 }} />
          <YAxis type="category" dataKey="subject" tick={{ fontSize: 11 }} width={110} />
          <Tooltip
            cursor={{ strokeDasharray: "4 4" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload?.[0]?.payload as { subject: string; zone: string } | undefined;
              const score = Number(payload[0]?.value ?? 0);
              if (!p) return null;
              return (
                <div className="rounded border bg-white p-2 text-xs shadow-soft">
                  <p className="font-semibold">{p.subject}</p>
                  <p>score: {score.toFixed(1)} / 10</p>
                  <p>zone: {p.zone}</p>
                </div>
              );
            }}
          />
          <Scatter data={plotted} fill="#0ea5e9" shape="circle">
            {plotted.map((entry, index) => (
              <Cell key={`${entry.subject}-${index}`} fill={zoneColor(entry.score)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WaterfallLikeChart({ data, expanded = false }: { data: Array<{ step: string; value: number }>; expanded?: boolean }) {
  return (
    <div className={expanded ? "h-[420px]" : "h-64"}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="step" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value: number) => numberFormat(value)} />
          <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
