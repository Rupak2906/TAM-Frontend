"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils/cn";
import { useGlobalStore } from "@/lib/store/use-global-store";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Documents", href: "/documents" },
  { label: "Financial Analysis", href: "/financial-analysis" },
  { label: "Risk Assessment", href: "/risk-assessment" },
  { label: "Customer Analytics", href: "/customer-analytics" },
  { label: "Reports", href: "/reports" },
  { label: "Inquiry", href: "/inquiry" },
  { label: "Notes", href: "/notes" },
  { label: "Settings", href: "/settings" },
];

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col gap-1 p-3">
      <div className="mb-3 rounded-lg bg-primary p-3 text-primary-foreground shadow-soft">
        <p className="text-xs uppercase tracking-[0.18em]">TAM</p>
        <h1 className="text-lg font-semibold">Due Diligence OS</h1>
      </div>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium text-foreground/85 hover:bg-muted",
            pathname === item.href && "bg-secondary text-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </aside>
  );
}

function Topbar() {
  const router = useRouter();
  const { deal, period, basis, setDeal, setPeriod, setBasis } = useGlobalStore();
  const [dealOptions, setDealOptions] = useState<string[]>(["Project Atlas", "Project Meridian", "Project Zenith"]);

  useEffect(() => {
    const readDeals = () => {
      try {
        const raw = window.localStorage.getItem("tam-company-profiles");
        const parsed = raw ? (JSON.parse(raw) as Array<{ companyName?: string }>) : [];
        const fromProfiles = parsed
          .map((row) => row.companyName?.trim())
          .filter((name): name is string => !!name && name.length > 0);
        const merged = Array.from(new Set([deal, ...fromProfiles, "Project Atlas", "Project Meridian", "Project Zenith"]));
        setDealOptions(merged);
      } catch {
        setDealOptions(Array.from(new Set([deal, "Project Atlas", "Project Meridian", "Project Zenith"])));
      }
    };
    readDeals();
    window.addEventListener("storage", readDeals);
    return () => window.removeEventListener("storage", readDeals);
  }, [deal]);

  useEffect(() => {
    if (period === "Annual") {
      setPeriod("Quarterly");
    }
    if (basis === "Normalized") {
      setBasis("Reported");
    }
  }, [basis, period, setBasis, setPeriod]);

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/welcome");
      router.refresh();
    }
  };

  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b bg-white/90 px-3 py-3 backdrop-blur">
      <div className="mr-auto text-sm font-semibold">Analyst Workspace</div>
      <select
        aria-label="Deal selector"
        value={deal}
        onChange={(e) => setDeal(e.target.value)}
        className="rounded-md border bg-white px-2 py-1 text-sm"
      >
        {dealOptions.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <select
        aria-label="Period selector"
        value={period}
        onChange={(e) => setPeriod(e.target.value as "Monthly" | "Quarterly" | "Annual")}
        className="rounded-md border bg-white px-2 py-1 text-sm"
      >
        <option>Monthly</option>
        <option>Quarterly</option>
        {/* <option>Annual</option> */}
      </select>
      <select
        aria-label="Basis selector"
        value={basis}
        onChange={(e) => setBasis(e.target.value as "Reported" | "Normalized" | "Pro Forma")}
        className="rounded-md border bg-white px-2 py-1 text-sm"
      >
        <option>Reported</option>
        {/* <option>Normalized</option> */}
        <option>Pro Forma</option>
      </select>
      <Button size="sm" variant="outline" onClick={() => router.push("/onboarding")}>Start New Company Analysis</Button>
      <Button size="sm" onClick={() => router.push("/reports?exportPack=true")}>Export Pack</Button>
      <Button size="sm" variant="outline" onClick={signOut}><LogOut className="mr-1 h-4 w-4" />Sign out</Button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const noShellRoutes = ["/welcome", "/login", "/signup", "/onboarding"];
  const hideShell = noShellRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <div className="tam-gradient min-h-screen">
      <div className="mx-auto flex w-full max-w-[1600px]">
        <div className="hidden h-screen w-64 shrink-0 border-r bg-white/85 md:block">
          <SideNav />
        </div>
        <div className="w-full">
          <div className="border-b bg-white px-3 py-2 md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="mr-1 h-4 w-4" /> Menu
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SideNav onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
          <Topbar />
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
