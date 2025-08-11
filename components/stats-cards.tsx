"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Activity, Globe, Clock, AlertCircle, BarChart3, Eye, Zap } from "lucide-react"
import { StatusChart } from "@/components/status-chart"
import { cn } from "@/lib/utils"

interface VhostStats {
  vhost: string
  period_start_utc: string
  period_end_utc: string
  period_start_local: string
  period_end_local: string
  total_requests: number
  reqs_per_min: number
  unique_clients: number
  status_counts: Record<string, number>
  pct_4xx: number
  pct_5xx: number
  bytes_sent: number
  rt_ms?: {
    p50: number
    p90: number
    p99: number
    avg: number
    max: number
  }
  upstream_connect_ms?: number | null
  upstream_header_ms?: number | null
  upstream_resp_ms?: number | null
  top_paths: Array<{ key: string; count: number }>
  top_methods: Array<{ key: string; count: number }>
  top_user_agents: Array<{ key: string; count: number }>
  top_referrers: Array<{ key: string; count: number }>
  top_client_ips: Array<{ key: string; count: number }>
  sample_requests: Array<{
    ts: string
    client_ip: string
    method: string
    path: string
    protocol: string
    status: number
    bytes: number
    referer: string
    ua: string
    rt_ms: number
    uct_ms?: number | null
    uht_ms?: number | null
    urt_ms?: number | null
    cf_ray?: string
  }>
  error_log: {
    error: number
    warn: number
  }
}

interface StatsCardsProps {
  stats: VhostStats[]
  loading: boolean
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Virtual Host Details</h2>
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-gray-200 bg-white shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-8 w-12" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-24 w-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    )
  }

  if (stats.length === 0) {
    return (
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Virtual Host Details</h2>
        </div>
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600">No virtual hosts found for the selected time window.</p>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Virtual Host Details</h2>
        <Badge variant="outline" className="text-gray-600 border-gray-300 bg-gray-50">
          {stats.length} {stats.length === 1 ? "host" : "hosts"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const errorRate = stat.pct_4xx + stat.pct_5xx
          const isHealthy = errorRate < 1 && (stat.rt_ms?.p90 || 0) < 500
          const hasWarning =
            (errorRate >= 1 && errorRate <= 5) || ((stat.rt_ms?.p90 || 0) >= 500 && (stat.rt_ms?.p90 || 0) < 1000)
          const isCritical = errorRate > 5 || (stat.rt_ms?.p90 || 0) >= 1000

          const healthColor = isCritical ? "bg-red-500" : hasWarning ? "bg-yellow-500" : "bg-green-500"
          const healthText = isCritical ? "Critical" : hasWarning ? "Warning" : "Healthy"

          return (
            <Card
              key={stat.vhost}
              className="border-gray-200 hover:shadow-md transition-shadow duration-200 bg-white shadow-sm"
            >
              <CardHeader className="pb-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-3 h-3 rounded-full ${healthColor} flex-shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                        <Globe className="h-5 w-5 text-gray-600 flex-shrink-0" />
                        <span className="truncate">{stat.vhost}</span>
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Updated {new Date(stat.period_end_local).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-medium ml-2 flex-shrink-0",
                      isCritical
                        ? "border-red-200 bg-red-50 text-red-700"
                        : hasWarning
                          ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                          : "border-green-200 bg-green-50 text-green-700",
                    )}
                  >
                    {healthText}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-gray-600" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Requests</span>
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">{stat.total_requests.toLocaleString()}</div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-gray-600" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">RPM</span>
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">{stat.reqs_per_min}</div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-gray-600" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">4xx Rate</span>
                    </div>
                    <div className={`text-2xl font-semibold ${stat.pct_4xx > 2 ? "text-red-600" : "text-gray-900"}`}>
                      {stat.pct_4xx}%
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-gray-600" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">5xx Rate</span>
                    </div>
                    <div className={`text-2xl font-semibold ${stat.pct_5xx > 1 ? "text-red-600" : "text-gray-900"}`}>
                      {stat.pct_5xx}%
                    </div>
                  </div>
                </div>

                {stat.rt_ms && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4" />
                      Response Time
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-xl font-semibold text-gray-900">{Math.round(stat.rt_ms.p90)}ms</div>
                        <div className="text-xs text-gray-500 font-medium">P90</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-semibold text-gray-900">{Math.round(stat.rt_ms.p99)}ms</div>
                        <div className="text-xs text-gray-500 font-medium">P99</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-700">{Math.round(stat.rt_ms.avg)}ms</div>
                        <div className="text-xs text-gray-500 font-medium">AVG</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-700">{Math.round(stat.rt_ms.max)}ms</div>
                        <div className="text-xs text-gray-500 font-medium">MAX</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">Status Codes</h4>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <StatusChart data={stat.status_counts} />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700">Top Paths</h4>
                    <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                      {stat.unique_clients} clients
                    </Badge>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    {stat.top_paths.length > 0 ? (
                      <div className="space-y-3 max-h-32 overflow-y-auto">
                        {stat.top_paths.slice(0, 5).map((path, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 truncate flex-1 mr-3 font-mono">
                              {path.key}
                            </code>
                            <Badge
                              variant="outline"
                              className="text-xs font-medium bg-gray-100 text-gray-600 border-gray-300"
                            >
                              {path.count}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">No path data available</div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3 bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
