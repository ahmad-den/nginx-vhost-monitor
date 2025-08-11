"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  RefreshCw,
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  Eye,
  Settings,
  Filter,
} from "lucide-react"
import { StatsCards } from "@/components/stats-cards"
import { StatsTable } from "@/components/stats-table"
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

export default function Dashboard() {
  const [stats, setStats] = useState<VhostStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [window, setWindow] = useState("1h")
  const [refresh, setRefresh] = useState("15")
  const [filter, setFilter] = useState("")
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const apiBase = typeof window !== "undefined" ? window.location.origin : ""
      let url = `${apiBase}/stats?window=${window}&tail=200000`

      if (filter) {
        url += `&vhost=${encodeURIComponent(filter)}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)

      const data = await response.json()
      setStats(Array.isArray(data) ? data : [data]) // Handle both array and single object responses
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [window, filter])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
    }

    const refreshInterval = Number.parseInt(refresh, 10)
    if (refreshInterval > 0) {
      const timer = setInterval(fetchStats, refreshInterval * 1000)
      setRefreshTimer(timer)
    }

    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer)
      }
    }
  }, [refresh, fetchStats])

  const handleRefresh = () => {
    fetchStats()
  }

  const handleClearFilter = () => {
    setFilter("")
  }

  const getStatusColor = () => {
    if (loading) return "bg-gray-300"
    if (error) return "bg-red-500"
    return "bg-green-500"
  }

  const getStatusIcon = () => {
    if (loading) return <Activity className="h-4 w-4 animate-spin" />
    if (error) return <XCircle className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  const totalRequests = stats.reduce((sum, stat) => sum + stat.total_requests, 0)
  const avgResponseTime =
    stats.length > 0 ? stats.reduce((sum, stat) => sum + (stat.rt_ms?.p90 || 0), 0) / stats.length : 0
  const errorRate =
    stats.length > 0 ? stats.reduce((sum, stat) => sum + stat.pct_4xx + stat.pct_5xx, 0) / stats.length : 0
  const uniqueClients = stats.reduce((sum, stat) => sum + stat.unique_clients, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shadow-sm">
                  <Server className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Nginx Monitor Pro</h1>
                <p className="text-sm text-gray-500">Real-time infrastructure monitoring</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-50 border border-gray-200">
                <div className={cn("w-2.5 h-2.5 rounded-full", getStatusColor())} />
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {error ? "Disconnected" : loading ? "Updating..." : "Connected"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : "Initializing..."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">System Overview</h2>
              <p className="text-gray-500">Updated {lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}</p>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
              <Activity className="h-3 w-3 mr-1" />
              Live monitoring active
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gray-50">
                    <BarChart3 className="h-6 w-6 text-gray-700" />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                    ACTIVE
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-semibold text-gray-900">{stats.length}</div>
                  <div className="text-sm font-medium text-gray-600">Virtual Hosts</div>
                  <div className="text-xs text-gray-400">Active domains</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gray-50">
                    <TrendingUp className="h-6 w-6 text-gray-700" />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                    TOTAL
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-semibold text-gray-900">{totalRequests.toLocaleString()}</div>
                  <div className="text-sm font-medium text-gray-600">Total Requests</div>
                  <div className="text-xs text-gray-400">HTTP requests</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gray-50">
                    <Users className="h-6 w-6 text-gray-700" />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                    UNIQUE
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-semibold text-gray-900">{uniqueClients.toLocaleString()}</div>
                  <div className="text-sm font-medium text-gray-600">Unique Clients</div>
                  <div className="text-xs text-gray-400">Distinct IPs</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gray-50">
                    <AlertTriangle className={cn("h-6 w-6", errorRate > 5 ? "text-red-600" : "text-gray-700")} />
                  </div>
                  <Badge
                    variant={errorRate > 5 ? "destructive" : "secondary"}
                    className={cn("text-xs", errorRate > 5 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600")}
                  >
                    {errorRate > 5 ? "CRITICAL" : errorRate > 2 ? "WARNING" : "GOOD"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className={cn("text-3xl font-semibold", errorRate > 5 ? "text-red-600" : "text-gray-900")}>
                    {errorRate.toFixed(1)}%
                  </div>
                  <div className="text-sm font-medium text-gray-600">Error Rate</div>
                  <div className="text-xs text-gray-400">4xx + 5xx errors</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gray-50">
                    <Clock className={cn("h-6 w-6", avgResponseTime > 1000 ? "text-red-600" : "text-gray-700")} />
                  </div>
                  <Badge
                    variant={avgResponseTime > 1000 ? "destructive" : "secondary"}
                    className={cn(
                      "text-xs",
                      avgResponseTime > 1000 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600",
                    )}
                  >
                    {avgResponseTime > 1000 ? "SLOW" : avgResponseTime > 500 ? "FAIR" : "FAST"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div
                    className={cn("text-3xl font-semibold", avgResponseTime > 1000 ? "text-red-600" : "text-gray-900")}
                  >
                    {Math.round(avgResponseTime)}ms
                  </div>
                  <div className="text-sm font-medium text-gray-600">Avg Response</div>
                  <div className="text-xs text-gray-400">P90 latency</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Monitoring Controls</h2>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "text-xs h-8 px-3",
                  viewMode === "grid"
                    ? "bg-black text-white hover:bg-gray-800 shadow-sm"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50",
                )}
              >
                <BarChart3 className="h-3 w-3 mr-1.5" />
                Grid
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
                className={cn(
                  "text-xs h-8 px-3",
                  viewMode === "table"
                    ? "bg-black text-white hover:bg-gray-800 shadow-sm"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50",
                )}
              >
                <Eye className="h-3 w-3 mr-1.5" />
                Table
              </Button>
            </div>
          </div>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex flex-1 gap-3">
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      Time Window
                    </label>
                    <Select value={window} onValueChange={setWindow}>
                      <SelectTrigger className="h-9 bg-white border-gray-300 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15m">Last 15 minutes</SelectItem>
                        <SelectItem value="1h">Last 1 hour</SelectItem>
                        <SelectItem value="6h">Last 6 hours</SelectItem>
                        <SelectItem value="24h">Last 24 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                      <RefreshCw className="h-3 w-3" />
                      Refresh Rate
                    </label>
                    <Select value={refresh} onValueChange={setRefresh}>
                      <SelectTrigger className="h-9 bg-white border-gray-300 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Manual</SelectItem>
                        <SelectItem value="5">Every 5s</SelectItem>
                        <SelectItem value="15">Every 15s</SelectItem>
                        <SelectItem value="30">Every 30s</SelectItem>
                        <SelectItem value="60">Every 60s</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-[2] min-w-0">
                    <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                      <Filter className="h-3 w-3" />
                      Search & Filter
                    </label>
                    <div className="relative">
                      <Input
                        placeholder="Search vhosts or use regex..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && fetchStats()}
                        className="h-9 pr-8 bg-white border-gray-300 text-sm placeholder:text-gray-400"
                      />
                      {filter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 rounded-md"
                          onClick={handleClearFilter}
                        >
                          <X className="h-3 w-3 text-gray-400" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                    <Settings className="h-3 w-3" />
                    Actions
                  </label>
                  <Button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="h-9 bg-black hover:bg-gray-800 text-white px-4 text-sm shadow-sm"
                  >
                    <RefreshCw className={cn("h-3 w-3 mr-1.5", loading && "animate-spin")} />
                    Refresh
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{stats.length}</span> vhosts
                  {filter && <span className="ml-2 text-black font-medium">• Filtered results</span>}
                </div>
                <div className="text-xs text-gray-400">Rendered in 1ms</div>
              </div>
            </CardContent>
          </Card>
        </section>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <div className="font-semibold">Connection Error</div>
                  <div className="text-sm opacity-90">{error}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {viewMode === "grid" ? (
          <StatsCards stats={stats} loading={loading} />
        ) : (
          <StatsTable stats={stats} loading={loading} />
        )}
      </div>
    </div>
  )
}
