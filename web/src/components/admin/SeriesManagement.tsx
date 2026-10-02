"use client";

import { useState, useId } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { Loader2, CheckCircle2, AlertCircle, Plus, Edit3, Image as ImageIcon, Check } from "lucide-react";
import type { Series } from "@/types/database";
import { compressImageClient } from "@/utils/image";

export function SeriesManagementForm() {
  const uid = useId(); // unique per instance, so label/field ids never clash
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
              <label htmlFor={`${uid}-series-name`} className="block text-xs font-bold text-white/80 mb-2 uppercase tracking-wider">Series Name *</label>
              <input id={`${uid}-series-name`}
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                type="text"
                placeholder="e.g. Atmosphere for Miracles"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder:text-white/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor={`${uid}-thumbnail-image`} className="block text-xs font-bold text-white/80 mb-2 uppercase tracking-wider flex items-center justify-between">
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

                <input id={`${uid}-thumbnail-image`}
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
                        setStatus({ type: 'error', msg: `Upload failed: ${err.message}` });
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
              <SeriesItemRow key={s.id} series={s} onSave={handleSaveSeries} onError={(msg) => setStatus({ type: 'error', msg })} isSaving={savingId === s.id} />
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
  onError,
  isSaving,
}: {
  series: Series;
  onSave: (id: string, name: string, url: string) => void;
  onError: (message: string) => void;
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
            <img src={url} alt={series.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
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
                onError(`Upload failed: ${err.message}`);
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
