"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { useToast } from "@/hooks/useToast";
import AccessControl from "@/components/common/AccessControl";
import YarnCategoryForm, {
  YarnCategory,
} from "@/components/yarn-category/YarnCategoryForm";
import YarnCategoryList from "@/components/yarn-category/YarnCategoryList";
import DeleteConfirmModal from "@/components/yarn-category/DeleteConfirmModal";

export default function YarnCategoryPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<YarnCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<YarnCategory | null>(
    null
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/yarn-category");
      setCategories(response.data.data);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to fetch yarn categories"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle form submit
  const handleSubmit = async (data: {
    name: string;
    description?: string;
    noOfCones?: number;
    weightPerBox: number;
  }) => {
    try {
      setSubmitting(true);

      if (editingCategory) {
        // Update existing category
        await axiosInstance.put(`/yarn-category/${editingCategory.id}`, data);
        toast.success("Yarn category updated successfully");
      } else {
        // Create new category
        await axiosInstance.post("/yarn-category", data);
        toast.success("Yarn category created successfully");
      }

      // Reset and close
      setShowForm(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to save yarn category"
      );
      throw error; // Re-throw to let form handle it
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (category: YarnCategory) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/yarn-category/${id}`);
      toast.success("Yarn category deleted successfully");
      setDeleteConfirm(null);
      fetchCategories();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to delete yarn category"
      );
    }
  };

  // Cancel form
  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  // Open form for new category
  const handleAddNew = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  return (
    <AccessControl>
      <div className="min-h-screen bg-background-light dark:bg-background-dark p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Yarn Category
            </h1>
            <p className="text-slate-500 dark:text-[#92adc9]">
              Manage yarn categories and their cone counts
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-blue-600 text-white font-medium transition-colors shadow-md shadow-primary/20"
          >
            <span className="material-symbols-outlined">add</span>
            <span>Add Category</span>
          </button>
        </div>

        {/* Form Modal */}
        <YarnCategoryForm
          show={showForm}
          editingCategory={editingCategory}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitting={submitting}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          show={!!deleteConfirm}
          onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
          message="Are you sure you want to delete this yarn category? All yarn in and yarn out entries under this category will also be permanently removed. This action cannot be undone."
        />

        {/* Categories List */}
        <YarnCategoryList
          categories={categories}
          loading={loading}
          onEdit={handleEdit}
          onDelete={(id) => setDeleteConfirm(id)}
        />
        </div>
      </div>
    </AccessControl>
  );
}
