"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { useToast } from "@/hooks/useToast";
import AccessControl from "@/components/common/AccessControl";

interface YarnInEntry {
  id: string;
  entryDate: string;
  categoryId: string;
  categoryName: string;
  lotNo: string;
  noOfBoxes: number;
  weightInKg: number;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
}

interface YarnExEntry {
  id: string;
  entryDate: string;
  categoryId: string;
  categoryName: string;
  lotNo: string;
  takingWeightInKg: number;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
}

interface LotData {
  lotNo: string;
  totalWeight: number;
  availableWeight: number;
  inEntries: YarnInEntry[];
  exEntries: YarnExEntry[];
}

interface CategoryData {
  categoryId: string;
  categoryName: string;
  lots: Map<string, LotData>;
  totalWeight: number;
  availableWeight: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Map<string, CategoryData>>(
    new Map()
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [inEntriesRes, exEntriesRes] = await Promise.all([
        axiosInstance.get("/yarn-in-entry"),
        axiosInstance.get("/yarn-ex-entry"),
      ]);

      const inEntries: YarnInEntry[] = inEntriesRes.data.data;
      const exEntries: YarnExEntry[] = exEntriesRes.data.data;

      // Group by category, then by lot number
      const categoryMap = new Map<string, CategoryData>();

      // Process in-entries
      inEntries.forEach((entry) => {
        if (!categoryMap.has(entry.categoryId)) {
          categoryMap.set(entry.categoryId, {
            categoryId: entry.categoryId,
            categoryName: entry.categoryName,
            lots: new Map(),
            totalWeight: 0,
            availableWeight: 0,
          });
        }

        const category = categoryMap.get(entry.categoryId)!;

        if (!category.lots.has(entry.lotNo)) {
          category.lots.set(entry.lotNo, {
            lotNo: entry.lotNo,
            totalWeight: 0,
            availableWeight: 0,
            inEntries: [],
            exEntries: [],
          });
        }

        const lot = category.lots.get(entry.lotNo)!;
        lot.inEntries.push(entry);
        lot.totalWeight += entry.weightInKg;
        category.totalWeight += entry.weightInKg;
      });

      // Process ex-entries
      exEntries.forEach((entry) => {
        const category = categoryMap.get(entry.categoryId);
        if (category) {
          if (!category.lots.has(entry.lotNo)) {
            category.lots.set(entry.lotNo, {
              lotNo: entry.lotNo,
              totalWeight: 0,
              availableWeight: 0,
              inEntries: [],
              exEntries: [],
            });
          }

          const lot = category.lots.get(entry.lotNo)!;
          lot.exEntries.push(entry);
        }
      });

      // Calculate available weights
      categoryMap.forEach((category) => {
        category.lots.forEach((lot) => {
          const totalOutWeight = lot.exEntries.reduce(
            (sum, entry) => sum + entry.takingWeightInKg,
            0
          );
          lot.availableWeight = Math.max(0, lot.totalWeight - totalOutWeight);
          category.availableWeight += lot.availableWeight;
        });
      });

      setCategories(categoryMap);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to fetch dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleLotClick = (lotNo: string) => {
    router.push(`/dashboard/${encodeURIComponent(lotNo)}`);
  };

  if (loading) {
    return (
      <AccessControl>
        <div className="min-h-screen bg-background-light dark:bg-background-dark p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white dark:bg-[#1a232e] rounded-xl shadow-lg dark:shadow-none border border-slate-200 dark:border-[#324d67] p-8 text-center">
              <p className="text-slate-500 dark:text-[#92adc9]">Loading...</p>
            </div>
          </div>
        </div>
      </AccessControl>
    );
  }

  const categoryArray = Array.from(categories.values());

  if (categoryArray.length === 0) {
    return (
      <AccessControl>
        <div className="min-h-screen bg-background-light dark:bg-background-dark p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Dashboard
              </h1>
              <p className="text-slate-500 dark:text-[#92adc9]">
                View inventory by category and lot number
              </p>
            </div>
            <div className="bg-white dark:bg-[#1a232e] rounded-xl shadow-lg dark:shadow-none border border-slate-200 dark:border-[#324d67] p-8 text-center">
              <p className="text-slate-500 dark:text-[#92adc9]">
                No data available
              </p>
            </div>
          </div>
        </div>
      </AccessControl>
    );
  }

  return (
    <AccessControl>
      <div className="min-h-screen bg-background-light dark:bg-background-dark p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Dashboard
            </h1>
            <p className="text-slate-500 dark:text-[#92adc9]">
              View inventory by category and lot number
            </p>
          </div>

          {/* Category Accordions */}
          <div className="space-y-4">
            {categoryArray.map((category) => {
            const isExpanded = expandedCategories.has(category.categoryId);
            const lotsArray = Array.from(category.lots.values()).sort((a, b) =>
              a.lotNo.localeCompare(b.lotNo)
            );

            return (
              <div
                key={category.categoryId}
                className="bg-white dark:bg-[#1a232e] rounded-xl shadow-lg dark:shadow-none border border-slate-200 dark:border-[#324d67] overflow-hidden"
              >
                {/* Accordion Header */}
                <button
                  onClick={() => toggleCategory(category.categoryId)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#101922] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-left">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {category.categoryName}
                    </h2>
                    <p className="text-sm font-medium text-slate-600 dark:text-[#92adc9]">
                      Available Weight in Kgs:{" "}
                      <span className="text-slate-900 dark:text-white font-semibold">
                        {category.availableWeight.toFixed(2)} kg
                      </span>
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-slate-500 dark:text-[#92adc9] transition-transform shrink-0 ml-4">
                    {isExpanded ? "expand_less" : "expand_more"}
                  </span>
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-[#324d67]">
                    {/* Lot Numbers List */}
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {lotsArray.map((lot) => (
                          <div
                            key={lot.lotNo}
                            onClick={() => handleLotClick(lot.lotNo)}
                            className="p-4 rounded-lg border border-slate-200 dark:border-[#324d67] bg-slate-50 dark:bg-[#101922] hover:bg-slate-100 dark:hover:bg-[#0f172a] cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                {lot.lotNo}
                              </h3>
                              <span className="material-symbols-outlined text-slate-500 dark:text-[#92adc9]">
                                chevron_right
                              </span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-[#92adc9]">
                                  Available:
                                </span>
                                <span className="text-slate-900 dark:text-white font-medium">
                                  {lot.availableWeight.toFixed(2)} kg
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600 dark:text-[#92adc9]">
                                  Total:
                                </span>
                                <span className="text-slate-900 dark:text-white font-medium">
                                  {lot.totalWeight.toFixed(2)} kg
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
            })}
          </div>
        </div>
      </div>
    </AccessControl>
  );
}
