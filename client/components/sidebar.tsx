"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Key,
  Search,
  Users,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import Logo from "./logo";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, token, _hasHydrated } = useAuthStore();

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => authApi.getMe().then(res => res.data),
    enabled: !!token && _hasHydrated,
  });

  const handleLogout = () => {
    logout();
    toast.success("Logged Out Successfully")
    router.push("/");
  };

  const isOwner = user?.role === "OWNER";

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, show: true },
    { href: "/dashboard/verify", label: "Verify", icon: Search, show: true },
    { href: "/dashboard/api-keys", label: "API Keys", icon: Key, show: true },
    { href: "/dashboard/users", label: "Team", icon: Users, show: isOwner },
    { href: "/dashboard/settings", label: "Settings", icon: Settings, show: true },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col z-40">
      <Logo/>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.filter(item => item.show).map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
