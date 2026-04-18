"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Upload, Trash2, Crown, Film, FileCode, ImageIcon,
  Loader2, CheckCircle2, AlertCircle, Star
} from "lucide-react";
import type { Asset } from "@/types/database";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileType(mime: string): Asset["file_type"] {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "design_file";
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  error?: string;
}

interface Props {
  initialAssets: Asset[];
  pieceId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AssetGallery({ initialAssets, pieceId }: Props) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // ── Upload logic ────────────────────────────────────────────────────────────

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      // Init uploading state
      const uploadItems: UploadingFile[] = fileArray.map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        progress: 0,
      }));
      setUploading((prev) => [...prev, ...uploadItems]);

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const uploadItem = uploadItems[i];

        try {
          // Determine version number for same-named files
          const existingVersions = assets.filter(
            (a) => a.file_name === file.name
          );
          const version = existingVersions.length + 1;

          const ext = file.name.includes(".")
            ? file.name.split(".").pop()
            : "";
          const baseName = file.name.replace(`.${ext}`, "");
          const storagePath = `${pieceId}/${Date.now()}-v${version}-${baseName}.${ext}`;

          // Mark as in-progress
          setUploading((prev) =>
            prev.map((u) =>
              u.id === uploadItem.id ? { ...u, progress: 30 } : u
            )
          );

          // Upload to Supabase Storage
          const { error: storageError } = await supabase.storage
            .from("assets")
            .upload(storagePath, file, { upsert: false });

          if (storageError) throw storageError;

          setUploading((prev) =>
            prev.map((u) =>
              u.id === uploadItem.id ? { ...u, progress: 70 } : u
            )
          );

          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("assets").getPublicUrl(storagePath);

          // Insert metadata into assets table
          const { data: newAsset, error: dbError } = await supabase
            .from("assets")
            .insert({
              content_piece_id: pieceId,
              file_name: file.name,
              file_url: publicUrl,
              file_type: getFileType(file.type),
              mime_type: file.type,
              file_size_bytes: file.size,
              version,
              is_final: false,
            })
            .select()
            .single();

          if (dbError) throw dbError;

          setUploading((prev) =>
            prev.map((u) =>
              u.id === uploadItem.id ? { ...u, progress: 100 } : u
            )
          );

          // Add to assets list
          setAssets((prev) => [newAsset as Asset, ...prev]);

          // Remove from uploading after brief success state
          setTimeout(() => {
            setUploading((prev) => prev.filter((u) => u.id !== uploadItem.id));
          }, 1500);
        } catch (err: any) {
          setUploading((prev) =>
            prev.map((u) =>
              u.id === uploadItem.id
                ? { ...u, error: err.message || "Error al subir" }
                : u
            )
          );
          setTimeout(() => {
            setUploading((prev) => prev.filter((u) => u.id !== uploadItem.id));
          }, 3000);
        }
      }
    },
    [assets, pieceId, supabase]
  );

  // ── Delete ───────────────────────────────────────────────────────────────────

  const handleDelete = async (asset: Asset) => {
    if (!confirm(`¿Eliminar "${asset.file_name}"?`)) return;

    // Extract storage path from URL
    const urlParts = asset.file_url.split("/storage/v1/object/public/assets/");
    const storagePath = urlParts[1];

    if (storagePath) {
      await supabase.storage.from("assets").remove([storagePath]);
    }

    await supabase.from("assets").delete().eq("id", asset.id);
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
  };

  // ── Toggle Final ─────────────────────────────────────────────────────────────

  const handleToggleFinal = async (asset: Asset) => {
    const newVal = !asset.is_final;
    await supabase
      .from("assets")
      .update({ is_final: newVal })
      .eq("id", asset.id);
    setAssets((prev) =>
      prev.map((a) => (a.id === asset.id ? { ...a, is_final: newVal } : a))
    );
  };

  // ── Drag events ──────────────────────────────────────────────────────────────

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const hasContent = assets.length > 0 || uploading.length > 0;

  return (
    <div className="space-y-5">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-sm transition-all cursor-pointer ${
          isDragOver
            ? "border-[#1C1C1C] bg-[#F0F0F0] scale-[1.005]"
            : "border-[#E5E5E5] hover:border-[#1C1C1C] bg-[#FAFAFA]"
        } ${hasContent ? "h-[80px]" : "h-[180px]"} flex flex-col items-center justify-center gap-2`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.psd,.ai,.fig,.sketch,.zip"
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        {isDragOver ? (
          <>
            <Upload className="w-6 h-6 text-[#1C1C1C]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#1C1C1C]">
              Suelta para Subir
            </span>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-[#E5E5E5] flex items-center justify-center">
              <Upload className="w-4 h-4 text-[#949494]" />
            </div>
            {!hasContent && (
              <>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#1C1C1C]">
                  Arrastra o haz clic para subir
                </span>
                <span className="text-[9px] text-[#949494] uppercase tracking-widest font-medium">
                  PNG · JPG · MP4 · PSD · AI — máx. 100 MB
                </span>
              </>
            )}
          </>
        )}
      </div>

      {/* Uploading Progress */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-[#E5E5E5] rounded-sm p-3 flex items-center gap-3"
            >
              {item.error ? (
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              ) : item.progress === 100 ? (
                <CheckCircle2 className="w-4 h-4 text-[#34C759] flex-shrink-0" />
              ) : (
                <Loader2 className="w-4 h-4 text-[#FF9500] animate-spin flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-[#1C1C1C] truncate">
                  {item.name}
                </p>
                {item.error ? (
                  <p className="text-[10px] text-red-500">{item.error}</p>
                ) : (
                  <div className="mt-1 h-0.5 bg-[#F0F0F0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1C1C1C] transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Asset Grid */}
      {assets.length > 0 && (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onDelete={() => handleDelete(asset)}
              onToggleFinal={() => handleToggleFinal(asset)}
            />
          ))}
        </div>
      )}

      {assets.length === 0 && uploading.length === 0 && (
        <p className="text-center text-[10px] font-medium uppercase tracking-widest text-[#CCCCCC]">
          Sin assets todavía
        </p>
      )}
    </div>
  );
}

// ─── Asset Card ───────────────────────────────────────────────────────────────

function AssetCard({
  asset,
  onDelete,
  onToggleFinal,
}: {
  asset: Asset;
  onDelete: () => void;
  onToggleFinal: () => void;
}) {
  const [showControls, setShowControls] = useState(false);

  const Icon =
    asset.file_type === "video"
      ? Film
      : asset.file_type === "image"
      ? ImageIcon
      : FileCode;

  return (
    <div
      className={`group relative bg-white border rounded-sm overflow-hidden transition-all ${
        asset.is_final
          ? "border-[#1C1C1C] ring-1 ring-[#1C1C1C]"
          : "border-[#E5E5E5] hover:border-[#1C1C1C]"
      }`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Preview */}
      <div className="aspect-video bg-[#F8F6F6] flex items-center justify-center overflow-hidden relative">
        {asset.file_type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.file_url}
            alt={asset.file_name ?? "asset"}
            className="w-full h-full object-cover"
          />
        ) : asset.file_type === "video" ? (
          <video
            src={asset.file_url}
            className="w-full h-full object-cover"
            muted
            playsInline
            onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
            onMouseLeave={(e) => {
              const v = e.currentTarget as HTMLVideoElement;
              v.pause();
              v.currentTime = 0;
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Icon className="w-8 h-8 text-[#CCCCCC]" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#CCCCCC]">
              {asset.mime_type?.split("/").pop()?.toUpperCase() ?? "FILE"}
            </span>
          </div>
        )}

        {/* Hover overlay with actions */}
        {showControls && (
          <div className="absolute inset-0 bg-[rgba(28,28,28,0.45)] flex items-center justify-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFinal();
              }}
              title={asset.is_final ? "Quitar de Final" : "Marcar como Final"}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                asset.is_final
                  ? "bg-[#FFD700] text-[#1C1C1C]"
                  : "bg-white/90 text-[#1C1C1C] hover:bg-[#FFD700]"
              }`}
            >
              <Crown className="w-4 h-4" />
            </button>
            <a
              href={asset.file_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-9 h-9 rounded-full bg-white/90 text-[#1C1C1C] flex items-center justify-center hover:bg-white"
              title="Abrir en nueva pestaña"
            >
              <Icon className="w-4 h-4" />
            </a>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Eliminar"
              className="w-9 h-9 rounded-full bg-white/90 text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white flex items-center justify-center transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Final badge */}
        {asset.is_final && (
          <div className="absolute top-2 right-2 bg-[#FFD700] text-[#1C1C1C] text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm flex items-center gap-1">
            <Star className="w-2.5 h-2.5 fill-current" />
            FINAL
          </div>
        )}

        {/* Version badge */}
        {asset.version > 1 && (
          <div className="absolute top-2 left-2 bg-[#1C1C1C]/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm">
            v{asset.version}
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="px-3 py-2 border-t border-[#F0F0F0]">
        <p className="text-[10px] font-bold text-[#1C1C1C] truncate">
          {asset.file_name ?? "Sin nombre"}
        </p>
        <p className="text-[9px] text-[#949494] font-medium mt-0.5">
          {asset.file_size_bytes
            ? formatBytes(asset.file_size_bytes)
            : "—"}
          {asset.version > 1 && (
            <span className="ml-2 text-[#FF9500]">v{asset.version}</span>
          )}
        </p>
      </div>
    </div>
  );
}
