"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, orgApi } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  CreditCard, 
  User, 
  Shield, 
  Save, 
  CheckCircle2, 
  ArrowRight,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("organization");
  const { token, _hasHydrated } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch User & Org Data
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => authApi.getMe().then(res => res.data),
    enabled: !!token && _hasHydrated,
  });

  const { data: org, isLoading: isLoadingOrg } = useQuery({
    queryKey: ["org"],
    queryFn: () => orgApi.get().then(res => res.data),
    enabled: !!token && _hasHydrated && user?.role === "OWNER",
  });

  const [orgName, setOrgName] = useState("");

  // Update Org Name Mutation
  const updateOrgMutation = useMutation({
    mutationFn: (name: string) => orgApi.update({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Organization updated successfully");
    },
    onError: () => {
      toast.error("Failed to update organization");
    }
  });

  const handleUpdateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    updateOrgMutation.mutate(orgName);
  };

  const isOwner = user?.role === "OWNER";

  const tabs = [
    { id: "organization", label: "Organization", icon: Building2, show: isOwner },
    { id: "billing", label: "Billing & Plan", icon: CreditCard, show: isOwner },
    { id: "profile", label: "My Profile", icon: User, show: true },
  ];

  const container = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and organization preferences.</p>
      </div>

      <div className="flex gap-2 border-b border-border pb-px">
        {tabs.filter(t => t.show).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all relative ${
              activeTab === tab.id 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab" 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" 
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "organization" && (
          <motion.div key="org" variants={container} initial="hidden" animate="show" exit={{ opacity: 0, y: -10 }}>
            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>Update your organization's public information.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateOrg} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <div className="flex gap-3">
                      <Input 
                        id="orgName" 
                        placeholder={org?.name || "Enter organization name"}
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="max-w-md"
                      />
                      <Button type="submit" disabled={updateOrgMutation.isPending || !orgName.trim()}>
                        {updateOrgMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === "billing" && (
          <motion.div key="billing" variants={container} initial="hidden" animate="show" exit={{ opacity: 0, y: -10 }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>You are currently on the {org?.plan?.name || 'Free'} plan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full text-primary">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{org?.plan?.name || 'Free'} Plan</p>
                        <p className="text-xs text-muted-foreground">Renewed monthly</p>
                      </div>
                    </div>
                    <Badge variant={org?.plan?.name === 'Pro' ? 'default' : 'secondary'}>Active</Badge>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Plan Features</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Up to 5,000 monthly verifications
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        3 API Keys
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Team management (Members/Owners)
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary text-primary-foreground border-none shadow-xl shadow-primary/20 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Shield className="w-24 h-24" />
                </div>
                <CardHeader>
                  <CardTitle className="text-primary-foreground">Upgrade to Pro</CardTitle>
                  <CardDescription className="text-primary-foreground/80">Get higher limits and advanced features.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                  <div className="text-3xl font-bold">$49<span className="text-sm font-normal opacity-80">/mo</span></div>
                  <Button variant="secondary" className="w-full gap-2">
                    Upgrade Now
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === "profile" && (
          <motion.div key="profile" variants={container} initial="hidden" animate="show" exit={{ opacity: 0, y: -10 }}>
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your personal account details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Email Address</Label>
                    <p className="text-sm font-medium">{user?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Role</Label>
                    <div className="flex">
                      <Badge variant="outline" className="capitalize">{user?.role.toLowerCase()}</Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Organization</Label>
                    <p className="text-sm font-medium">{user?.orgName}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Account Status</Label>
                    <div className="flex">
                      <Badge variant="secondary" className="capitalize">{user?.status.toLowerCase()}</Badge>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <h4 className="text-sm font-medium mb-4">Security</h4>
                  <Button variant="outline" disabled>Change Password (Coming Soon)</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
