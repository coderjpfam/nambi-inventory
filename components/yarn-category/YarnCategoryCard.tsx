"use client";

import { YarnCategory } from "./YarnCategoryForm";

interface YarnCategoryCardProps {
  category: YarnCategory;
  onEdit: (category: YarnCategory) => void;
  onDelete: (id: string) => void;
}

export default function YarnCategoryCard({
  category,
  onEdit,
  onDelete,
}: YarnCategoryCardProps) {
  return (
    <div className="bg-white dark:bg-[#1a232e] rounded-xl shadow-lg dark:shadow-none border border-slate-200 dark:border-[#324d67] p-6 hover:shadow-xl transition-shadow">
      {/* Card Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 truncate overflow-hidden text-ellipsis whitespace-nowrap">
          {category.name}
        </h3>
        {category.description && (
          <p className="text-sm text-slate-500 dark:text-[#92adc9] line-clamp-2 overflow-hidden text-ellipsis whitespace-nowrap">
            {category.description}
          </p>
        )}
      </div>

      {/* Card Body */}
      <div className="space-y-3 mb-4">
        {/* Number of Cones */}
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 dark:text-[#64748b] text-lg flex-shrink-0">
            inventory_2
          </span>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-xs text-slate-500 dark:text-[#92adc9]">
              Number of Cones
            </p>
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate overflow-hidden text-ellipsis whitespace-nowrap">
              {category.noOfCones ?? "—"}
            </p>
          </div>
        </div>

        {/* Weight Per Box */}
        {category.weightPerBox !== undefined && (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 dark:text-[#64748b] text-lg flex-shrink-0">
              scale
            </span>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-xs text-slate-500 dark:text-[#92adc9]">
                Weight Per Box
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate overflow-hidden text-ellipsis whitespace-nowrap">
                {category.weightPerBox.toFixed(3)}
              </p>
            </div>
          </div>
        )}

        {/* Is Regular */}
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 dark:text-[#64748b] text-lg flex-shrink-0">
            check_circle
          </span>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-xs text-slate-500 dark:text-[#92adc9]">
              Is Regular
            </p>
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate overflow-hidden text-ellipsis whitespace-nowrap">
              {category.isRegular ? "Yes" : "No"}
            </p>
          </div>
        </div>

        {/* Created By */}
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 dark:text-[#64748b] text-lg flex-shrink-0">
            person
          </span>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-xs text-slate-500 dark:text-[#92adc9]">
              Created By
            </p>
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate overflow-hidden text-ellipsis whitespace-nowrap">
              {category.createdByName || category.createdBy}
            </p>
          </div>
        </div>

        {/* Created At */}
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 dark:text-[#64748b] text-lg flex-shrink-0">
            calendar_today
          </span>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-xs text-slate-500 dark:text-[#92adc9]">
              Created At
            </p>
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate overflow-hidden text-ellipsis whitespace-nowrap">
              {new Date(category.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Card Footer - Action Buttons */}
      <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-[#324d67]">
        <button
          onClick={() => onEdit(category)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-primary dark:border-blue-400 hover:bg-primary/10 dark:hover:bg-primary/20 text-primary dark:text-blue-400 transition-colors font-medium"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
          <span>Edit</span>
        </button>
        <button
          onClick={() => onDelete(category.id)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors font-medium"
        >
          <span className="material-symbols-outlined text-lg">delete</span>
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}


