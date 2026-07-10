import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts';

// Palette catégorielle validée (dataviz skill, ordre fixe) — cf. StatsOverview.tsx.
const SERIES_COLORS = ['#2a78d6', '#1baf7a', '#eda100', '#4a3aa7', '#e34948'];

interface BreakdownBarChartProps {
  title: string;
  data: { label: string; count: number }[];
}

export function BreakdownBarChart({ title, data }: BreakdownBarChartProps) {
  return (
    <div className="rounded-lg border border-admin-border bg-admin-surface p-4">
      <p className="mb-2 text-sm font-medium text-admin-text">{title}</p>
      {data.length === 0 ? (
        <p className="py-8 text-center text-xs text-admin-muted">—</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#C3C2B7' }} tickLine={false} />
            <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {data.map((_, i) => (
                <Cell key={i} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
              ))}
              <LabelList dataKey="count" position="top" fill="#1E293B" fontSize={11} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
