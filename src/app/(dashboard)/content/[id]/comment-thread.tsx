"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, CheckCircle2, Circle, MessageSquare } from "lucide-react";
import type { Comment, CommentType } from "@/types/database";

// ─── Comment type config ──────────────────────────────────────────────────────

const COMMENT_TYPES: { value: CommentType; label: string; color: string; bg: string }[] = [
  { value: "design",  label: "Diseño",   color: "#007AFF", bg: "#EFF6FF" },
  { value: "copy",    label: "Copy",     color: "#7C3AED", bg: "#F5F3FF" },
  { value: "concept", label: "Concepto", color: "#FF9500", bg: "#FFF7ED" },
  { value: "minor",   label: "Menor",    color: "#949494", bg: "#F8F6F6" },
];

function typeConfig(type: CommentType | null) {
  return COMMENT_TYPES.find((t) => t.value === type) ?? COMMENT_TYPES[3];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Ahora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  initialComments: Comment[];
  pieceId: string;
}

export function CommentThread({ initialComments, pieceId }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText] = useState("");
  const [type, setType] = useState<CommentType>("design");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setIsSubmitting(true);

    const { data, error } = await supabase
      .from("comments")
      .insert({
        content_piece_id: pieceId,
        comment_text: text.trim(),
        comment_type: type,
        resolved: false,
      })
      .select()
      .single();

    if (!error && data) {
      setComments((prev) => [data as Comment, ...prev]);
      setText("");
    }
    setIsSubmitting(false);
  };

  // ── Resolve toggle ──────────────────────────────────────────────────────────

  const handleResolve = async (comment: Comment) => {
    const newVal = !comment.resolved;
    await supabase
      .from("comments")
      .update({ resolved: newVal })
      .eq("id", comment.id);
    setComments((prev) =>
      prev.map((c) => (c.id === comment.id ? { ...c, resolved: newVal } : c))
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const open = comments.filter((c) => !c.resolved);
  const resolved = comments.filter((c) => c.resolved);

  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[10px] font-bold text-[#949494] uppercase tracking-[0.15em]">
          {open.length} abierto{open.length !== 1 ? "s" : ""}
        </span>
        {resolved.length > 0 && (
          <span className="text-[10px] font-medium text-[#CCCCCC] uppercase tracking-widest">
            · {resolved.length} resuelto{resolved.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[380px] hide-scrollbar">
        {comments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <MessageSquare className="w-6 h-6 text-[#E5E5E5] mb-2" />
            <p className="text-[10px] font-medium uppercase tracking-widest text-[#CCCCCC]">
              Sin comentarios aún
            </p>
          </div>
        )}

        {/* Open comments first */}
        {open.map((c) => (
          <CommentItem key={c.id} comment={c} onResolve={() => handleResolve(c)} />
        ))}

        {/* Resolved comments (collapsed appearance) */}
        {resolved.length > 0 && (
          <div className="mt-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#CCCCCC] mb-2 px-1">
              Resueltos
            </p>
            {resolved.map((c) => (
              <CommentItem key={c.id} comment={c} onResolve={() => handleResolve(c)} />
            ))}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="mt-4 border-t border-[#E5E5E5] pt-4 space-y-3">
        {/* Type selector */}
        <div className="flex gap-1">
          {COMMENT_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`flex-1 py-1.5 text-[8px] font-bold uppercase tracking-widest rounded-sm transition-all border ${
                type === t.value
                  ? "text-white border-transparent"
                  : "bg-white text-[#949494] border-[#E5E5E5] hover:border-[#1C1C1C]"
              }`}
              style={
                type === t.value
                  ? { backgroundColor: t.color, borderColor: t.color }
                  : {}
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Text input */}
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
            placeholder="Añade un comentario... (⌘↵ para enviar)"
            className="w-full resize-none text-[11px] leading-relaxed text-[#1C1C1C] bg-[#FAFAFA] border border-[#E5E5E5] rounded-sm p-3 pr-10 focus:outline-none focus:border-[#1C1C1C] min-h-[72px] placeholder:text-[#CCCCCC]"
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || isSubmitting}
            className="absolute bottom-2.5 right-2.5 w-7 h-7 bg-[#1C1C1C] hover:bg-[#FF3B30] disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-sm flex items-center justify-center transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Comment Item ─────────────────────────────────────────────────────────────

function CommentItem({
  comment,
  onResolve,
}: {
  comment: Comment;
  onResolve: () => void;
}) {
  const cfg = typeConfig(comment.comment_type);

  return (
    <div
      className={`flex gap-2.5 p-3 rounded-sm border transition-all group ${
        comment.resolved
          ? "bg-[#FAFAFA] border-[#F0F0F0] opacity-50"
          : "bg-white border-[#E5E5E5] hover:border-[#1C1C1C]"
      }`}
    >
      {/* Resolve toggle */}
      <button
        onClick={onResolve}
        className="flex-shrink-0 mt-0.5 transition-colors"
        title={comment.resolved ? "Reabrir" : "Marcar como resuelto"}
      >
        {comment.resolved ? (
          <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
        ) : (
          <Circle className="w-4 h-4 text-[#CCCCCC] group-hover:text-[#34C759]" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm"
            style={{ color: cfg.color, backgroundColor: cfg.bg }}
          >
            {cfg.label}
          </span>
          <span className="text-[9px] text-[#CCCCCC] font-medium flex-shrink-0">
            {timeAgo(comment.created_at)}
          </span>
        </div>
        <p
          className={`text-[11px] leading-relaxed text-[#1C1C1C] ${
            comment.resolved ? "line-through text-[#949494]" : ""
          }`}
        >
          {comment.comment_text}
        </p>
      </div>
    </div>
  );
}
