"use client";

import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { authApi, orgApi } from "@/lib/api";
import { motion, Variants } from "framer-motion";
import {
  CheckCircle2, XCircle, Activity, Key,
  ArrowUpRight, Zap, Shield, AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function DashboardPage() {
  const { token, logout, _hasHydrated } = useAuthStore();
  const router = useRouter();

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["me"],
    queryFn: () => authApi.getMe().then(res => res.data),
    enabled: !!token && _hasHydrated,
  });

  const { data: org } = useQuery({
    queryKey: ["org"],
    queryFn: () => orgApi.get().then(res => res.data),
    enabled: !!token && _hasHydrated && user?.role === "OWNER",
  });

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ["org-stats"],
    queryFn: () => orgApi.getStats().then(res => res.data),
    enabled: !!token && _hasHydrated && user?.role === "OWNER",
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: recentLogs } = useQuery({
    queryKey: ["recent-logs"],
    queryFn: () => orgApi.getRecentLogs().then(res => res.data),
    enabled: !!token && _hasHydrated && user?.role === "OWNER",
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  useEffect(() => {
    async function verifyStatus() {
      if (_hasHydrated) {
        if (!token) {
          router.push("/auth/login");
          return;
        }

        try {
          const res = await authApi.getMe();
          if (res.data.status === "PENDING") {
            router.push("/auth/pending");
          } else if (res.data.status === "DECLINED") {
            toast.error("Account declined", { description: "Please contact your administrator." });
            logout();
            router.push("/auth/login");
          }
        } catch (err) {
          logout();
          router.push("/auth/login");
        }
      }
    }
    verifyStatus();
  }, [_hasHydrated, token, router, logout]);

  if (!_hasHydrated || isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 grid-bg">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!token) return null;

  const stats = [
    { label: "Total Verifications", value: statsData?.total?.toLocaleString() || "0", icon: Activity, color: "text-primary" },
    { label: "Valid Emails", value: statsData?.valid?.toLocaleString() || "0", icon: CheckCircle2, color: "text-emerald-500" },
    { label: "Invalid / Rejected", value: statsData?.invalid?.toLocaleString() || "0", icon: XCircle, color: "text-red-500" },
    { label: "API Calls Today", value: statsData?.today?.toLocaleString() || "0", icon: Zap, color: "text-amber-500" },
  ];

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSec < 60) return `${diffInSec}s ago`;
    const diffInMin = Math.floor(diffInSec / 60);
    if (diffInMin < 60) return `${diffInMin}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const usageLimit = org?.plan?.requestLimit || 1000;
  const usagePercent = Math.min(100, ((statsData?.total || 0) / usageLimit) * 100);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 p-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">
            Good morning{user ? `, ${user.orgName}` : ""}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your email verifications.
          </p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {org?.plan?.name || "Free"} Plan
        </Badge>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-display font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                <span className="text-xs text-emerald-600 font-medium">Lifetime stats</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Chart */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle>Verification Activity</CardTitle>
            <CardDescription>Email verifications over the past 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full">
              {statsData?.daily && statsData.daily.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={statsData.daily}>
                    <defs>
                      <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 12 }} 
                      stroke="hsl(var(--muted-foreground))" 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }} 
                      stroke="hsl(var(--muted-foreground))" 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone" dataKey="verified" stroke="#4f46e5"
                      fill="url(#colorVerified)" strokeWidth={2} name="Valid"
                    />
                    <Area
                      type="monotone" dataKey="failed" stroke="#ef4444"
                      fill="url(#colorFailed)" strokeWidth={2} name="Failed"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                    <Activity className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">No activity data yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent checks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Verifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLogs && recentLogs.length > 0 ? (
              recentLogs.map((log: any, i: number) => (
                <div key={log.id} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0 pb-2">
                  <div className="flex items-center gap-2">
                    {log.is_valid ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    )}
                    <span className="text-sm font-mono text-muted-foreground truncate max-w-[180px] md:max-w-[250px]">
                        {log.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={log.is_valid ? "secondary" : "destructive"}
                      className="text-[10px] px-1.5 py-0 h-4 capitalize"
                    >
                      {log.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{formatTime(log.created_at)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-center text-muted-foreground py-8">No recent verifications</p>
            )}
          </CardContent>
        </Card>

        {/* Plan usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Usage</CardTitle>
            <CardDescription>Current billing cycle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">API Requests</span>
                <span className="font-medium">{statsData?.total?.toLocaleString() || 0} / {usageLimit.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${usagePercent}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>{org?.plan?.name || 'Free'} Plan</span>
                </div>
                <a href="/dashboard/settings" className="text-xs text-primary hover:underline font-medium">
                  Upgrade →
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
