"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Music, 
  ChevronLeft, 
  ChevronRight, 
  Image as ImageIcon,
  X,
  BookOpen,
  Layers,
  Check,
  Radio,
  FileCheck2,
  Calendar,
  Users,
  UserCheck
} from "lucide-react";
import type { Preacher, Series, SermonWithRelations } from "@/types/database";
import { compressImageClient } from "@/utils/image";

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

function SermonsListManager({ onEdit }: { onEdit: (sermon: SermonWithRelations) => void }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const queryClient = useQueryClient();
  const limit = 20;

  const { data, isLoading, refetch } = useQuery<{ data: SermonWithRelations[]; count: number; page: number }>({
    queryKey: ['admin', 'sermons', search, page],
    queryFn: async () => {
      const url = new URL('/api/admin/sermons', window.location.origin);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', limit.toString());
      if (search.trim()) url.searchParams.set('search', search.trim());
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch sermons");
      return res.json();
    }
  });

  const totalPages = data?.count ? Math.ceil(data.count / limit) : 1;

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) return;

    setDeletingId(id);
    setActionStatus(null);
    try {
      const res = await fetch(`/api/admin/sermons?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete sermon");
      }
      setActionStatus({ type: 'success', msg: `Sermon "${title}" was successfully deleted.` });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['sermons'] });
    } catch (err: any) {
      setActionStatus({ type: 'error', msg: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {actionStatus && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${actionStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-red-500/10 text-red-400 border border-red-500/25'}`}>
          {actionStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{actionStatus.msg}</span>
        </div>
      )}

      {/* Table Header & Search Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Catalog Archives</h2>
          <p className="text-xs text-white/50">
            Showing <span className="font-semibold text-white">{data?.count ?? 0}</span> sermons total
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search titles..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Sermons Data Table */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-white/50">
          <Loader2 className="animate-spin mb-3 text-blue-400" size={32} />
          <p className="text-sm font-medium">Loading sermon catalog...</p>
        </div>
      ) : data?.data && data.data.length > 0 ? (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-left text-sm table-fixed">
            <colgroup>
              <col className="w-auto" />
              <col className="w-32 lg:w-44 hidden md:table-column" />
              <col className="w-36 lg:w-48 hidden lg:table-column" />
              <col className="w-28 hidden sm:table-column" />
              <col className="w-20" />
            </colgroup>
            <thead className="bg-white/[0.04] text-white/45 text-[10px] font-semibold uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Sermon</th>
                <th className="py-3.5 px-3 hidden md:table-cell font-semibold">Preacher</th>
                <th className="py-3.5 px-3 hidden lg:table-cell font-semibold">Series</th>
                <th className="py-3.5 px-3 hidden sm:table-cell font-semibold">Date Preached</th>
                <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.data.map((sermon) => (
                <tr key={sermon.id} className="hover:bg-white/[0.04] transition-colors">
                  {/* Title & Artwork */}
                  <td className="py-3 px-4 align-middle">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 shrink-0 border border-white/10 relative shadow-sm">
                        {sermon.artwork_url && sermon.artwork_url !== "ERROR" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={sermon.artwork_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/40">
                            <Music size={16} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white/90 text-xs sm:text-[13px] leading-snug break-words">
                          {sermon.title}
                        </p>
                        <p className="text-[11px] text-white/50 md:hidden mt-0.5 truncate">
                          {sermon.preachers?.name || "Unknown Preacher"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Preacher */}
                  <td className="py-3 px-3 hidden md:table-cell text-white/70 font-normal text-xs align-middle">
                    <p className="break-words line-clamp-2">
                      {sermon.preachers?.name || <span className="italic text-white/30">None</span>}
                    </p>
                  </td>

                  {/* Series */}
                  <td className="py-3 px-3 hidden lg:table-cell align-middle">
                    {sermon.series?.name ? (
                      <span
                        className="inline-block max-w-full truncate px-2 py-0.5 rounded-md text-[11px] font-normal bg-blue-500/10 text-blue-300 border border-blue-500/20"
                        title={sermon.series.name}
                      >
                        {sermon.series.name}
                      </span>
                    ) : (
                      <span className="text-xs text-white/30 italic">Standalone</span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="py-3 px-3 hidden sm:table-cell text-xs text-white/60 font-mono whitespace-nowrap align-middle">
                    {sermon.date_preached || "—"}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap align-middle">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEdit(sermon)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 transition-colors shadow-sm"
                        title="Edit sermon"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(sermon.id, sermon.title)}
                        disabled={deletingId === sermon.id}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors disabled:opacity-50 shadow-sm"
                        title="Delete sermon"
                      >
                        {deletingId === sermon.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-20 text-center text-white/50">
          <BookOpen className="mx-auto mb-3 opacity-30 text-white" size={40} />
          <p className="text-base font-semibold text-white">No sermons found</p>
          <p className="text-xs mt-1">Try adjusting your search query.</p>
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-white/60">
          <p>
            Page <span className="font-bold text-white">{page}</span> of{" "}
            <span className="font-bold text-white">{totalPages}</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 font-medium"
            >
              <ChevronLeft size={15} />
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 font-medium"
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// UNIFIED SERMON FORM COMPONENT (ADD & EDIT WITH 1-CLICK AUTO-ENRICHMENT)
// =============================================================================

interface SermonFormProps {
  initialData?: SermonWithRelations;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function SermonForm({ initialData, onSuccess, onCancel }: SermonFormProps) {
  const isEditing = !!initialData;
  const queryClient = useQueryClient();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    preacher_id: initialData?.preacher_id || "",
    series_id: initialData?.series_id || "",
    date_preached: initialData?.date_preached || "",
    audio_url: initialData?.audio_url || "",
    artwork_url: initialData?.artwork_url || "",
    transcript_text: initialData?.transcript_text || "",
    ai_summary: initialData?.ai_summary || "",
    ai_tags: initialData?.ai_tags ? initialData.ai_tags.join(", ") : "",
    key_verses: initialData?.key_verses ? initialData.key_verses.join(", ") : "",
    prayer_focus: initialData?.prayer_focus || ""
  });

  const [isEnriching, setIsEnriching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingArtwork, setIsUploadingArtwork] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [enrichmentNotice, setEnrichmentNotice] = useState<string | null>(null);

  // Quick Preacher state
  const [showQuickAddPreacher, setShowQuickAddPreacher] = useState(false);
  const [quickPreacherName, setQuickPreacherName] = useState("");
  const [isAddingPreacher, setIsAddingPreacher] = useState(false);

  // Fetch Preachers & Series lists
  const { data: preachers, refetch: refetchPreachers } = useQuery<Preacher[]>({
    queryKey: ['admin', 'preachers-dropdown'],
    queryFn: async () => {
      const { data } = await supabase.from('preachers').select('*').order('name');
      return (data ?? []) as Preacher[];
    }
  });

  const { data: seriesList } = useQuery<Series[]>({
    queryKey: ['admin', 'series-dropdown'],
    queryFn: async () => {
      const { data } = await supabase.from('series').select('*').order('name');
      return (data ?? []) as Series[];
    }
  });

  const handleQuickAddPreacher = async () => {
    if (!quickPreacherName.trim()) return;
    setIsAddingPreacher(true);
    try {
      const res = await fetch("/api/admin/preachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: quickPreacherName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add preacher");
      }
      const json = await res.json();
      await queryClient.invalidateQueries({ queryKey: ['admin', 'preachers-dropdown'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'preachers-management'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'stats-preachers-count'] });
      await refetchPreachers();
      setFormData(prev => ({ ...prev, preacher_id: json.data.id }));
      setQuickPreacherName("");
      setShowQuickAddPreacher(false);
    } catch (err: any) {
      alert(`Error adding preacher: ${err.message}`);
    } finally {
      setIsAddingPreacher(false);
    }
  };

  // 1-Click Auto-Enrichment Handler
  const handleAutoEnrich = async () => {
    if (!formData.audio_url.trim() && !formData.transcript_text.trim() && !formData.title.trim()) {
      setStatus({
        type: 'error',
        msg: 'Please provide at least an Audio URL or a Transcript to trigger Auto-Enrichment.'
      });
      return;
    }

    setIsEnriching(true);
    setStatus(null);
    setEnrichmentNotice(null);

    try {
      const res = await fetch("/api/admin/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio_url: formData.audio_url.trim(),
          transcript_text: formData.transcript_text.trim(),
          title: formData.title.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Enrichment service failed");
      }

      const json = await res.json();
      const enriched = json.data || {};

      // Auto-match Preacher (fuzzy matching on first/last names or titles)
      let matchedPreacherId = formData.preacher_id;
      if (enriched.preacher && preachers && preachers.length > 0) {
        const pName = enriched.preacher.toLowerCase();
        const found = preachers.find(p => {
          const name = p.name.toLowerCase();
          return name.includes(pName) || pName.includes(name) ||
            (name.includes("muyiwa") && pName.includes("muyiwa")) ||
            (name.includes("temi") && pName.includes("temi")) ||
            (name.includes("ibukun") && pName.includes("ibukun"));
        });
        if (found) matchedPreacherId = found.id;
      }

      // Auto-match Series
      let matchedSeriesId = formData.series_id;
      if (enriched.series && seriesList && seriesList.length > 0) {
        const sName = enriched.series.toLowerCase();
        const found = seriesList.find(s => {
          const name = s.name.toLowerCase();
          return name.includes(sName) || sName.includes(name);
        });
        if (found) matchedSeriesId = found.id;
      }

      setFormData(prev => ({
        ...prev,
        title: enriched.title || prev.title,
        date_preached: enriched.date_preached || prev.date_preached,
        artwork_url: enriched.artwork_url || prev.artwork_url,
        preacher_id: matchedPreacherId || prev.preacher_id,
        series_id: matchedSeriesId || prev.series_id,
        ai_summary: enriched.ai_summary || prev.ai_summary,
        ai_tags: Array.isArray(enriched.ai_tags) && enriched.ai_tags.length > 0 
          ? enriched.ai_tags.join(", ") 
          : (typeof enriched.ai_tags === 'string' ? enriched.ai_tags : prev.ai_tags),
        key_verses: Array.isArray(enriched.key_verses) && enriched.key_verses.length > 0 
          ? enriched.key_verses.join(", ") 
          : (typeof enriched.key_verses === 'string' ? enriched.key_verses : prev.key_verses),
        prayer_focus: enriched.prayer_focus || prev.prayer_focus
      }));

      setEnrichmentNotice("✨ Metadata enriched from audio ID3 tags, artwork, and AI sermon analysis! All fields below remain fully editable.");
    } catch (err: any) {
      setStatus({ type: 'error', msg: `Enrichment error: ${err.message}` });
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus(null);

    const formattedTags = formData.ai_tags
      ? formData.ai_tags.split(",").map(t => t.trim()).filter(Boolean)
      : [];

    const formattedVerses = formData.key_verses
      ? formData.key_verses.split(",").map(v => v.trim()).filter(Boolean)
      : [];

    const payload = {
      ...(isEditing ? { id: initialData.id } : {}),
      title: formData.title,
      preacher_id: formData.preacher_id || null,
      series_id: formData.series_id || null,
      date_preached: formData.date_preached,
      audio_url: formData.audio_url,
      artwork_url: formData.artwork_url || null,
      transcript_text: formData.transcript_text || null,
      ai_summary: formData.ai_summary || null,
      ai_tags: formattedTags,
      key_verses: formattedVerses,
      prayer_focus: formData.prayer_focus || null
    };

    try {
      const url = "/api/admin/sermons";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save sermon");
      }

      setStatus({
        type: 'success',
        msg: isEditing ? 'Sermon updated successfully!' : 'Sermon saved to catalog successfully!'
      });

      queryClient.invalidateQueries({ queryKey: ['admin', 'sermons'] });
      queryClient.invalidateQueries({ queryKey: ['sermons'] });

      if (onSuccess) {
        setTimeout(() => onSuccess(), 1000);
      }
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {status && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-red-500/10 text-red-400 border border-red-500/25'}`}>
          {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{status.msg}</span>
        </div>
      )}

      {enrichmentNotice && (
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-300 flex items-start gap-3 text-sm">
          <Sparkles className="shrink-0 mt-0.5 text-blue-400" size={18} />
          <div>{enrichmentNotice}</div>
        </div>
      )}

      {/* 1-Click Auto-Enrichment Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-white/[0.02] border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-blue-950/20">
        <div>
          <div className="flex items-center gap-2 font-bold text-white text-base">
            <Sparkles className="text-blue-400" size={18} />
            1-Click Audio & AI Enrichment
          </div>
          <p className="text-xs text-white/60 mt-1 max-w-lg leading-relaxed">
            Provide the audio URL and/or transcript below, then click Enrich. The system will auto-extract embedded artwork, ID3 tags, and generate theological summaries, verses, and prayer points.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAutoEnrich}
          disabled={isEnriching}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-blue-500/30 shrink-0"
        >
          {isEnriching ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Enriching Audio & AI...</span>
            </>
          ) : (
            <>
              <Sparkles size={15} />
              <span>Start Enrichment</span>
            </>
          )}
        </button>
      </div>

      {/* Core Audio & Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Audio URL */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-white/80 mb-2 uppercase tracking-wider">
            Audio File URL (Archive.org / Direct MP3) *
          </label>
          <input
            required
            type="url"
            value={formData.audio_url}
            onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
            placeholder="https://archive.org/download/..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder:text-white/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        {/* Sermon Title */}
        <div>
          <label className="block text-xs font-bold text-white/80 mb-2 uppercase tracking-wider">
            Sermon Title *
          </label>
          <input
            required
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. The Power of Faith"
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder:text-white/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        {/* Date Preached */}
        <div>
          <label className="block text-xs font-bold text-white/80 mb-2 uppercase tracking-wider">
            Date Preached *
          </label>
          <input
            required
            type="date"
            value={formData.date_preached}
            onChange={(e) => setFormData({ ...formData, date_preached: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        {/* Preacher Dropdown + Quick Add */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-white/80 uppercase tracking-wider">
              Preacher
            </label>
            <button
              type="button"
              onClick={() => {
                setShowQuickAddPreacher(v => !v);
                setQuickPreacherName("");
              }}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
            >
              <Plus size={13} />
              <span>{showQuickAddPreacher ? "Cancel" : "+ New Preacher"}</span>
            </button>
          </div>

          {showQuickAddPreacher ? (
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={quickPreacherName}
                onChange={e => setQuickPreacherName(e.target.value)}
                placeholder="e.g. Pastor John Doe"
                className="flex-1 bg-white/5 border border-blue-500/50 rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-white/30 focus:border-blue-500 outline-none transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleQuickAddPreacher();
                  }
                  if (e.key === 'Escape') {
                    setShowQuickAddPreacher(false);
                  }
                }}
              />
              <button
                type="button"
                disabled={isAddingPreacher || !quickPreacherName.trim()}
                onClick={handleQuickAddPreacher}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-50 transition-all shadow-sm shrink-0"
              >
                {isAddingPreacher ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                <span>Add</span>
              </button>
            </div>
          ) : (
            <select
              value={formData.preacher_id}
              onChange={(e) => setFormData({ ...formData, preacher_id: e.target.value })}
              className="w-full bg-[#18191f] border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="">Select Preacher...</option>
              {preachers?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Series Dropdown */}
        <div>
          <label className="block text-xs font-bold text-white/80 mb-2 uppercase tracking-wider">
            Series (Optional)
          </label>
          <select
            value={formData.series_id}
            onChange={(e) => setFormData({ ...formData, series_id: e.target.value })}
            className="w-full bg-[#18191f] border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          >
            <option value="">Standalone / No Series</option>
            {seriesList?.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Album Artwork URL + Preview + Direct File Upload */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-white/80 mb-2 uppercase tracking-wider flex items-center justify-between">
            <span>Album Artwork (Auto-extracted, Direct Upload, or Image URL)</span>
            {isUploadingArtwork && (
              <span className="text-xs text-blue-400 flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Uploading image...
              </span>
            )}
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/5 border border-white/15 shrink-0 relative shadow-sm">
              {formData.artwork_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={formData.artwork_url} alt="Artwork Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/30">
                  <ImageIcon size={22} />
                </div>
              )}
            </div>

            <input
              type="url"
              value={formData.artwork_url}
              onChange={(e) => setFormData({ ...formData, artwork_url: e.target.value })}
              placeholder="https://... (or auto-extracted on enrich)"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder:text-white/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />

            <label className="bg-white/10 hover:bg-white/15 text-white font-semibold px-4 py-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors border border-white/10 shrink-0">
              <Plus size={16} />
              <span>Upload Image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploadingArtwork}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setIsUploadingArtwork(true);
                  try {
                    // Automatically compress & convert to lightweight WebP (max 600x600, ~35KB)
                    const compressedBlob = await compressImageClient(file, 600, 600, 0.85);
                    const uploadData = new FormData();
                    uploadData.append("file", compressedBlob, "artwork.webp");
                    
                    const res = await fetch("/api/admin/upload-artwork", {
                      method: "POST",
                      body: uploadData,
                    });
                    if (!res.ok) {
                      const err = await res.json();
                      throw new Error(err.error || "Failed to upload image");
                    }
                    const json = await res.json();
                    setFormData(prev => ({ ...prev, artwork_url: json.url }));
                  } catch (err: any) {
                    alert(`Upload failed: ${err.message}`);
                  } finally {
                    setIsUploadingArtwork(false);
                  }
                }}
              />
            </label>
          </div>
        </div>

        {/* Full Transcript Text */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-white/80 mb-2 uppercase tracking-wider flex items-center justify-between">
            <span>Verbatim Transcript (Optional)</span>
            <span className="text-[11px] text-white/40 font-normal lowercase">Powers AI summaries, key scriptures, and natural language search</span>
          </label>
          <textarea
            rows={6}
            value={formData.transcript_text}
            onChange={(e) => setFormData({ ...formData, transcript_text: e.target.value })}
            placeholder="Paste verbatim sermon transcript here..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs font-mono text-white placeholder:text-white/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y transition-all"
          />
        </div>
      </div>

      {/* AI Content & Thematic Metadata Section */}
      <div className="pt-6 border-t border-white/10 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="text-blue-400" size={18} />
          About this Sermon & AI Theological Insights
        </h3>

        {/* AI Summary ("About this Sermon") */}
        <div>
          <label className="block text-xs font-bold text-white/80 mb-2 uppercase tracking-wider">
            About this Sermon (AI Summary)
          </label>
          <textarea
            rows={4}
            value={formData.ai_summary}
            onChange={(e) => setFormData({ ...formData, ai_summary: e.target.value })}
            placeholder="Rich theological summary of the message..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder:text-white/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y transition-all"
          />
        </div>

        {/* Key Verses */}
        <div>
          <label className="block text-xs font-bold text-white/80 mb-2 uppercase tracking-wider">
            Key Verses (Comma-separated)
          </label>
          <input
            type="text"
            value={formData.key_verses}
            onChange={(e) => setFormData({ ...formData, key_verses: e.target.value })}
            placeholder="e.g. Ephesians 1:16-23, Romans 8:1, 2 Corinthians 5:17"
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder:text-white/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        {/* Prayer Focus */}
        <div>
          <label className="block text-xs font-bold text-white/80 mb-2 uppercase tracking-wider">
            Prayer Focus (Actionable Declarations & Prayer Points)
          </label>
          <textarea
            rows={4}
            value={formData.prayer_focus}
            onChange={(e) => setFormData({ ...formData, prayer_focus: e.target.value })}
            placeholder="• For revelation in the Word&#10;• For walking in spiritual authority..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder:text-white/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y transition-all"
          />
        </div>

        {/* AI Tags */}
        <div>
          <label className="block text-xs font-bold text-white/80 mb-2 uppercase tracking-wider">
            Thematic Tags (Comma-separated)
          </label>
          <input
            type="text"
            value={formData.ai_tags}
            onChange={(e) => setFormData({ ...formData, ai_tags: e.target.value })}
            placeholder="e.g. Faith, Healing, Holy Spirit, Spiritual Authority"
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder:text-white/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSaving || isEnriching}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25 min-w-[140px] justify-center"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Saving Sermon...</span>
            </>
          ) : (
            <span>{isEditing ? "Update Sermon" : "Save Sermon"}</span>
          )}
        </button>
      </div>
    </form>
  );
}

// =============================================================================
// SERIES & THUMBNAIL MANAGEMENT FORM COMPONENT
// =============================================================================

function SeriesManagementForm() {
  const supabase = createClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingNew, setIsUploadingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newThumbnail, setNewThumbnail] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  const { data: seriesList, refetch, isLoading } = useQuery<Series[]>({
    queryKey: ['admin', 'series-management'],
    queryFn: async () => {
      const { data, error } = await supabase.from('series').select('*').order('name');
      if (error) throw error;
      return (data ?? []) as Series[];
    }
  });

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsCreating(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), thumbnail_url: newThumbnail.trim() || null }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create series");
      }
      setStatus({ type: 'success', msg: `Series "${newName}" created successfully!` });
      setNewName("");
      setNewThumbnail("");
      refetch();
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveSeries = async (id: string, newSeriesName: string, newUrl: string) => {
    setSavingId(id);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/series", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: newSeriesName || undefined, thumbnail_url: newUrl }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update series");
      }
      setStatus({ type: 'success', msg: `"${newSeriesName}" updated successfully!` });
      refetch();
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setSavingId(null);
    }
  };

  const filtered = (seriesList || []).filter(s => s.name.toLowerCase().includes(searchFilter.toLowerCase()));

  return (
    <div className="space-y-8">
      {status && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-red-500/10 text-red-400 border border-red-500/25'}`}>
          {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{status.msg}</span>
        </div>
      )}

      {/* Add New Series Form */}
      <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 shadow-sm">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Plus size={18} className="text-blue-400" />
          Create New Series
        </h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/80 mb-2 uppercase tracking-wider">Series Name *</label>
              <input
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                type="text"
                placeholder="e.g. Atmosphere for Miracles"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder:text-white/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 mb-2 uppercase tracking-wider flex items-center justify-between">
                <span>Thumbnail Image (Optional)</span>
                {isUploadingNew && (
                  <span className="text-xs text-blue-400 flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" /> Uploading...
                  </span>
                )}
              </label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/15 shrink-0 relative shadow-sm">
                  {newThumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={newThumbnail} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30">
                      <ImageIcon size={20} />
                    </div>
                  )}
                </div>

                <input
                  type="url"
                  value={newThumbnail}
                  onChange={(e) => setNewThumbnail(e.target.value)}
                  placeholder="https://... (or click upload)"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-white/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />

                <label className="bg-white/10 hover:bg-white/15 text-white font-semibold px-3.5 py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-white/10 shrink-0">
                  <Plus size={15} />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploadingNew}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploadingNew(true);
                      try {
                        const compressed = await compressImageClient(file, 600, 600, 0.85);
                        const formData = new FormData();
                        formData.append("file", compressed, "series-thumb.webp");
                        const res = await fetch("/api/admin/upload-artwork", {
                          method: "POST",
                          body: formData,
                        });
                        if (!res.ok) {
                          const err = await res.json();
                          throw new Error(err.error || "Upload failed");
                        }
                        const json = await res.json();
                        setNewThumbnail(json.url);
                      } catch (err: any) {
                        alert(`Upload failed: ${err.message}`);
                      } finally {
                        setIsUploadingNew(false);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isCreating || isUploadingNew}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-blue-500/25"
            >
              {isCreating && <Loader2 size={16} className="animate-spin" />}
              <span>Create Series</span>
            </button>
          </div>
        </form>
      </div>

      {/* Series List & Thumbnail Manager */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-white">All Series ({seriesList?.length || 0})</h3>
            <p className="text-xs text-white/50">Edit names, assign thumbnails, or upload artwork for any series.</p>
          </div>
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search series..."
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder:text-white/30 outline-none w-full sm:w-64 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-blue-400" size={24} /></div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filtered.map(s => (
              <SeriesItemRow key={s.id} series={s} onSave={handleSaveSeries} isSaving={savingId === s.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SeriesItemRow({
  series,
  onSave,
  isSaving,
}: {
  series: Series;
  onSave: (id: string, name: string, url: string) => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(series.name);
  const [url, setUrl] = useState(series.thumbnail_url || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  const nameChanged = name.trim() !== series.name;
  const urlChanged = url !== (series.thumbnail_url || "");
  const hasChanged = nameChanged || urlChanged;

  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col gap-3 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-3">
        {/* Thumbnail Preview */}
        <div className="w-11 h-11 rounded-xl overflow-hidden bg-white/5 shrink-0 border border-white/10 shadow-sm">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={series.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40">
              <ImageIcon size={16} />
            </div>
          )}
        </div>

        {/* Series Name — editable */}
        <div className="flex-1 min-w-0">
          {isEditingName ? (
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={e => { if (e.key === 'Enter') setIsEditingName(false); if (e.key === 'Escape') { setName(series.name); setIsEditingName(false); } }}
              className="w-full bg-white/5 border border-blue-500/60 rounded-lg px-3 py-1.5 text-sm text-white outline-none ring-1 ring-blue-500/30 transition-colors"
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="flex items-center gap-1.5 text-left group w-full"
              title="Click to edit series name"
            >
              <span className="text-sm font-bold text-white truncate">{name}</span>
              {nameChanged && <span className="text-[10px] text-amber-400 font-bold shrink-0">(unsaved)</span>}
              <Edit3 size={12} className="text-white/30 group-hover:text-blue-400 transition-colors shrink-0 ml-1" />
            </button>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={() => onSave(series.id, name.trim() || series.name, url)}
          disabled={!hasChanged || isSaving || isUploading}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5 shadow-sm"
        >
          {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          <span>Save</span>
        </button>
      </div>

      {/* Thumbnail URL row */}
      <div className="flex items-center gap-2 pl-14">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste thumbnail image URL (https://...)"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
        />
        <label className="bg-white/10 hover:bg-white/15 text-white font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors border border-white/10 shrink-0">
          {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          <span>Upload</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isUploading || isSaving}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setIsUploading(true);
              try {
                const compressed = await compressImageClient(file, 600, 600, 0.85);
                const fd = new FormData();
                fd.append("file", compressed, "series-thumb.webp");
                const res = await fetch("/api/admin/upload-artwork", { method: "POST", body: fd });
                if (!res.ok) {
                  const err = await res.json();
                  throw new Error(err.error || "Upload failed");
                }
                const json = await res.json();
                setUrl(json.url);
                onSave(series.id, name.trim() || series.name, json.url);
              } catch (err: any) {
                alert(`Upload failed: ${err.message}`);
              } finally {
                setIsUploading(false);
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}

// =============================================================================
// PREACHERS MANAGEMENT FORM COMPONENT
// =============================================================================

function PreachersManagementForm() {
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
