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

interface Party {
  id: string;
  name: string;
}

interface YarnInEntry {
  id: string;
  entryDate: string;
  categoryId: string;
  categoryName: string;
  lotNo: string;
  partyId: string;
  partyName: string;
  noOfBoxes: number;
  weightInKg: number;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export default function YarnInPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<YarnCategory[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().split("T")[0],
    categoryId: "",
    lotNo: "",
    partyId: "",
    isFullBox: false,
    noOfBoxes: "",
    weightInKg: "",
  });
  const [formErrors, setFormErrors] = useState({
    categoryId: "",
    lotNo: "",
    partyId: "",
    noOfBoxes: "",
    weightInKg: "",
  });

  // Fetch categories and parties
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesRes, partiesRes] = await Promise.all([
          axiosInstance.get("/yarn-category"),
          axiosInstance.get("/party"),
        ]);
        setCategories(categoriesRes.data.data);
        setParties(partiesRes.data.data);
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Failed to fetch data"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCategoryWeightPerBox = (categoryId: string) =>
    categories.find((cat) => cat.id === categoryId)?.weightPerBox ?? 0;

  const shouldSyncFullBox = (isFullBox: boolean, categoryId: string) =>
    isFullBox && getCategoryWeightPerBox(categoryId) > 0;

  // Handle form input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | { target: { name: string; value: string } }
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === "checkbox" && name === "isFullBox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => {
        const next = { ...prev, isFullBox: checked };
        const weightPerBox = getCategoryWeightPerBox(prev.categoryId);
        if (checked && weightPerBox > 0) {
          if (prev.noOfBoxes !== "") {
            next.weightInKg = syncWeightFromBoxes(prev.noOfBoxes, weightPerBox);
          } else if (prev.weightInKg !== "") {
            next.noOfBoxes = syncBoxesFromWeight(prev.weightInKg, weightPerBox);
          }
        }
        return next;
      });
      return;
    }

    if (name === "weightInKg") {
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
          weightInKg: numericValue,
          ...(canSync
            ? {
                noOfBoxes: syncBoxesFromWeight(numericValue, weightPerBox),
              }
            : {}),
        };
      });
    } else if (name === "noOfBoxes") {
      // Allow only numbers
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => {
        const weightPerBox = getCategoryWeightPerBox(prev.categoryId);
        const canSync = shouldSyncFullBox(prev.isFullBox, prev.categoryId);
        return {
          ...prev,
          noOfBoxes: numericValue,
          ...(canSync
            ? {
                weightInKg: syncWeightFromBoxes(numericValue, weightPerBox),
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
      partyId: "",
      noOfBoxes: "",
      weightInKg: "",
    };

    if (!formData.categoryId) {
      errors.categoryId = "Category is required";
    }

    if (!formData.lotNo.trim()) {
      errors.lotNo = "Lot number is required";
    }

    if (!formData.partyId) {
      errors.partyId = "Party is required";
    }

    if (!formData.noOfBoxes || Number(formData.noOfBoxes) <= 0) {
      errors.noOfBoxes = "Number of boxes must be greater than 0";
    }

    if (!formData.weightInKg || Number(formData.weightInKg) <= 0) {
      errors.weightInKg = "Weight in kg must be greater than 0";
    } else {
      // Check decimal places (max 3)
      const weightStr = formData.weightInKg;
      const decimalPart = weightStr.includes(".") ? weightStr.split(".")[1] : "";
      if (decimalPart.length > 3) {
        errors.weightInKg = "Weight in kg must have at most 3 decimal places";
      }
    }

    setFormErrors(errors);
    return !errors.categoryId && !errors.lotNo && !errors.partyId && !errors.noOfBoxes && !errors.weightInKg;
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      await axiosInstance.post("/yarn-in-entry", {
        entryDate: formData.entryDate,
        categoryId: formData.categoryId,
        lotNo: formData.lotNo.trim(),
        partyId: formData.partyId,
        noOfBoxes: Number(formData.noOfBoxes),
        weightInKg: Number(formData.weightInKg),
      });

      toast.success("Yarn in entry created successfully");

      // Reset form
      setFormData({
        entryDate: new Date().toISOString().split("T")[0],
        categoryId: "",
        lotNo: "",
        partyId: "",
        isFullBox: false,
        noOfBoxes: "",
        weightInKg: "",
      });
      setFormErrors({
        categoryId: "",
        lotNo: "",
        partyId: "",
        noOfBoxes: "",
        weightInKg: "",
      });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to create yarn in entry"
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
            Yarn In Entry
          </h1>
          <p className="text-slate-500 dark:text-[#92adc9]">
            Add new yarn in entry
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
                  onChange={() => { }} // No-op since it's disabled
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
                    setFormData((prev) => {
                      const next = { ...prev, [name]: value };
                      const weightPerBox = categories.find(
                        (cat) => cat.id === value
                      )?.weightPerBox ?? 0;
                      if (prev.isFullBox && weightPerBox > 0) {
                        if (prev.noOfBoxes !== "") {
                          next.weightInKg = syncWeightFromBoxes(
                            prev.noOfBoxes,
                            weightPerBox
                          );
                        } else if (prev.weightInKg !== "") {
                          next.noOfBoxes = syncBoxesFromWeight(
                            prev.weightInKg,
                            weightPerBox
                          );
                        }
                      }
                      return next;
                    });
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

              {/* Party */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">
                  Party <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  name="partyId"
                  value={formData.partyId}
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
                  options={parties.map((party) => ({
                    value: party.id,
                    label: party.name,
                  }))}
                  placeholder="Select Party"
                  error={formErrors.partyId}
                />
              </div>

              {/* Lot No */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">
                  Lot No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lotNo"
                  value={formData.lotNo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-[#324d67] bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter lot number"
                />
                <div className="min-h-[20px]">
                  {formErrors.lotNo && (
                    <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                      {formErrors.lotNo}
                    </p>
                  )}
                </div>
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

              {/* Number of Boxes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">
                  Number of Boxes <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="noOfBoxes"
                  value={formData.noOfBoxes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-[#324d67] bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0"
                />
                <div className="min-h-[20px]">
                  {formErrors.noOfBoxes && (
                    <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                      {formErrors.noOfBoxes}
                    </p>
                  )}
                </div>
              </div>

              {/* Weight in Kg */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">
                  Weight in Kg <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="weightInKg"
                  value={formData.weightInKg}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-[#324d67] bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.000"
                />
                <div className="min-h-[20px]">
                  {formErrors.weightInKg && (
                    <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                      {formErrors.weightInKg}
                    </p>
                  )}
                  {!formErrors.weightInKg && (
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
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">add</span>
                    <span>Add Entry</span>
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

