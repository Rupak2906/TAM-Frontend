"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Period = "Monthly" | "Quarterly" | "Annual";
type Basis = "Reported" | "Normalized" | "Pro Forma";

type GlobalState = {
  deal: string;
  period: Period;
  basis: Basis;
  selectedMetricId: string | null;
  reportDraft: string[];
  notes: string;
  setDeal: (deal: string) => void;
  setPeriod: (period: Period) => void;
  setBasis: (basis: Basis) => void;
  setSelectedMetricId: (id: string | null) => void;
  addReportDraft: (snippet: string) => void;
  setNotes: (value: string) => void;
};

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set, get) => ({
      deal: "Project Atlas",
      period: "Monthly",
      basis: "Reported",
      selectedMetricId: null,
      reportDraft: [],
      notes: "",
      setDeal: (deal) => set({ deal }),
      setPeriod: (period) => set({ period }),
      setBasis: (basis) => set({ basis }),
      setSelectedMetricId: (selectedMetricId) => set({ selectedMetricId }),
      addReportDraft: (snippet) => {
        const current = get().reportDraft;
        set({ reportDraft: [...current, snippet] });
      },
      setNotes: (value) => set({ notes: value }),
    }),
    { name: "tam-global-state" }
  )
);
