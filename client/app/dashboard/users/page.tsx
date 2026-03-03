"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orgApi, authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserCheck, UserX, Loader2, ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";

export default function ManageUsersPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { token, _hasHydrated, logout } = useAuthStore();

  // Protect route - only for Owners
  const { data: me, isLoading: isLoadingMe } = useQuery({
    queryKey: ["me"],
    queryFn: () => authApi.getMe().then(res => res.data),
    enabled: !!token,
  });

  useEffect(() => {
    if (_hasHydrated && !token) router.push("/auth/login");
    if (me && me.role !== "OWNER") {
      toast.error("Unauthorized", { description: "Only organization owners can access this page." });
      router.push("/dashboard");
    }
  }, [me, token, _hasHydrated, router]);

  const { data: users, isLoading } = useQuery({
    queryKey: ["org-users"],
    queryFn: () => orgApi.getUsers().then(res => res.data),
    enabled: me?.role === "OWNER",
  });

  const approveMutation = useMutation({
    mutationFn: (userId: string) => orgApi.approveUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-users"] });
      toast.success("User approved successfully");
    },
    onError: () => toast.error("Failed to approve user"),
  });

  const declineMutation = useMutation({
    mutationFn: (userId: string) => orgApi.declineUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-users"] });
      toast.success("User declined successfully");
    },
    onError: () => toast.error("Failed to decline user"),
  });

  if (isLoading || isLoadingMe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-display font-bold">Organization Users</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <CardTitle>Team Members</CardTitle>
          </div>
          <CardDescription>Manage your organization&apos;s members and pending requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto rounded-lg border">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b font-medium">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users?.map((user: any) => (
                  <tr key={user.id} className="bg-card hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{user.email}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="capitalize">
                        {user.role.toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={user.status === "ACTIVE" ? "default" : user.status === "PENDING" ? "outline" : "destructive"}
                        className="bg-opacity-10"
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.status === "PENDING" && (
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="xs" 
                            variant="outline" 
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                            onClick={() => approveMutation.mutate(user.id)}
                            disabled={approveMutation.isPending}
                          >
                            <UserCheck className="w-3.5 h-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="xs" 
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => declineMutation.mutate(user.id)}
                            disabled={declineMutation.isPending}
                          >
                            <UserX className="w-3.5 h-3.5 mr-1" />
                            Decline
                          </Button>
                        </div>
                      )}
                      {user.status === "ACTIVE" && user.role !== "OWNER" && (
                         <Button 
                            size="xs" 
                            variant="ghost"
                            className="text-muted-foreground hover:text-red-600"
                            onClick={() => declineMutation.mutate(user.id)}
                            disabled={declineMutation.isPending}
                          >
                            Revoke Access
                         </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {users?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                      No users found in this organization.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
