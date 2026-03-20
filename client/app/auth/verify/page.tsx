"use client";

import { useAuthStore } from "@/store/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

function VerifyContent() {
  const { token, setToken, logout, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (_hasHydrated && !token) {
      router.push("/auth/login");
    }
    if (token) {
      authApi.getMe().then(res => {
        setUserEmail(res.data.email);
        if (res.data.status !== "UNVERIFIED") {
          router.push("/dashboard");
        }
      }).catch(() => logout());
    }
  }, [_hasHydrated, token, router, logout]);

  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken && userEmail) {
      handleVerify(urlToken);
    }
  }, [searchParams, userEmail]);

  const handleVerify = async (tokenToUse: string) => {
    setVerifying(true);
    try {
      const res = await authApi.verifyEmail({ email: userEmail, token: tokenToUse });
      setToken(res.data.token);
      toast.success("Email verified!", { description: "Your account is now verified." });
      if (res.data.status === "PENDING") {
        router.push("/auth/pending");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      toast.error("Verification failed", { description: err.response?.data?.message || "Invalid or expired token" });
    } finally {
      setVerifying(false);
    }
  };

  if (!_hasHydrated || !token) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md"
    >
      <Card className="shadow-xl border-indigo-200/50 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl font-display text-indigo-900">Verify your email</CardTitle>
          <CardDescription className="text-indigo-800/70">
            We've sent a 6-digit verification code to <span className="font-semibold text-indigo-900">{userEmail}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="flex flex-col gap-2 text-center">
              <label htmlFor="otp" className="text-sm font-medium text-gray-700">Verification Code</label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            
            <Button 
              onClick={() => handleVerify(otp)} 
              disabled={verifying || otp.length !== 6}
              className="w-full h-12 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-medium"
            >
              {verifying ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Verify Account <ArrowRight className="w-5 h-5" /></>
              )}
            </Button>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-gray-500">
              Didn't receive the code? Check your spam folder or resend in 60s.
            </p>
            <Button 
              variant="ghost" 
              onClick={() => {
                logout();
                router.push("/auth/login");
              }}
              className="text-gray-400 hover:text-indigo-600"
            >
              Sign in with a different account
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>}>
      <VerifyContent />
    </Suspense>
  );
}
