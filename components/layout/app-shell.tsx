"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils/cn";
import { useGlobalStore } from "@/lib/store/use-global-store";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { TamLlmSidebar } from "@/components/dashboard/tam-llm-sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  closeDeal,
  deleteActiveDeal,
  getArchivedDeals,
  getCompanyProfiles,
  getDeletedDeals,
  purgeExpiredDeletedDeals,
} from "@/lib/deals/deal-lifecycle";

const navItems = [
  { label: "Executive Summaries", href: "/dashboard" },
  { label: "Documents", href: "/documents" },
  { label: "Financial Analysis", href: "/financial-analysis" },
  { label: "Risk Assessment", href: "/risk-assessment" },
  { label: "Customer Analytics", href: "/customer-analytics" },
  { label: "Reports", href: "/reports" },
  { label: "Inquiry", href: "/inquiry" },
  { label: "Notes", href: "/notes" },
  { label: "Settings", href: "/settings" },
  { label: "Deal Archive", href: "/deal-archive" },
];

function SideNav({ onNavigate, archivedId }: { onNavigate?: () => void; archivedId?: string | null }) {
  const pathname = usePathname();
  const suffix = archivedId ? `?archivedId=${encodeURIComponent(archivedId)}` : "";

  return (
    <aside className="flex h-full flex-col gap-1 p-3">
      <div className="mb-3 rounded-lg bg-primary p-3 text-primary-foreground shadow-soft">
        <p className="text-xs uppercase tracking-[0.18em]">TAM</p>
        <h1 className="text-lg font-semibold">Due Diligence OS</h1>
      </div>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={`${item.href}${suffix}`}
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
  const searchParams = useSearchParams();
  const archivedId = searchParams.get("archivedId");
  const archivedMode = !!archivedId;
  const { deal, period, basis, setDeal, setPeriod, setBasis } = useGlobalStore();
  const [dealOptions, setDealOptions] = useState<string[]>(["Project Atlas", "Project Meridian", "Project Zenith"]);
  const [archivedCloseValue, setArchivedCloseValue] = useState<string | null>(null);

  useEffect(() => {
    const readDeals = () => {
      try {
        purgeExpiredDeletedDeals();
        const raw = window.localStorage.getItem("tam-company-profiles");
        const parsed = raw ? (JSON.parse(raw) as Array<{ companyName?: string }>) : [];
        const fromProfiles = parsed
          .map((row) => row.companyName?.trim())
          .filter((name): name is string => !!name && name.length > 0);
        const archivedNames = new Set(getArchivedDeals().map((d) => d.companyName.trim().toLowerCase()));
        const deletedNames = new Set(getDeletedDeals().map((d) => d.companyName.trim().toLowerCase()));
        const defaults = ["Project Atlas", "Project Meridian", "Project Zenith"].filter(
          (name) => !archivedNames.has(name.toLowerCase()) && !deletedNames.has(name.toLowerCase())
        );
        const activeOnly = fromProfiles.filter(
          (name) => !archivedNames.has(name.toLowerCase()) && !deletedNames.has(name.toLowerCase())
        );
        const merged = Array.from(new Set([deal, ...activeOnly, ...defaults]));
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
    if (!archivedId) {
      setArchivedCloseValue(null);
      return;
    }
    const archived = getArchivedDeals().find((d) => d.id === archivedId);
    if (archived) {
      setDeal(archived.companyName);
      setArchivedCloseValue(archived.closeValue);
    } else {
      setArchivedCloseValue(null);
    }
  }, [archivedId, setDeal]);

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

  const archiveCurrentDeal = () => {
    const closeValue = window.prompt(`Enter close value for ${deal} (e.g. $185M):`, "$185M");
    if (!closeValue) return;
    const ok = window.confirm(`Close and archive ${deal} for ${closeValue}?`);
    if (!ok) return;
    closeDeal(deal, closeValue);
    const profiles = getCompanyProfiles();
    const next = profiles[0]?.companyName ?? "Project Atlas";
    setDeal(next);
    router.push("/deal-archive");
  };

  const deleteCurrentDeal = () => {
    const ok = window.confirm(`Delete ${deal} now? It will move to Recently Deleted and auto-purge in 15 days.`);
    if (!ok) return;
    deleteActiveDeal(deal);
    const profiles = getCompanyProfiles();
    const next = profiles[0]?.companyName ?? "Project Atlas";
    setDeal(next);
    router.push("/deal-archive");
  };

  if (archivedMode) {
    return (
      <div className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b bg-background/90 px-3 py-3 backdrop-blur">
        <div className="mr-auto text-sm font-semibold">
          {deal} {archivedCloseValue ? `• Closed for ${archivedCloseValue}` : ""}
        </div>
        <Button size="sm" onClick={() => router.push(`/reports?archivedId=${encodeURIComponent(archivedId ?? "")}&exportPack=true`)}>Export Pack</Button>
        <ThemeToggle />
        <Button size="sm" variant="outline" onClick={signOut}><LogOut className="mr-1 h-4 w-4" />Sign out</Button>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center gap-2 border-b bg-background/90 px-3 py-3 backdrop-blur">
      <div className="mr-auto text-sm font-semibold">Analyst Workspace</div>
      <select
        aria-label="Deal selector"
        value={deal}
        onChange={(e) => setDeal(e.target.value)}
        className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground"
      >
        {dealOptions.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <select
        aria-label="Period selector"
        value={period}
        onChange={(e) => setPeriod(e.target.value as "Monthly" | "Quarterly" | "Annual")}
        className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground"
      >
        <option>Monthly</option>
        <option>Quarterly</option>
        {/* <option>Annual</option> */}
      </select>
      <select
        aria-label="Basis selector"
        value={basis}
        onChange={(e) => setBasis(e.target.value as "Reported" | "Normalized" | "Pro Forma")}
        className="rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground"
      >
        <option>Reported</option>
        {/* <option>Normalized</option> */}
        <option>Pro Forma</option>
      </select>
      <Button size="sm" variant="outline" onClick={() => router.push("/onboarding")}>Start New Company Analysis</Button>
      <Button size="sm" variant="outline" onClick={archiveCurrentDeal}>Close Deal</Button>
      <Button size="sm" variant="outline" onClick={deleteCurrentDeal}>Delete Deal</Button>
      <Button size="sm" onClick={() => router.push("/reports?exportPack=true")}>Export Pack</Button>
      <ThemeToggle />
      <Button size="sm" variant="outline" onClick={signOut}><LogOut className="mr-1 h-4 w-4" />Sign out</Button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const archivedId = searchParams.get("archivedId");
  const [open, setOpen] = useState(false);
  const noShellRoutes = ["/welcome", "/login", "/signup", "/onboarding"];
  const hideShell = noShellRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <div className="tam-gradient min-h-screen">
      <div className="mx-auto flex w-full max-w-[1600px]">
        <div className="hidden min-h-screen w-64 shrink-0 border-r bg-card/90 md:block">
          <SideNav archivedId={archivedId} />
        </div>
        <div className="w-full">
          <div className="border-b bg-card px-3 py-2 md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="mr-1 h-4 w-4" /> Menu
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SideNav onNavigate={() => setOpen(false)} archivedId={archivedId} />
              </SheetContent>
            </Sheet>
          </div>
          <Topbar />
          <main className="p-4 md:p-6">{children}</main>
          <TamLlmSidebar />
        </div>
      </div>
    </div>
  );
}
