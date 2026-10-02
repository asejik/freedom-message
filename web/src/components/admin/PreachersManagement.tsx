"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { Loader2, CheckCircle2, AlertCircle, Plus, Edit3, Trash2, Check, Users } from "lucide-react";
import type { Preacher } from "@/types/database";

export function PreachersManagementForm() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  const { data: preachersList, refetch, isLoading } = useQuery<Preacher[]>({
    queryKey: ['admin', 'preachers-management'],
    queryFn: async () => {
      const { data, error } = await supabase.from('preachers').select('*').order('name');
      if (error) throw error;
      return (data ?? []) as Preacher[];
    }
  });

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsCreating(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/preachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add preacher");
      }
      const json = await res.json();
      setStatus({
        type: 'success',
        msg: json.existed
          ? `"${newName.trim()}" already exists in the database!`
          : `Preacher "${newName.trim()}" added successfully!`
      });
      setNewName("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ['admin', 'preachers-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats-preachers-count'] });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (id: string, name: string) => {
    setEditingId(id);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/preachers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update preacher");
      }
      setStatus({ type: 'success', msg: `Preacher updated to "${name}" successfully!` });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['admin', 'preachers-dropdown'] });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete preacher "${name}"? Sermons by this preacher will remain in the database.`)) {
      return;
    }
    setDeletingId(id);
    setStatus(null);
    try {
      const res = await fetch(`/api/admin/preachers?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete preacher");
      }
      setStatus({ type: 'success', msg: `Preacher "${name}" deleted.` });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['admin', 'preachers-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats-preachers-count'] });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = (preachersList || []).filter(p => p.name.toLowerCase().includes(searchFilter.toLowerCase()));

  return (
    <div className="space-y-8">
      {status && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-red-500/10 text-red-400 border border-red-500/25'}`}>
          {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{status.msg}</span>
        </div>
      )}

      {/* Add New Preacher Form */}
      <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 shadow-sm">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Plus size={18} className="text-blue-400" />
          Add New Preacher
        </h3>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <input
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              type="text"
              placeholder="e.g. Pastor Temitope Areo, Apostle Muyiwa Areo, Guest Minister..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder:text-white/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isCreating || !newName.trim()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium px-6 py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-blue-500/25 shrink-0"
          >
            {isCreating && <Loader2 size={16} className="animate-spin" />}
            <span>Add Preacher</span>
          </button>
        </form>
      </div>

      {/* Preachers List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-white">All Preachers ({preachersList?.length || 0})</h3>
            <p className="text-xs text-white/50">Manage minister profiles, edit names, or add guest ministers.</p>
          </div>
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search preachers..."
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder:text-white/30 outline-none w-full sm:w-64 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-blue-400" size={24} /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {filtered.map(p => (
              <PreacherItemRow
                key={p.id}
                preacher={p}
                onSave={handleUpdate}
                onDelete={handleDelete}
                isSaving={editingId === p.id}
                isDeleting={deletingId === p.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PreacherItemRow({
  preacher,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: {
  preacher: Preacher;
  onSave: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
  isSaving: boolean;
  isDeleting: boolean;
}) {
  const [name, setName] = useState(preacher.name);
  const [isEditing, setIsEditing] = useState(false);
  const hasChanged = name.trim() !== preacher.name;

  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
          <Users size={16} />
        </div>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setIsEditing(false);
                  if (hasChanged) onSave(preacher.id, name.trim());
                }
                if (e.key === 'Escape') {
                  setName(preacher.name);
                  setIsEditing(false);
                }
              }}
              className="w-full bg-white/5 border border-blue-500/60 rounded-lg px-2.5 py-1 text-sm text-white outline-none ring-1 ring-blue-500/30"
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 text-left group w-full truncate"
              title="Click to edit name"
            >
              <span className="text-sm font-medium text-white truncate">{name}</span>
              {hasChanged && <span className="text-[10px] text-amber-400 font-bold shrink-0">(unsaved)</span>}
              <Edit3 size={12} className="text-white/30 group-hover:text-blue-400 transition-colors shrink-0 ml-1" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {hasChanged && (
          <button
            onClick={() => onSave(preacher.id, name.trim())}
            disabled={isSaving}
            className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            title="Save name"
          >
            {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          </button>
        )}
        <button
          onClick={() => onDelete(preacher.id, preacher.name)}
          disabled={isDeleting}
          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors disabled:opacity-50"
          title="Delete preacher"
        >
          {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      </div>
    </div>
  );
}
