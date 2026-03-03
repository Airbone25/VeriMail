"use client";

import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, RefreshCcw, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

export default function PendingApprovalPage() {
  const { token, logout, setHasHydrated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (_hasHydrated && !token) {
      router.push("/auth/login");
    }
  }, [_hasHydrated, token, router]);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await authApi.getMe();
      if (res.data.status === "ACTIVE") {
        toast.success("Account approved!", { description: "You now have full access." });
        router.push("/dashboard");
      } else if (res.data.status === "DECLINED") {
        toast.error("Account declined", { description: "Please contact your organization administrator." });
      } else {
        toast.info("Still pending", { description: "Your request is still waiting for approval." });
      }
    } catch (err) {
      toast.error("Failed to check status");
    } finally {
      setChecking(false);
    }
  };

  if (!_hasHydrated || !token) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md"
    >
      <Card className="shadow-xl border-amber-200/50 bg-amber-50/10 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-600 animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-display text-amber-900">Waiting for Approval</CardTitle>
          <CardDescription className="text-amber-800/70">
            Your membership request has been sent to the organization administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="bg-white/50 rounded-lg p-4 text-sm text-amber-900/80 border border-amber-200/50">
            <p>Once an admin approves your request, you&apos;ll be able to access the dashboard and start verifying emails.</p>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={checkStatus} 
              disabled={checking}
              className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <RefreshCcw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              Check status
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => {
                logout();
                router.push("/auth/login");
              }}
              className="w-full gap-2 text-amber-900/60 hover:text-amber-900 hover:bg-amber-100"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
