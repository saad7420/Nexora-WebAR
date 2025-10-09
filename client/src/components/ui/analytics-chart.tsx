import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  category?: string;
  change?: number;
}

interface AnalyticsChartProps {
  data: ChartDataPoint[];
  type?: 'line' | 'area' | 'bar' | 'pie';
  title?: string;
  description?: string;
  valueKey?: string;
  categoryKey?: string;
  showTrend?: boolean;
  height?: number;
  colors?: string[];
  className?: string;
}

const defaultColors = [
  'hsl(var(--primary))',
  'hsl(var(--accent))', 
  'hsl(var(--gold))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))'
];

export function AnalyticsChart({
  data,
  type = 'line',
  title,
  description,
  valueKey = 'value',
  categoryKey = 'date',
  showTrend = true,
  height = 300,
  colors = defaultColors,
  className
}: AnalyticsChartProps) {
  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const calculateTrend = () => {
    if (data.length < 2) return { value: 0, isPositive: true };
    
    const latest = data[data.length - 1]?.[valueKey] || 0;
    const previous = data[data.length - 2]?.[valueKey] || 0;
    
    if (previous === 0) return { value: 0, isPositive: true };
    
    const change = ((latest - previous) / previous) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
  };

  const trend = calculateTrend();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${formatValue(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey={categoryKey}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={formatValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={valueKey}
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey={categoryKey}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={formatValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey={valueKey}
              fill={colors[0]}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={valueKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        );

      default: // line
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey={categoryKey}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={formatValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={valueKey}
              stroke={colors[0]}
              strokeWidth={2}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
            />
          </LineChart>
        );
    }
  };

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <div className="text-muted-foreground">No data available</div>
            <p className="text-sm text-muted-foreground">
              Chart will appear when data is available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="analytics-chart">
      {(title || description || showTrend) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              {title && <CardTitle className="text-lg">{title}</CardTitle>}
              {description && (
                <CardDescription className="mt-1">{description}</CardDescription>
              )}
            </div>
            {showTrend && data.length > 1 && (
              <Badge 
                variant="outline" 
                className={`flex items-center space-x-1 ${
                  trend.isPositive 
                    ? 'text-green-500 border-green-500/20 bg-green-500/10' 
                    : 'text-red-500 border-red-500/20 bg-red-500/10'
                }`}
              >
                {trend.isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{trend.value.toFixed(1)}%</span>
              </Badge>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
