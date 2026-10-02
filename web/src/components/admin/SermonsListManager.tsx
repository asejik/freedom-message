"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle2, AlertCircle, Edit3, Trash2, Search, Music, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import type { SermonWithRelations } from "@/types/database";

export function SermonsListManager({ onEdit }: { onEdit: (sermon: SermonWithRelations) => void }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);
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

  // The table rows omit transcript_text, so load the full record before editing;
  // otherwise saving the form would overwrite the transcript with an empty value.
  const handleEdit = async (id: string) => {
    setLoadingEditId(id);
    setActionStatus(null);
    try {
      const res = await fetch(`/api/admin/sermons?id=${id}`);
      if (!res.ok) throw new Error("Failed to load sermon for editing");
      const json = await res.json();
      onEdit(json.data as SermonWithRelations);
    } catch (err) {
      setActionStatus({ type: 'error', msg: err instanceof Error ? err.message : "Failed to load sermon" });
    } finally {
      setLoadingEditId(null);
    }
  };

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
                          <img src={sermon.artwork_url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
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
                        onClick={() => handleEdit(sermon.id)}
                        disabled={loadingEditId === sermon.id}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 transition-colors shadow-sm"
                        title="Edit sermon"
                      >
                        {loadingEditId === sermon.id ? <Loader2 size={14} className="animate-spin" /> : <Edit3 size={14} />}
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
