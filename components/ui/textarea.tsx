import { cn } from "@/lib/utils/cn";
import type { TextareaHTMLAttributes } from "react";

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("min-h-44 w-full rounded-md border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30", props.className)} />;
}
