"use client";

import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, RefreshCcw, LogOut, Building2, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

export default function PendingApprovalPage() {
  const { token, logout, setToken, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [updatingOrg, setUpdatingOrg] = useState(false);
  const [requestingAgain, setRequestingAgain] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userStatus, setUserStatus] = useState<string | null>(null);

  useEffect(() => {
    if (_hasHydrated && !token) {
      router.push("/auth/login");
    }
    if (token) {
      authApi.getMe().then(res => setUserStatus(res.data.status)).catch(() => logout());
    }
  }, [_hasHydrated, token, router, logout]);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await authApi.getMe();
      setUserStatus(res.data.status);
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

  const handleUpdateOrg = async () => {
    if (!newOrgName.trim()) return;
    setUpdatingOrg(true);
    try {
      const res = await authApi.updateOrg({ org_name: newOrgName });
      setToken(res.data.token);
      setUserStatus(res.data.status);
      setIsDialogOpen(false);
      if (res.data.status === "ACTIVE") {
        toast.success("Organization created", { description: "You are now the owner of " + newOrgName });
        router.push("/dashboard");
      } else {
        toast.success("Request sent", { description: "Request to join " + newOrgName + " sent." });
      }
    } catch (err: any) {
      toast.error("Failed to update organization", { description: err.response?.data?.message || "Unknown error" });
    } finally {
      setUpdatingOrg(false);
    }
  };

  const handleRequestAgain = async () => {
    setRequestingAgain(true);
    try {
      const res = await authApi.requestAccess();
      setToken(res.data.token);
      setUserStatus(res.data.status);
      toast.success("Request resent", { description: "Your access request has been sent again." });
    } catch (err: any) {
      toast.error("Failed to resend request", { description: err.response?.data?.message || "Unknown error" });
    } finally {
      setRequestingAgain(false);
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
            <Clock className={`w-8 h-8 text-amber-600 ${userStatus !== "DECLINED" ? 'animate-pulse' : ''}`} />
          </div>
          <CardTitle className="text-2xl font-display text-amber-900">
            {userStatus === "DECLINED" ? "Access Declined" : "Waiting for Approval"}
          </CardTitle>
          <CardDescription className="text-amber-800/70">
            {userStatus === "DECLINED" 
              ? "Your request to join this organization was declined." 
              : "Your membership request has been sent to the organization administrator."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="bg-white/50 rounded-lg p-4 text-sm text-amber-900/80 border border-amber-200/50">
            <p>
              {userStatus === "DECLINED"
                ? "You can request access again if this was a mistake, or join a different organization."
                : "Once an admin approves your request, you'll be able to access the dashboard and start verifying emails."}
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            {userStatus === "DECLINED" ? (
              <Button 
                onClick={handleRequestAgain} 
                disabled={requestingAgain}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <UserPlus className={`w-4 h-4 ${requestingAgain ? 'animate-spin' : ''}`} />
                Request access again
              </Button>
            ) : (
              <Button 
                onClick={checkStatus} 
                disabled={checking}
                className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <RefreshCcw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                Check status
              </Button>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full gap-2 border-amber-200 text-amber-900 hover:bg-amber-100">
                  <Building2 className="w-4 h-4" />
                  Join different organization
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Organization</DialogTitle>
                  <DialogDescription>
                    Enter the name of the organization you want to join. If it doesn&apos;t exist, a new one will be created.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Acme Corp"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleUpdateOrg} disabled={updatingOrg || !newOrgName.trim()}>
                    {updatingOrg ? "Updating..." : "Update Request"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
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
