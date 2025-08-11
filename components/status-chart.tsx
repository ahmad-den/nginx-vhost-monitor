"use client"

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts"

interface StatusChartProps {
  data: Record<string, number>
}

export function StatusChart({ data }: StatusChartProps) {
  const chartData = Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([status, count]) => ({
      status,
      count,
      fill: getStatusColor(status),
    }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900">{`Status ${label}`}</p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{payload[0].value}</span> requests
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-28 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <XAxis
            dataKey="status"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            height={20}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function getStatusColor(status: string): string {
  const code = Number.parseInt(status)
  if (code >= 200 && code < 300) return "#10b981" // emerald-500
  if (code >= 300 && code < 400) return "#3b82f6" // blue-500
  if (code >= 400 && code < 500) return "#f59e0b" // amber-500
  if (code >= 500) return "#ef4444" // red-500
  return "#6b7280" // gray-500
}
