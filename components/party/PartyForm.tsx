"use client";

import { useState, useEffect } from "react";

export interface Party {
  id: string;
  name: string;
  mobileNo?: string;
  emailId?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  mobileNo: string;
  emailId: string;
}

interface FormErrors {
  name: string;
  mobileNo: string;
  emailId: string;
}

interface PartyFormProps {
  show: boolean;
  editingParty: Party | null;
  onSubmit: (data: {
    name: string;
    mobileNo?: string;
    emailId?: string;
  }) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

export default function PartyForm({
  show,
  editingParty,
  onSubmit,
  onCancel,
  submitting,
}: PartyFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    mobileNo: "",
    emailId: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({
    name: "",
    mobileNo: "",
    emailId: "",
  });

  // Update form data when editing
  useEffect(() => {
    if (editingParty) {
      setFormData({
        name: editingParty.name,
        mobileNo: editingParty.mobileNo || "",
        emailId: editingParty.emailId || "",
      });
    } else {
      setFormData({
        name: "",
        mobileNo: "",
        emailId: "",
      });
    }
    setFormErrors({ name: "", mobileNo: "", emailId: "" });
  }, [editingParty, show]);

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

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
      mobileNo: "",
      emailId: "",
    };

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (formData.emailId.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.emailId.trim())) {
        errors.emailId = "Invalid email format";
      }
    }

    setFormErrors(errors);
    return !errors.name && !errors.mobileNo && !errors.emailId;
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit({
      name: formData.name.trim(),
      ...(formData.mobileNo.trim() && { mobileNo: formData.mobileNo.trim() }),
      ...(formData.emailId.trim() && { emailId: formData.emailId.trim() }),
    });
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1a232e] rounded-xl shadow-xl border border-slate-200 dark:border-[#324d67] w-full max-w-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            {editingParty ? "Edit Party" : "Add New Party"}
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
                placeholder="Enter party name"
              />
              <div className="min-h-[20px]">
                {formErrors.name && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                    {formErrors.name}
                  </p>
                )}
              </div>
            </div>

            {/* Mobile No */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">
                Mobile No (Optional)
              </label>
              <input
                type="tel"
                name="mobileNo"
                value={formData.mobileNo}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-[#324d67] bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter mobile number"
              />
              <div className="min-h-[20px]">
                {formErrors.mobileNo && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                    {formErrors.mobileNo}
                  </p>
                )}
              </div>
            </div>

            {/* Email ID */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">
                Email ID (Optional)
              </label>
              <input
                type="email"
                name="emailId"
                value={formData.emailId}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-[#324d67] bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter email address"
              />
              <div className="min-h-[20px]">
                {formErrors.emailId && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                    {formErrors.emailId}
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
                  : editingParty
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


