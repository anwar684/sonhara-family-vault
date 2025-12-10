import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatMonth } from '@/hooks/useDashboardStats';

interface MonthlyData {
  month: string;
  totalPaid: number;
  totalPending: number;
}

interface ContributionChartProps {
  takafulData?: MonthlyData[];
  plusData?: MonthlyData[];
}

export function ContributionChart({ takafulData = [], plusData = [] }: ContributionChartProps) {
  const chartData = takafulData.map((t, index) => ({
    month: formatMonth(t.month).split(' ')[0],
    'Takaful Collected': t.totalPaid,
    'Takaful Pending': t.totalPending,
    'Plus Collected': plusData[index]?.totalPaid || 0,
    'Plus Pending': plusData[index]?.totalPending || 0,
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center text-muted-foreground">
        No payment data available yet
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="month"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickFormatter={(value) => `₨${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            }}
            formatter={(value: number) => [`₨${value.toLocaleString()}`, '']}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
          />
          <Bar
            dataKey="Takaful Collected"
            fill="hsl(215, 60%, 22%)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="Plus Collected"
            fill="hsl(43, 74%, 49%)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
