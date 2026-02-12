import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", className)}>{children}</span>;
}
