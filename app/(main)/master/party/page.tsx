"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { useToast } from "@/hooks/useToast";
import PartyForm, { Party } from "@/components/party/PartyForm";
import PartyList from "@/components/party/PartyList";
import DeleteConfirmModal from "@/components/yarn-category/DeleteConfirmModal";

export default function PartyPage() {
  const toast = useToast();
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch parties
  const fetchParties = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/party");
      setParties(response.data.data);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to fetch parties"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, []);

  // Handle form submit
  const handleSubmit = async (data: {
    name: string;
    mobileNo?: string;
    emailId?: string;
  }) => {
    try {
      setSubmitting(true);

      if (editingParty) {
        // Update existing party
        await axiosInstance.put(`/party/${editingParty.id}`, data);
        toast.success("Party updated successfully");
      } else {
        // Create new party
        await axiosInstance.post("/party", data);
        toast.success("Party created successfully");
      }

      // Reset and close
      setShowForm(false);
      setEditingParty(null);
      fetchParties();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to save party"
      );
      throw error; // Re-throw to let form handle it
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (party: Party) => {
    setEditingParty(party);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/party/${id}`);
      toast.success("Party deleted successfully");
      setDeleteConfirm(null);
      fetchParties();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to delete party"
      );
    }
  };

  // Cancel form
  const handleCancel = () => {
    setShowForm(false);
    setEditingParty(null);
  };

  // Open form for new party
  const handleAddNew = () => {
    setEditingParty(null);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Party
            </h1>
            <p className="text-slate-500 dark:text-[#92adc9]">
              Manage parties and their contact information
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-blue-600 text-white font-medium transition-colors shadow-md shadow-primary/20"
          >
            <span className="material-symbols-outlined">add</span>
            <span>Add Party</span>
          </button>
        </div>

        {/* Form Modal */}
        <PartyForm
          show={showForm}
          editingParty={editingParty}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitting={submitting}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          show={!!deleteConfirm}
          onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
          message="Are you sure you want to delete this party? This action cannot be undone."
        />

        {/* Parties List */}
        <PartyList
          parties={parties}
          loading={loading}
          onEdit={handleEdit}
          onDelete={(id) => setDeleteConfirm(id)}
        />
      </div>
    </div>
  );
}

