"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export type MetricaChartRow = {
  mes: string;
  igSeguidores: number;
  tkSeguidores: number;
  igEngajamento: number;
  tkEngajamento: number;
  igAlcance: number;
  tkViews: number;
};

// Coral da marca e azul-ardósia complementar
const COR_IG = "#FF9A86";
const COR_TK = "#7C6AF7";

function fmtK(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
}

function fmtPct(v: number) {
  return `${v.toFixed(2)}%`;
}

const axisStyle = { fontSize: 11, fill: "hsl(215 12% 50%)" };

const gridStyle = { stroke: "hsl(32 18% 91%)", strokeDasharray: "3 3" };

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="mb-4 text-sm font-semibold text-foreground">{title}</p>
      {children}
    </div>
  );
}

export default function MetricasCharts({ data }: { data: MetricaChartRow[] }) {
  if (data.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Sincronize ao menos 2 meses para exibir os gráficos de tendência.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Seguidores */}
      <ChartCard title="Seguidores ao longo do tempo">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="mes" tick={axisStyle} />
            <YAxis tickFormatter={fmtK} tick={axisStyle} width={40} />
            <Tooltip
              formatter={(value) => fmtK(Number(value))}
              contentStyle={{ fontSize: 12, borderColor: "hsl(32 18% 91%)" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="igSeguidores"
              name="Instagram"
              stroke={COR_IG}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="tkSeguidores"
              name="TikTok"
              stroke={COR_TK}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Engajamento */}
      <ChartCard title="Taxa de engajamento (%)">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="mes" tick={axisStyle} />
            <YAxis tickFormatter={(v) => `${v}%`} tick={axisStyle} width={40} />
            <Tooltip
              formatter={(value) => fmtPct(Number(value))}
              contentStyle={{ fontSize: 12, borderColor: "hsl(32 18% 91%)" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="igEngajamento"
              name="Instagram"
              stroke={COR_IG}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="tkEngajamento"
              name="TikTok"
              stroke={COR_TK}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Alcance e Views */}
      <ChartCard title="Alcance (Instagram) · Views (TikTok) — por mês">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="mes" tick={axisStyle} />
            <YAxis tickFormatter={fmtK} tick={axisStyle} width={40} />
            <Tooltip
              formatter={(value) => fmtK(Number(value))}
              contentStyle={{ fontSize: 12, borderColor: "hsl(32 18% 91%)" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="igAlcance" name="Alcance IG" fill={COR_IG} radius={[3, 3, 0, 0]} />
            <Bar dataKey="tkViews" name="Views TikTok" fill={COR_TK} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
