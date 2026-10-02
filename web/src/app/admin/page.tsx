"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { Sparkles, Plus, Edit3, X, BookOpen, Layers, Users } from "lucide-react";
import type { SermonWithRelations } from "@/types/database";
import { SermonsListManager } from "@/components/admin/SermonsListManager";
import { SermonForm } from "@/components/admin/SermonForm";
import { SeriesManagementForm } from "@/components/admin/SeriesManagement";
import { PreachersManagementForm } from "@/components/admin/PreachersManagement";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"sermons" | "add" | "series" | "preachers">("sermons");
  const [editingSermon, setEditingSermon] = useState<SermonWithRelations | null>(null);
  const supabase = createClient();

  // Quick stats
  const { data: totalSermonsCount } = useQuery<number>({
    queryKey: ['admin', 'stats-sermons-count'],
    queryFn: async () => {
      const { count } = await supabase.from('sermons').select('*', { count: 'exact', head: true });
      return count || 0;
    }
  });

  const { data: totalSeriesCount } = useQuery<number>({
    queryKey: ['admin', 'stats-series-count'],
    queryFn: async () => {
      const { count } = await supabase.from('series').select('*', { count: 'exact', head: true });
      return count || 0;
    }
  });

  const { data: totalPreachersCount } = useQuery<number>({
    queryKey: ['admin', 'stats-preachers-count'],
    queryFn: async () => {
      const { count } = await supabase.from('preachers').select('*', { count: 'exact', head: true });
      return count || 0;
    }
  });

  return (
    <div className="container py-5 sm:py-8 md:py-10 max-w-6xl mx-auto px-3.5 sm:px-4 md:px-6 space-y-6 sm:space-y-8 text-white">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-white/[0.04] via-white/[0.02] to-transparent p-4 sm:p-6 rounded-2xl border border-white/10 shadow-lg">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Sermon Administration
          </h1>
          <p className="text-white/60 mt-1 text-xs md:text-sm max-w-xl font-normal">
            Manage your audio library catalog, edit metadata, add preachers, upload series artwork, and run on-demand AI content enrichment.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingSermon(null);
            setActiveTab("add");
          }}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs md:text-sm transition-all shadow-md shadow-blue-500/20 shrink-0"
        >
          <Plus size={16} />
          <span>Add New Sermon</span>
        </button>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-[#0f1013]/90 border border-white/10 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-sm">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <BookOpen size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-white/50 font-normal uppercase tracking-wider truncate">Messages</p>
            <p className="text-base sm:text-lg font-bold text-white mt-0.5">{totalSermonsCount !== undefined ? totalSermonsCount.toLocaleString() : "..."}</p>
          </div>
        </div>

        <div className="bg-[#0f1013]/90 border border-white/10 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-sm">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Layers size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-white/50 font-normal uppercase tracking-wider truncate">Series</p>
            <p className="text-base sm:text-lg font-bold text-white mt-0.5">{totalSeriesCount !== undefined ? totalSeriesCount.toLocaleString() : "..."}</p>
          </div>
        </div>

        <div className="bg-[#0f1013]/90 border border-white/10 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-sm">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Users size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-white/50 font-normal uppercase tracking-wider truncate">Preachers</p>
            <p className="text-base sm:text-lg font-bold text-white mt-0.5">{totalPreachersCount !== undefined ? totalPreachersCount.toLocaleString() : "..."}</p>
          </div>
        </div>

        <div className="bg-[#0f1013]/90 border border-white/10 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-sm">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Sparkles size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-white/50 font-normal uppercase tracking-wider truncate">AI Engine</p>
            <p className="text-xs font-medium text-emerald-400 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-[#0f1013] border border-white/10 rounded-2xl w-full sm:w-max overflow-x-auto hide-scrollbar shadow-inner">
        <button
          onClick={() => {
            setEditingSermon(null);
            setActiveTab("sermons");
          }}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "sermons"
              ? "bg-blue-600/25 text-blue-300 border border-blue-500/40 shadow-sm"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <BookOpen size={14} />
          <span>Sermon Catalog</span>
        </button>

        <button
          onClick={() => {
            setEditingSermon(null);
            setActiveTab("add");
          }}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "add"
              ? "bg-blue-600/25 text-blue-300 border border-blue-500/40 shadow-sm"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Plus size={14} />
          <span>{editingSermon ? "Edit Sermon" : "Add New Sermon"}</span>
        </button>

        <button
          onClick={() => {
            setEditingSermon(null);
            setActiveTab("series");
          }}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "series"
              ? "bg-blue-600/25 text-blue-300 border border-blue-500/40 shadow-sm"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Layers size={14} />
          <span>Series & Thumbnails</span>
        </button>

        <button
          onClick={() => {
            setEditingSermon(null);
            setActiveTab("preachers");
          }}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "preachers"
              ? "bg-blue-600/25 text-blue-300 border border-blue-500/40 shadow-sm"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Users size={14} />
          <span>Preachers</span>
        </button>
      </div>

      {/* Tab Content Panels */}
      <div className="bg-[#0c0d10]/95 backdrop-blur-xl rounded-2xl p-3.5 sm:p-6 border border-white/10 shadow-2xl">
        {activeTab === "sermons" && (
          <SermonsListManager onEdit={(sermon) => setEditingSermon(sermon)} />
        )}

        {activeTab === "add" && (
          <SermonForm
            initialData={editingSermon || undefined}
            onSuccess={() => {
              setActiveTab("sermons");
              setEditingSermon(null);
            }}
            onCancel={() => {
              setActiveTab("sermons");
              setEditingSermon(null);
            }}
          />
        )}

        {activeTab === "series" && <SeriesManagementForm />}

        {activeTab === "preachers" && <PreachersManagementForm />}
      </div>

      {/* Edit Sermon Modal */}
      {editingSermon && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#101115] border border-white/15 rounded-3xl p-6 md:p-8 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <div className="flex justify-between items-center pb-4 mb-6 border-b border-white/10 sticky top-0 bg-[#101115]/95 backdrop-blur-md z-10">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Edit3 className="text-blue-400" size={20} />
                  Edit Sermon Properties
                </h2>
                <p className="text-xs text-white/50 mt-0.5">ID: {editingSermon.id}</p>
              </div>
              <button
                onClick={() => setEditingSermon(null)}
                className="text-white/60 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <SermonForm
              initialData={editingSermon}
              onSuccess={() => setEditingSermon(null)}
              onCancel={() => setEditingSermon(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ALL SERMONS LIST & MANAGEMENT COMPONENT
// =============================================================================

// =============================================================================
// UNIFIED SERMON FORM COMPONENT (ADD & EDIT WITH 1-CLICK AUTO-ENRICHMENT)
// =============================================================================

// =============================================================================
// SERIES & THUMBNAIL MANAGEMENT FORM COMPONENT
// =============================================================================

// =============================================================================
// PREACHERS MANAGEMENT FORM COMPONENT
// =============================================================================

