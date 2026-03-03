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

// Mock chart data
const usageData = [
  { day: "Mon", verified: 240, failed: 18 },
  { day: "Tue", verified: 380, failed: 22 },
  { day: "Wed", verified: 290, failed: 15 },
  { day: "Thu", verified: 520, failed: 31 },
  { day: "Fri", verified: 610, failed: 28 },
  { day: "Sat", verified: 180, failed: 9 },
  { day: "Sun", verified: 120, failed: 7 },
];

const stats = [
  { label: "Total Verifications", value: "2,340", delta: "+18%", icon: Activity, color: "text-primary" },
  { label: "Valid Emails", value: "2,158", delta: "+15%", icon: CheckCircle2, color: "text-emerald-500" },
  { label: "Invalid / Rejected", value: "182", delta: "-3%", icon: XCircle, color: "text-red-500" },
  { label: "API Calls Today", value: "342", delta: "+42%", icon: Zap, color: "text-amber-500" },
];

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
                <span className="text-xs text-emerald-600 font-medium">{stat.delta} this week</span>
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
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usageData}>
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
            {[
              { email: "user@gmail.com", status: "valid", time: "2m ago" },
              { email: "test@mailinator.com", status: "disposable", time: "5m ago" },
              { email: "invalid@nodomain.xyz", status: "invalid", time: "12m ago" },
              { email: "contact@stripe.com", status: "valid", time: "18m ago" },
              { email: "no-reply@tempmail.com", status: "disposable", time: "31m ago" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  {item.status === "valid" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : item.status === "disposable" ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  )}
                  <span className="text-sm font-mono text-muted-foreground">{item.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={item.status === "valid" ? "secondary" : item.status === "disposable" ? "outline" : "destructive"}
                    className="text-xs"
                  >
                    {item.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
              </div>
            ))}
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
                <span className="font-medium">2,340 / 5,000</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "46.8%" }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">API Keys</span>
                <span className="font-medium">1 / 3</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-orange-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "33%" }}
                  transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
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
