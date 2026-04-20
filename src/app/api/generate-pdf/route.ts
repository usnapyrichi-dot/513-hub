import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveWorkspaceId } from "@/lib/supabase/workspace";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export const runtime = "nodejs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return [r, g, b];
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

const STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  briefed: "Briefed",
  ideation: "Ideation",
  pre_production: "Pre-Prod",
  production: "Production",
  internal_review: "Int. Review",
  client_review: "Client Review",
  client_approved: "Approved",
  client_changes: "Changes",
  rework: "Rework",
  scheduled: "Scheduled",
  published: "Published",
};

const TYPE_LABELS: Record<string, string> = {
  reel: "REEL",
  carousel_animated: "CARRUSEL ANIM.",
  carousel_static: "CARRUSEL ESTÁTICO",
};

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { clientId, monthYear } = await req.json();
    if (!clientId) {
      return NextResponse.json({ error: "clientId requerido" }, { status: 400 });
    }

    const supabase = await createClient();
    const workspace_id = await resolveWorkspaceId();

    const { data: client } = await supabase
      .from("clients")
      .select("id, name, brand_guidelines")
      .eq("id", clientId)
      .eq("workspace_id", workspace_id)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado o no autorizado" }, { status: 404 });
    }

    let query = supabase
      .from("content_pieces")
      .select("id, title, content_type, status, platforms, publish_date, description, copy_out, visual_description")
      .eq("client_id", clientId)
      .eq("workspace_id", workspace_id)
      .order("publish_date", { ascending: true, nullsFirst: false });

    if (monthYear) {
      query = query.eq("month_year", monthYear);
    }

    const { data: pieces } = await query;
    const pieceList = pieces ?? [];

    const now = new Date();
    const monthLabel = monthYear ?? now.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

    // ─── Build PDF ────────────────────────────────────────────────────────────

    const doc = await PDFDocument.create();

    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontReg  = await doc.embedFont(StandardFonts.Helvetica);

    const W = 595.28; // A4 width
    const H = 841.89; // A4 height

    const BLACK:  [number, number, number] = [0.11, 0.11, 0.11];
    const WHITE:  [number, number, number] = [1, 1, 1];
    const GRAY:   [number, number, number] = [0.58, 0.58, 0.58];
    const RED:    [number, number, number] = [1, 0.23, 0.19];
    const LGRAY:  [number, number, number] = [0.97, 0.97, 0.97];
    const BORDER: [number, number, number] = [0.9, 0.9, 0.9];

    // ─── Cover page ───────────────────────────────────────────────────────────
    {
      const page = doc.addPage([W, H]);
      const { width: w, height: h } = page.getSize();

      // Black background
      page.drawRectangle({ x: 0, y: 0, width: w, height: h, color: rgb(...BLACK) });

      // Red accent bar
      page.drawRectangle({ x: 0, y: h - 8, width: w, height: 8, color: rgb(...RED) });

      // Agency name
      page.drawText("513 HUB", {
        x: 56, y: h - 140,
        font: fontBold, size: 48,
        color: rgb(...WHITE),
      });

      // Subtitle
      page.drawText("SOCIAL MEDIA AGENCY", {
        x: 56, y: h - 168,
        font: fontReg, size: 11,
        color: rgb(1, 0.23, 0.19),
      });

      // Divider
      page.drawRectangle({ x: 56, y: h - 190, width: 80, height: 2, color: rgb(...RED) });

      // Presentation title
      page.drawText("PRESENTACIÓN MENSUAL", {
        x: 56, y: h - 260,
        font: fontBold, size: 9,
        color: rgb(...GRAY),
      });

      page.drawText(client.name.toUpperCase(), {
        x: 56, y: h - 290,
        font: fontBold, size: 28,
        color: rgb(...WHITE),
      });

      page.drawText(monthLabel.toUpperCase(), {
        x: 56, y: h - 320,
        font: fontReg, size: 16,
        color: rgb(...GRAY),
      });

      // Stats
      const stats = [
        { label: "TOTAL PIEZAS", value: pieceList.length },
        { label: "PRODUCCIÓN", value: pieceList.filter(p => ["briefed","pre_production","production","internal_review"].includes(p.status)).length },
        { label: "REVIEW", value: pieceList.filter(p => ["client_review","client_approved","client_changes","rework"].includes(p.status)).length },
        { label: "PUBLICADAS", value: pieceList.filter(p => p.status === "published").length },
      ];

      const statW = (w - 112) / 4;
      stats.forEach((s, i) => {
        const sx = 56 + i * statW;
        const sy = h - 450;

        page.drawRectangle({ x: sx, y: sy, width: statW - 8, height: 80, color: rgb(0.15, 0.15, 0.15) });
        page.drawText(String(s.value), {
          x: sx + 14, y: sy + 42,
          font: fontBold, size: 28,
          color: rgb(...WHITE),
        });
        page.drawText(s.label, {
          x: sx + 14, y: sy + 16,
          font: fontBold, size: 7,
          color: rgb(...GRAY),
        });
      });

      // Footer
      page.drawRectangle({ x: 0, y: 0, width: w, height: 48, color: rgb(0.08, 0.08, 0.08) });
      page.drawText("513 HUB — CONFIDENCIAL", {
        x: 56, y: 17,
        font: fontBold, size: 8,
        color: rgb(...GRAY),
      });
      page.drawText(now.toLocaleDateString("es-ES"), {
        x: w - 100, y: 17,
        font: fontReg, size: 8,
        color: rgb(...GRAY),
      });
    }

    // ─── Content pages ────────────────────────────────────────────────────────

    if (pieceList.length > 0) {
      // Index page
      {
        const page = doc.addPage([W, H]);
        const { width: w, height: h } = page.getSize();

        page.drawRectangle({ x: 0, y: h - 8, width: w, height: 8, color: rgb(...RED) });
        page.drawText("ÍNDICE DE CONTENIDOS", {
          x: 56, y: h - 80,
          font: fontBold, size: 18,
          color: rgb(...BLACK),
        });
        page.drawRectangle({ x: 56, y: h - 95, width: 40, height: 2, color: rgb(...RED) });

        let iy = h - 130;
        pieceList.forEach((p, idx) => {
          if (iy < 60) return;
          const label = STATUS_LABELS[p.status] ?? p.status;
          page.drawText(`${String(idx + 1).padStart(2, "0")}`, {
            x: 56, y: iy, font: fontBold, size: 11, color: rgb(...RED),
          });
          page.drawText(p.title, {
            x: 86, y: iy, font: fontBold, size: 11, color: rgb(...BLACK),
          });
          page.drawText(label, {
            x: w - 130, y: iy, font: fontReg, size: 9, color: rgb(...GRAY),
          });
          page.drawRectangle({ x: 56, y: iy - 8, width: w - 112, height: 0.5, color: rgb(...BORDER) });
          iy -= 28;
        });
      }

      // Piece detail pages
      for (let idx = 0; idx < pieceList.length; idx++) {
        const p = pieceList[idx];
        const page = doc.addPage([W, H]);
        const { width: w, height: h } = page.getSize();

        // Top bar
        page.drawRectangle({ x: 0, y: h - 8, width: w, height: 8, color: rgb(...RED) });

        // Header bg
        page.drawRectangle({ x: 0, y: h - 100, width: w, height: 92, color: rgb(...LGRAY) });

        // Piece number
        page.drawText(`${String(idx + 1).padStart(2, "0")} / ${pieceList.length}`, {
          x: 56, y: h - 38,
          font: fontBold, size: 9, color: rgb(...RED),
        });

        // Title
        const titleLines = wrapText(p.title, 65);
        titleLines.slice(0, 2).forEach((line, li) => {
          page.drawText(line, {
            x: 56, y: h - 58 - li * 18,
            font: fontBold, size: 16, color: rgb(...BLACK),
          });
        });

        // Type badge
        const typeLabel = TYPE_LABELS[p.content_type] ?? p.content_type.toUpperCase();
        page.drawRectangle({ x: w - 180, y: h - 75, width: 124, height: 22, color: rgb(...BLACK) });
        page.drawText(typeLabel, {
          x: w - 174, y: h - 68,
          font: fontBold, size: 8, color: rgb(...WHITE),
        });

        // Status + date
        const statusLabel = STATUS_LABELS[p.status] ?? p.status;
        const dateStr = p.publish_date
          ? new Date(p.publish_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
          : "Sin fecha";

        page.drawText(`Estado: ${statusLabel}`, {
          x: 56, y: h - 96,
          font: fontReg, size: 9, color: rgb(...GRAY),
        });
        page.drawText(`Publicación: ${dateStr}`, {
          x: 240, y: h - 96,
          font: fontReg, size: 9, color: rgb(...GRAY),
        });

        if (p.platforms?.length) {
          page.drawText(`Plataformas: ${p.platforms.join(" · ").toUpperCase()}`, {
            x: 400, y: h - 96,
            font: fontBold, size: 8, color: rgb(...GRAY),
          });
        }

        // Content sections
        let cy = h - 140;
        const SECTION_GAP = 28;
        const LINE_H = 14;
        const MAX_CHARS = 90;

        const sections = [
          { label: "CONCEPTO / DESCRIPCIÓN", value: p.description },
          { label: "COPY OUT", value: p.copy_out },
          { label: "DESCRIPCIÓN VISUAL", value: p.visual_description },
        ];

        for (const sec of sections) {
          if (!sec.value || cy < 80) continue;

          // Section label
          page.drawText(sec.label, {
            x: 56, y: cy,
            font: fontBold, size: 8, color: rgb(...RED),
          });
          cy -= 4;
          page.drawRectangle({ x: 56, y: cy, width: w - 112, height: 0.5, color: rgb(...RED) });
          cy -= 14;

          // Content text
          const lines = wrapText(sec.value, MAX_CHARS);
          for (const line of lines) {
            if (cy < 60) break;
            page.drawText(line, {
              x: 56, y: cy,
              font: fontReg, size: 9, color: rgb(...BLACK),
            });
            cy -= LINE_H;
          }
          cy -= SECTION_GAP;
        }

        // Footer
        page.drawRectangle({ x: 0, y: 0, width: w, height: 36, color: rgb(...LGRAY) });
        page.drawText("513 HUB — CONFIDENCIAL", {
          x: 56, y: 13,
          font: fontBold, size: 7, color: rgb(...GRAY),
        });
        page.drawText(client.name.toUpperCase(), {
          x: w - 150, y: 13,
          font: fontBold, size: 7, color: rgb(...GRAY),
        });
      }
    }

    const pdfBytes = await doc.save();

    const fileName = `513hub_${client.name.replace(/\s+/g, "_")}_${monthLabel.replace(/\s+/g, "_")}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": pdfBytes.length.toString(),
      },
    });
  } catch (err: any) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
