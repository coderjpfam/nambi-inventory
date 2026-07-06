"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { useToast } from "@/hooks/useToast";
import CustomSelect from "@/components/common/CustomSelect";
import CustomDatePicker from "@/components/common/CustomDatePicker";
import {
  syncBoxesFromWeight,
  syncWeightFromBoxes,
} from "@/lib/yarn-regular-calc";

interface YarnCategory {
  id: string;
  name: string;
  weightPerBox: number;
}

interface AvailableLot {
  lotNo: string;
  availableBoxes: number;
  availableWeightInKg: number;
}

export default function YarnOutPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<YarnCategory[]>([]);
  const [availableLots, setAvailableLots] = useState<AvailableLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLots, setLoadingLots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().split("T")[0],
    categoryId: "",
    lotNo: "",
    availableNoOfBoxes: "",
    availableWeightInKg: "",
    isFullBox: false,
    takingNoOfBoxes: "",
    takingWeightInKg: "",
  });
  const [formErrors, setFormErrors] = useState({
    categoryId: "",
    lotNo: "",
    takingNoOfBoxes: "",
    takingWeightInKg: "",
  });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/yarn-category");
        setCategories(response.data.data);
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Failed to fetch categories"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch available lots when category changes
  useEffect(() => {
    const fetchAvailableLots = async () => {
      if (!formData.categoryId) {
        setAvailableLots([]);
        setFormData((prev) => ({
          ...prev,
          lotNo: "",
          availableNoOfBoxes: "",
          availableWeightInKg: "",
          takingNoOfBoxes: "",
          takingWeightInKg: "",
          isFullBox: false,
        }));
        return;
      }

      try {
        setLoadingLots(true);
        const response = await axiosInstance.get(
          `/yarn-in-entry/available-lots?categoryId=${formData.categoryId}`
        );
        setAvailableLots(response.data.data);
        
        // Reset lotNo if current selection is not in new list
        if (formData.lotNo) {
          const lotExists = response.data.data.some(
            (lot: AvailableLot) => lot.lotNo === formData.lotNo
          );
          if (!lotExists) {
            setFormData((prev) => ({
              ...prev,
              lotNo: "",
              availableNoOfBoxes: "",
              availableWeightInKg: "",
            }));
          }
        }
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Failed to fetch available lots"
        );
        setAvailableLots([]);
      } finally {
        setLoadingLots(false);
      }
    };

    fetchAvailableLots();
  }, [formData.categoryId]);

  const getCategoryWeightPerBox = (categoryId: string) =>
    categories.find((cat) => cat.id === categoryId)?.weightPerBox ?? 0;

  const shouldSyncFullBox = (isFullBox: boolean, categoryId: string) =>
    isFullBox && getCategoryWeightPerBox(categoryId) > 0;

  // Update available quantities when lotNo changes
  useEffect(() => {
    if (formData.lotNo) {
      const selectedLot = availableLots.find(
        (lot) => lot.lotNo === formData.lotNo
      );
      if (selectedLot) {
        setFormData((prev) => ({
          ...prev,
          availableNoOfBoxes: selectedLot.availableBoxes.toString(),
          availableWeightInKg: selectedLot.availableWeightInKg.toFixed(3),
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        availableNoOfBoxes: "",
        availableWeightInKg: "",
      }));
    }
  }, [formData.lotNo, availableLots]);

  // Handle form input change
  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: string } }
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === "checkbox" && name === "isFullBox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => {
        const next = { ...prev, isFullBox: checked };
        const weightPerBox = getCategoryWeightPerBox(prev.categoryId);
        if (checked && weightPerBox > 0) {
          if (prev.takingNoOfBoxes !== "") {
            next.takingWeightInKg = syncWeightFromBoxes(
              prev.takingNoOfBoxes,
              weightPerBox
            );
          } else if (prev.takingWeightInKg !== "") {
            next.takingNoOfBoxes = syncBoxesFromWeight(
              prev.takingWeightInKg,
              weightPerBox
            );
          }
        }
        return next;
      });
      return;
    }

    if (name === "takingWeightInKg") {
      // Allow only numbers and decimal point, max 3 decimal places
      const numericValue = value.replace(/[^0-9.]/g, "");
      const parts = numericValue.split(".");
      if (parts.length > 2) return; // Only one decimal point
      if (parts[1] && parts[1].length > 3) return; // Max 3 decimal places
      setFormData((prev) => {
        const weightPerBox = getCategoryWeightPerBox(prev.categoryId);
        const canSync = shouldSyncFullBox(prev.isFullBox, prev.categoryId);
        return {
          ...prev,
          takingWeightInKg: numericValue,
          ...(canSync
            ? {
                takingNoOfBoxes: syncBoxesFromWeight(
                  numericValue,
                  weightPerBox
                ),
              }
            : {}),
        };
      });
    } else if (name === "takingNoOfBoxes") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => {
        const weightPerBox = getCategoryWeightPerBox(prev.categoryId);
        const canSync = shouldSyncFullBox(prev.isFullBox, prev.categoryId);
        return {
          ...prev,
          takingNoOfBoxes: numericValue,
          ...(canSync
            ? {
                takingWeightInKg: syncWeightFromBoxes(
                  numericValue,
                  weightPerBox
                ),
              }
            : {}),
        };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors = {
      categoryId: "",
      lotNo: "",
      takingNoOfBoxes: "",
      takingWeightInKg: "",
    };

    if (!formData.categoryId) {
      errors.categoryId = "Category is required";
    }

    if (!formData.lotNo) {
      errors.lotNo = "Lot number is required";
    }

    if (!formData.takingWeightInKg || Number(formData.takingWeightInKg) <= 0) {
      errors.takingWeightInKg = "Taking weight in kg must be greater than 0";
    } else {
      // Check decimal places (max 3)
      const weightStr = formData.takingWeightInKg;
      const decimalPart = weightStr.includes(".") ? weightStr.split(".")[1] : "";
      if (decimalPart.length > 3) {
        errors.takingWeightInKg =
          "Taking weight in kg must have at most 3 decimal places";
      }

      // Check if taking weight exceeds available weight
      const availableWeight = parseFloat(formData.availableWeightInKg || "0");
      const takingWeight = parseFloat(formData.takingWeightInKg);
      if (takingWeight > availableWeight) {
        errors.takingWeightInKg =
          `Taking weight cannot exceed available weight (${availableWeight.toFixed(3)} kg)`;
      }
    }

    setFormErrors(errors);
    return (
      !errors.categoryId &&
      !errors.lotNo &&
      !errors.takingNoOfBoxes &&
      !errors.takingWeightInKg
    );
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      await axiosInstance.post("/yarn-ex-entry", {
        entryDate: formData.entryDate,
        categoryId: formData.categoryId,
        lotNo: formData.lotNo.trim(),
        takingWeightInKg: Number(formData.takingWeightInKg),
      });

      toast.success("Yarn ex entry created successfully");

      // Reset form
      setFormData({
        entryDate: new Date().toISOString().split("T")[0],
        categoryId: "",
        lotNo: "",
        availableNoOfBoxes: "",
        availableWeightInKg: "",
        isFullBox: false,
        takingNoOfBoxes: "",
        takingWeightInKg: "",
      });
      setFormErrors({
        categoryId: "",
        lotNo: "",
        takingNoOfBoxes: "",
        takingWeightInKg: "",
      });
      setAvailableLots([]);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to create yarn ex entry"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4 md:p-8">
        <div className="max-w-7xl w-full">
          <div className="bg-white dark:bg-[#1a232e] rounded-xl shadow-lg dark:shadow-none border border-slate-200 dark:border-[#324d67] p-8 text-center">
            <p className="text-slate-500 dark:text-[#92adc9]">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4 md:p-8">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Yarn Out Entry
          </h1>
          <p className="text-slate-500 dark:text-[#92adc9]">
            Add new yarn out entry
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-[#1a232e] rounded-xl shadow-lg dark:shadow-none border border-slate-200 dark:border-[#324d67] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Entry Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">
                  Entry Date <span className="text-red-500">*</span>
                </label>
                <CustomDatePicker
                  name="entryDate"
                  value={formData.entryDate}
                  onChange={() => {}} // No-op since it's disabled
                  disabled={true}
                />
                <p className="text-xs text-slate-500 dark:text-[#92adc9] mt-1">
                  Today's date (not editable)
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={(e) => {
                    const { name, value } = e.target;
                    setFormData((prev) => ({
                      ...prev,
                      [name]: value,
                      lotNo: "",
                      availableNoOfBoxes: "",
                      availableWeightInKg: "",
                      isFullBox: false,
                      takingNoOfBoxes: "",
                      takingWeightInKg: "",
                    }));
                    if (formErrors[name as keyof typeof formErrors]) {
                      setFormErrors((prev) => ({
                        ...prev,
                        [name]: "",
                      }));
                    }
                  }}
                  options={categories.map((cat) => ({
                    value: cat.id,
                    label: cat.name,
                  }))}
                  placeholder="Select Category"
                  error={formErrors.categoryId}
                />
              </div>

              {/* Lot No */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">
                  Lot No <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  name="lotNo"
                  value={formData.lotNo}
                  onChange={(e) => {
                    const { name, value } = e.target;
                    setFormData((prev) => ({
                      ...prev,
                      [name]: value,
                    }));
                    if (formErrors[name as keyof typeof formErrors]) {
                      setFormErrors((prev) => ({
                        ...prev,
                        [name]: "",
                      }));
                    }
                  }}
                  options={availableLots.map((lot) => ({
                    value: lot.lotNo,
                    label: `${lot.lotNo} (${lot.availableBoxes} boxes, ${lot.availableWeightInKg.toFixed(3)} kg)`,
                  }))}
                  placeholder={
                    loadingLots
                      ? "Loading lots..."
                      : !formData.categoryId
                      ? "Select category first"
                      : availableLots.length === 0
                      ? "No available lots"
                      : "Select Lot No"
                  }
                  error={formErrors.lotNo}
                  disabled={!formData.categoryId || loadingLots}
                />
              </div>

              {/* Is Full Box */}
              <div className="col-span-full flex items-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    name="isFullBox"
                    checked={formData.isFullBox}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-slate-300 dark:border-[#324d67] text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-white">
                    Is Full Box
                  </span>
                </label>
              </div>

              {/* Available Number of Boxes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">
                  Available No. of Boxes
                </label>
                <input
                  type="text"
                  value={formData.availableNoOfBoxes}
                  disabled
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-[#324d67] bg-slate-100 dark:bg-[#0f172a] text-slate-500 dark:text-[#64748b] cursor-not-allowed"
                  placeholder="0"
                />
              </div>

              {/* Available Weight in Kg */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">
                  Available Weight in Kg
                </label>
                <input
                  type="text"
                  value={formData.availableWeightInKg}
                  disabled
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-[#324d67] bg-slate-100 dark:bg-[#0f172a] text-slate-500 dark:text-[#64748b] cursor-not-allowed"
                  placeholder="0.000"
                />
              </div>

              {/* Taking Number of Boxes */}
              {formData.isFullBox && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">
                    Taking No. of Boxes
                  </label>
                  <input
                    type="text"
                    name="takingNoOfBoxes"
                    value={formData.takingNoOfBoxes}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-[#324d67] bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0"
                  />
                  <div className="min-h-[20px]">
                    {formErrors.takingNoOfBoxes && (
                      <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                        {formErrors.takingNoOfBoxes}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Taking Weight in Kg */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">
                  Taking Weight in Kg <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="takingWeightInKg"
                  value={formData.takingWeightInKg}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-[#324d67] bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.000"
                />
                <div className="min-h-[20px]">
                  {formErrors.takingWeightInKg && (
                    <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                      {formErrors.takingWeightInKg}
                    </p>
                  )}
                  {!formErrors.takingWeightInKg && (
                    <p className="text-xs text-slate-500 dark:text-[#92adc9] mt-1">
                      Maximum 3 decimal places
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 rounded-lg bg-primary hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">
                      refresh
                    </span>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">add</span>
                    <span>Generate Program</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

