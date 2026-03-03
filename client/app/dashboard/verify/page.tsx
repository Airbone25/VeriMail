"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { verifyApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Search, ArrowLeft, ShieldCheck, Mail, Database, Ban, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function VerificationPlaygroundPage() {
  const [email, setEmail] = useState("");

  const mutation = useMutation({
    mutationFn: (email: string) => verifyApi.verifyEmail(email).then(res => res.data),
    onError: (err: any) => {
      if (err.response?.status === 403) {
        toast.error("Limit Reached", {
          description: "You have reached your monthly verification limit."
        });
      } else {
        toast.error(err.response?.data?.message || "Failed to verify email");
      }
    },
  });

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter an email address");
    mutation.mutate(email);
  };

  const result = mutation.data;
  const error = mutation.error as any;
  const isLimitReached = error?.response?.status === 403;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-display font-bold text-blue-950">Verification Playground</h1>
      </div>

      <Card className="border-blue-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Test an Email</CardTitle>
          <CardDescription>Enter an email address to see our verification engine in action.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleVerify} className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="user@example.com" 
                className="pl-9 h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLimitReached}
              />
            </div>
            <Button type="submit" size="lg" disabled={mutation.isPending || isLimitReached} className="gap-2 px-8">
              {mutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Verify
            </Button>
          </form>

          {isLimitReached && (
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-center gap-3 text-red-800">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-semibold">Monthly Limit Reached</p>
                        <p className="text-xs opacity-80">Please upgrade your plan to continue verifying emails.</p>
                    </div>
                </div>
                <Link href="/dashboard/settings">
                    <Button variant="destructive" size="sm" className="gap-1">
                        Upgrade
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {result && !isLimitReached && (
        <div className="space-y-6">
          <Card className={`border-2 ${result.deliverable ? 'border-emerald-500/20 bg-emerald-50/10' : 'border-red-500/20 bg-red-50/10'}`}>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${result.deliverable ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {result.deliverable ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-blue-950">{result.email}</h2>
                    <p className={`font-medium ${result.deliverable ? 'text-emerald-700' : 'text-red-700'}`}>
                      {result.deliverable ? 'Email is Deliverable' : 'Email is Not Deliverable'}
                    </p>
                  </div>
                </div>
                <Badge variant={result.deliverable ? 'default' : 'destructive'} className="text-sm px-4 py-1 h-fit">
                  {result.reason}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <CheckCard 
              label="Syntax" 
              status={result.syntax} 
              desc="RFC 5322 format" 
              icon={<ShieldCheck className="w-4 h-4" />} 
            />
            <CheckCard 
              label="MX Records" 
              status={result.mx} 
              desc="Domain can receive" 
              icon={<Database className="w-4 h-4" />} 
            />
            <CheckCard 
              label="Disposable" 
              status={!result.disposable} 
              desc="Temporary provider" 
              icon={<Ban className="w-4 h-4" />} 
              invert
            />
            <CheckCard 
              label="Corporate" 
              status={!result.freeProvider} 
              desc="Business domain" 
              icon={<Mail className="w-4 h-4" />} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CheckCard({ label, status, desc, icon, invert = false }: { label: string, status: boolean, desc: string, icon: any, invert?: boolean }) {
  const isValid = status;
  return (
    <Card className="shadow-sm border-blue-50">
      <CardContent className="p-4 pt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            {icon}
          </div>
          {isValid ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
        </div>
        <p className="font-semibold text-sm text-blue-950">{label}</p>
        <p className="text-[10px] text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}
