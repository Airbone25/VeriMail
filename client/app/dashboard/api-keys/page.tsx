"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiKeyApi, authApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Key, Plus, Trash2, Copy, Check, Loader2, ArrowLeft, ShieldAlert, Lock } from "lucide-react";
import Link from "next/link";

export default function ApiKeysPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { token, _hasHydrated } = useAuthStore();
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Auth & Role protection
  const { data: me, isLoading: isLoadingMe } = useQuery({
    queryKey: ["me"],
    queryFn: () => authApi.getMe().then(res => res.data),
    enabled: !!token,
  });

  useEffect(() => {
    if (_hasHydrated && !token) router.push("/auth/login");
  }, [token, _hasHydrated, router]);

  const { data: keys, isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: () => apiKeyApi.getKeys().then(res => res.data),
    enabled: !!me,
  });

  const isOwner = me?.role === "OWNER";

  const createMutation = useMutation({
    mutationFn: () => apiKeyApi.createKey(),
    onSuccess: (res) => {
      setNewKey(res.data.apiKey);
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API Key generated successfully");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to generate API key";
      toast.error(msg);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiKeyApi.revokeKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API Key revoked");
    },
    onError: () => toast.error("Failed to revoke key"),
  });

  const copyToClipboard = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard");
    }
  };

  if (isLoading || isLoadingMe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-2xl font-display font-bold text-blue-950">API Keys</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Role: <Badge variant="outline" className="text-[10px] py-0 h-4 uppercase">{me?.role}</Badge>
            </p>
          </div>
        </div>
        
        {isOwner && (
          <Button 
            onClick={() => createMutation.mutate()} 
            disabled={createMutation.isPending}
            className="gap-2 shadow-lg shadow-primary/20"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Generate New Key
          </Button>
        )}
      </div>

      {!isOwner && (
        <Card className="border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="flex items-center gap-3 pt-6 text-sm text-amber-900/80">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <p>You have <strong>read-only access</strong> to API keys. Only organization owners can generate or revoke keys.</p>
          </CardContent>
        </Card>
      )}

      {newKey && (
        <Card className="border-blue-200 bg-blue-50/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
              <ShieldAlert className="w-5 h-5 text-blue-600" />
              Your New API Key
            </CardTitle>
            <CardDescription className="text-blue-800/70">
              Copy this key now. For security reasons, you won&apos;t be able to see it again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-3 bg-white border border-blue-200 rounded-lg shadow-sm">
              <code className="flex-1 font-mono text-sm text-blue-900 overflow-x-auto whitespace-nowrap">
                {newKey}
              </code>
              <Button size="sm" variant="ghost" onClick={copyToClipboard} className="text-blue-600 hover:text-blue-700 hover:bg-blue-100">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            <CardTitle>Active Keys</CardTitle>
          </div>
          <CardDescription>All keys have full access to your organization&apos;s API credits.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y border rounded-lg overflow-hidden">
            {keys?.map((key: any) => (
              <div key={key.id} className="flex items-center justify-between p-4 bg-card hover:bg-muted/30 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-muted-foreground">
                      vm_sk_••••••••••••••••
                    </code>
                    <Badge variant="outline" className="text-[10px] h-5">Secret Key</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created on {new Date(key.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                {isOwner && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => {
                      if (confirm("Are you sure? This will immediately disable any applications using this key.")) {
                        revokeMutation.mutate(key.id);
                      }
                    }}
                    className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                    disabled={revokeMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Revoke
                  </Button>
                )}
              </div>
            ))}
            {keys?.length === 0 && (
              <div className="p-10 text-center text-muted-foreground">
                <Key className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>No API keys generated yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
