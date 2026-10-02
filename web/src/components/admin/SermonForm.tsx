"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { Loader2, CheckCircle2, AlertCircle, Sparkles, Plus, Image as ImageIcon, Check } from "lucide-react";
import type { Preacher, Series, SermonWithRelations } from "@/types/database";
import { compressImageClient } from "@/utils/image";

interface SermonFormProps {
  initialData?: SermonWithRelations;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SermonForm({ initialData, onSuccess, onCancel }: SermonFormProps) {
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
