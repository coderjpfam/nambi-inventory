"use client";

import { useState, useEffect } from "react";

export interface YarnCategory {
  id: string;
  name: string;
  description?: string;
  noOfCones?: number;
  weightPerBox?: number;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  description: string;
  noOfCones: string;
  weightPerBox: string;
}

interface FormErrors {
  name: string;
  noOfCones: string;
  weightPerBox: string;
}

function parseWeightPerBoxValue(weightStr: string): number {
  const trimmed = weightStr.trim();
  const parsed = parseFloat(trimmed);
  const decimalPart = trimmed.includes(".") ? trimmed.split(".")[1] : "";

  if (decimalPart.length === 0 || decimalPart.length < 2) {
    return parseFloat(parsed.toFixed(2));
  }

  return parsed;
}

interface YarnCategoryFormProps {
  show: boolean;
  editingCategory: YarnCategory | null;
  onSubmit: (data: {
    name: string;
    description?: string;
    noOfCones?: number;
    weightPerBox: number;
  }) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

export default function YarnCategoryForm({
  show,
  editingCategory,
  onSubmit,
  onCancel,
  submitting,
}: YarnCategoryFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    noOfCones: "",
    weightPerBox: "36.00",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({
    name: "",
    noOfCones: "",
    weightPerBox: "",
  });

  // Update form data when editing
  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        description: editingCategory.description || "",
        noOfCones:
          editingCategory.noOfCones !== undefined
            ? String(editingCategory.noOfCones)
            : "",
        weightPerBox:
          editingCategory.weightPerBox !== undefined
            ? editingCategory.weightPerBox.toFixed(3)
            : "36.00",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        noOfCones: "",
        weightPerBox: "36.00",
      });
    }
    setFormErrors({ name: "", noOfCones: "", weightPerBox: "" });
  }, [editingCategory, show]);

  // Handle form input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "noOfCones") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
    } else if (name === "weightPerBox") {
      // Allow only numbers and decimal point
      const numericValue = value.replace(/[^0-9.]/g, "");
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {
      name: "",
      noOfCones: "",
      weightPerBox: "",
    };

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (formData.noOfCones.trim() !== "") {
      const conesValue = Number(formData.noOfCones);
      if (isNaN(conesValue) || conesValue < 0) {
        errors.noOfCones = "Number of cones must be a non-negative number";
      }
    }

    // Validate weightPerBox if provided (if empty, will default to 36)
    if (formData.weightPerBox && formData.weightPerBox.trim() !== "") {
      const weightValue = parseFloat(formData.weightPerBox);
      if (isNaN(weightValue) || weightValue < 0) {
        errors.weightPerBox =
          "Weight per box must be a valid non-negative number";
      } else {
        const weightStr = formData.weightPerBox;
        const decimalPart = weightStr.includes(".") ? weightStr.split(".")[1] : "";
        if (decimalPart.length > 3) {
          errors.weightPerBox =
            "Weight per box must have at most 3 decimal places";
        }
      }
    }

    setFormErrors(errors);
    return !errors.name && !errors.noOfCones && !errors.weightPerBox;
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    let weightPerBoxValue: number;
    if (formData.weightPerBox && formData.weightPerBox.trim() !== "") {
      weightPerBoxValue = parseWeightPerBoxValue(formData.weightPerBox);
    } else {
      weightPerBoxValue = 36;
    }

    await onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      ...(formData.noOfCones.trim() !== "" && {
        noOfCones: Number(formData.noOfCones),
      }),
      weightPerBox: weightPerBoxValue,
    });
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1a232e] rounded-xl shadow-xl border border-slate-200 dark:border-[#324d67] w-full max-w-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            {editingCategory ? "Edit Category" : "Add New Category"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-[#324d67] bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter category name"
              />
              <div className="min-h-[20px]">
                {formErrors.name && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                    {formErrors.name}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-[#324d67] bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Enter description"
              />
            </div>

            {/* Number of Cones */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">
                Number of Cones (Optional)
              </label>
              <input
                type="text"
                name="noOfCones"
                value={formData.noOfCones}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-[#324d67] bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 6"
              />
              <div className="min-h-[20px]">
                {formErrors.noOfCones && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                    {formErrors.noOfCones}
                  </p>
                )}
              </div>
            </div>

            {/* Weight Per Box */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">
                Weight Per Box (Optional)
              </label>
              <input
                type="text"
                name="weightPerBox"
                value={formData.weightPerBox}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-[#324d67] bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 36, 1.00, or 1.000"
              />
              <div className="min-h-[20px]">
                {formErrors.weightPerBox && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                    {formErrors.weightPerBox}
                  </p>
                )}
                {!formErrors.weightPerBox && (
                  <p className="text-xs text-slate-500 dark:text-[#92adc9] mt-1">
                    Whole numbers or 1 decimal place are padded to 2 (e.g., 36 → 36.00, 1.5 → 1.50)
                  </p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-[#324d67] bg-slate-50 dark:bg-[#101922] text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-[#0f172a] transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 rounded-lg bg-primary hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? "Saving..."
                  : editingCategory
                  ? "Update"
                  : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


