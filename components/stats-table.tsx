"use client"

import type React from "react"
// Fixed import path for cn utility
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUpDown, Database } from "lucide-react"
import { useState } from "react"

interface VhostStats {
  vhost: string
  total_requests: number
  reqs_per_min: number
  pct_4xx: number
  pct_5xx: number
  rt_ms?: {
    p90: number
    p99: number
  }
  status_counts: Record<string, number>
  top_paths: Array<{ key: string; count: number }>
  period_end_local: string
}

interface StatsTableProps {
  stats: VhostStats[]
  loading: boolean
}

type SortField = "vhost" | "total_requests" | "reqs_per_min" | "pct_4xx" | "pct_5xx" | "p90" | "p99"
type SortDirection = "asc" | "desc"

export function StatsTable({ stats, loading }: StatsTableProps) {
  const [sortField, setSortField] = useState<SortField>("total_requests")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const sortedStats = [...stats].sort((a, b) => {
    let aValue: number | string
    let bValue: number | string

    switch (sortField) {
      case "vhost":
        aValue = a.vhost
        bValue = b.vhost
        break
      case "total_requests":
        aValue = a.total_requests
        bValue = b.total_requests
        break
      case "reqs_per_min":
        aValue = a.reqs_per_min
        bValue = b.reqs_per_min
        break
      case "pct_4xx":
        aValue = a.pct_4xx
        bValue = b.pct_4xx
        break
      case "pct_5xx":
        aValue = a.pct_5xx
        bValue = b.pct_5xx
        break
      case "p90":
        aValue = a.rt_ms?.p90 || 0
        bValue = b.rt_ms?.p90 || 0
        break
      case "p99":
        aValue = a.rt_ms?.p99 || 0
        bValue = b.rt_ms?.p99 || 0
        break
      default:
        aValue = a.total_requests
        bValue = b.total_requests
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    return sortDirection === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
  })

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer hover:bg-gray-50/50 transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1 text-gray-700 hover:text-gray-900">
        {children}
        <ArrowUpDown
          className={cn(
            "h-3 w-3 transition-all duration-200",
            sortField === field ? "opacity-100 text-black" : "opacity-40",
          )}
        />
      </div>
    </TableHead>
  )

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Database className="h-5 w-5" />
          Detailed Statistics
        </CardTitle>
        <CardDescription className="text-gray-500">
          Comprehensive view of all virtual hosts performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-200">
                <SortableHeader field="vhost">Virtual Host</SortableHeader>
                <SortableHeader field="total_requests">Requests</SortableHeader>
                <SortableHeader field="reqs_per_min">RPM</SortableHeader>
                <SortableHeader field="pct_4xx">4xx %</SortableHeader>
                <SortableHeader field="pct_5xx">5xx %</SortableHeader>
                <SortableHeader field="p90">P90 (ms)</SortableHeader>
                <SortableHeader field="p99">P99 (ms)</SortableHeader>
                <TableHead className="text-gray-700">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i} className="hover:bg-gray-50/30">
                    {[...Array(8)].map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-16 bg-gray-200" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sortedStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Database className="h-8 w-8 text-gray-300" />
                      <div>No data available</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedStats.map((stat) => {
                  const errorRate = stat.pct_4xx + stat.pct_5xx
                  const isHealthy = errorRate < 1 && (stat.rt_ms?.p90 || 0) < 500
                  const hasIssues = errorRate > 5 || (stat.rt_ms?.p90 || 0) > 1000

                  return (
                    <TableRow
                      key={stat.vhost}
                      className="hover:bg-gray-50/30 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              hasIssues ? "bg-red-500" : isHealthy ? "bg-emerald-500" : "bg-amber-500",
                            )}
                          />
                          <span className="truncate max-w-48 text-gray-900">{stat.vhost}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-gray-700">{stat.total_requests.toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-gray-700">{stat.reqs_per_min}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "font-mono",
                            stat.pct_4xx > 2 ? "text-amber-600 font-semibold" : "text-gray-700",
                          )}
                        >
                          {stat.pct_4xx}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn("font-mono", stat.pct_5xx > 1 ? "text-red-600 font-semibold" : "text-gray-700")}
                        >
                          {stat.pct_5xx}%
                        </span>
                      </TableCell>
                      <TableCell className="font-mono">
                        <span
                          className={cn(
                            "text-gray-700",
                            (stat.rt_ms?.p90 || 0) > 1000 ? "text-red-600 font-semibold" : "",
                          )}
                        >
                          {stat.rt_ms?.p90 || 0}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono">
                        <span
                          className={cn(
                            "text-gray-700",
                            (stat.rt_ms?.p99 || 0) > 2000 ? "text-red-600 font-semibold" : "",
                          )}
                        >
                          {stat.rt_ms?.p99 || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={hasIssues ? "destructive" : isHealthy ? "default" : "secondary"}
                          className={cn(
                            "text-xs font-medium",
                            hasIssues
                              ? "bg-red-100 text-red-700 border-red-200"
                              : isHealthy
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : "bg-amber-100 text-amber-700 border-amber-200",
                          )}
                        >
                          {hasIssues ? "Issues" : isHealthy ? "Healthy" : "Warning"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
