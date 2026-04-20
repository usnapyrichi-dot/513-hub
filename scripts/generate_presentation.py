#!/usr/bin/env python3
"""
513 HUB — Monthly Presentation PDF Generator
Reads JSON from stdin, writes PDF bytes to stdout.
"""

import sys
import json
import io
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate

# ─── Brand colors ─────────────────────────────────────────────────────────────
BLACK   = HexColor("#1C1C1C")
RED     = HexColor("#E53935")
GRAY    = HexColor("#949494")
LGRAY   = HexColor("#E5E5E5")
XLIGHT  = HexColor("#FAFAFA")
ORANGE  = HexColor("#FF9500")
GREEN   = HexColor("#34C759")
BLUE    = HexColor("#007AFF")
GOLD    = HexColor("#FFD700")

STATUS_COLOR = {
    "planning":       HexColor("#A8A8A8"),
    "briefed":        HexColor("#A8A8A8"),
    "ideation":       HexColor("#A8A8A8"),
    "idea_approved":  HexColor("#A8A8A8"),
    "pre_production": ORANGE,
    "production":     ORANGE,
    "internal_review":ORANGE,
    "client_review":  GREEN,
    "client_approved":GREEN,
    "client_changes": RED,
    "rework":         RED,
    "scheduled":      BLUE,
    "published":      BLACK,
}

TYPE_LABEL = {
    "reel":               "REEL",
    "carousel_animated":  "CARRUSEL AN.",
    "carousel_static":    "CARRUSEL EST.",
}

# ─── Styles ───────────────────────────────────────────────────────────────────

def make_styles():
    return {
        "cover_agency": ParagraphStyle("cover_agency",
            fontName="Helvetica-Bold", fontSize=10, textColor=HexColor("#949494"),
            alignment=TA_LEFT, spaceAfter=4, letterSpacing=3),
        "cover_title": ParagraphStyle("cover_title",
            fontName="Helvetica-Bold", fontSize=36, textColor=white,
            alignment=TA_LEFT, spaceAfter=8, leading=40),
        "cover_sub": ParagraphStyle("cover_sub",
            fontName="Helvetica", fontSize=13, textColor=HexColor("#CCCCCC"),
            alignment=TA_LEFT, spaceAfter=4),
        "cover_date": ParagraphStyle("cover_date",
            fontName="Helvetica-Bold", fontSize=11, textColor=RED,
            alignment=TA_LEFT, letterSpacing=2),
        "section_label": ParagraphStyle("section_label",
            fontName="Helvetica-Bold", fontSize=8, textColor=GRAY,
            alignment=TA_LEFT, spaceAfter=6, letterSpacing=2),
        "stat_number": ParagraphStyle("stat_number",
            fontName="Helvetica-Bold", fontSize=28, textColor=BLACK,
            alignment=TA_CENTER, leading=32),
        "stat_label": ParagraphStyle("stat_label",
            fontName="Helvetica-Bold", fontSize=7, textColor=GRAY,
            alignment=TA_CENTER, letterSpacing=1.5),
        "piece_title": ParagraphStyle("piece_title",
            fontName="Helvetica-Bold", fontSize=12, textColor=BLACK,
            alignment=TA_LEFT, spaceAfter=3, leading=15),
        "piece_meta": ParagraphStyle("piece_meta",
            fontName="Helvetica", fontSize=8, textColor=GRAY,
            alignment=TA_LEFT, spaceAfter=2),
        "piece_desc": ParagraphStyle("piece_desc",
            fontName="Helvetica", fontSize=9, textColor=HexColor("#444444"),
            alignment=TA_LEFT, leading=13),
        "footer_text": ParagraphStyle("footer_text",
            fontName="Helvetica", fontSize=7, textColor=HexColor("#CCCCCC"),
            alignment=TA_CENTER, letterSpacing=1),
        "body": ParagraphStyle("body",
            fontName="Helvetica", fontSize=10, textColor=BLACK,
            alignment=TA_LEFT, spaceAfter=6, leading=14),
        "heading": ParagraphStyle("heading",
            fontName="Helvetica-Bold", fontSize=16, textColor=BLACK,
            alignment=TA_LEFT, spaceAfter=12, spaceBefore=8),
    }

# ─── Cover page ───────────────────────────────────────────────────────────────

def cover_page(canvas, doc):
    W, H = A4
    # Full black background
    canvas.setFillColor(BLACK)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)

    # Red accent stripe
    canvas.setFillColor(RED)
    canvas.rect(0, H - 6*mm, W, 6*mm, fill=1, stroke=0)

    # "513 HUB" watermark in background
    canvas.saveState()
    canvas.setFillColor(HexColor("#222222"))
    canvas.setFont("Helvetica-Bold", 120)
    canvas.rotate(0)
    canvas.drawString(20*mm, 30*mm, "513")
    canvas.restoreState()


def header_footer(canvas, doc):
    W, H = A4
    # Top border
    canvas.setFillColor(RED)
    canvas.rect(0, H - 3*mm, W, 3*mm, fill=1, stroke=0)
    # Footer line
    canvas.setStrokeColor(LGRAY)
    canvas.setLineWidth(0.5)
    canvas.line(20*mm, 14*mm, W - 20*mm, 14*mm)
    # Footer text
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(GRAY)
    canvas.drawCentredString(W/2, 9*mm, "CONFIDENCIAL — 513 HUB EDITORIAL STUDIO")
    canvas.drawRightString(W - 20*mm, 9*mm, f"PÁG. {doc.page - 1}")


# ─── Main generator ───────────────────────────────────────────────────────────

def generate(data: dict) -> bytes:
    S = make_styles()
    buffer = io.BytesIO()
    W, H = A4

    doc = BaseDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=20*mm, bottomMargin=22*mm,
    )

    # Cover frame (full bleed content area)
    cover_frame = Frame(20*mm, 60*mm, W - 40*mm, H - 80*mm, id="cover")
    content_frame = Frame(20*mm, 22*mm, W - 40*mm, H - 45*mm, id="content")

    doc.addPageTemplates([
        PageTemplate(id="Cover",   frames=[cover_frame], onPage=cover_page),
        PageTemplate(id="Content", frames=[content_frame], onPage=header_footer),
    ])

    story = []

    # ── COVER ──────────────────────────────────────────────────────────────────
    client_name = data.get("client_name", "CLIENTE")
    month_label = data.get("month_label", "")
    agency      = data.get("agency", "513 HUB")
    pieces      = data.get("pieces", [])
    generated   = datetime.now().strftime("%d %b %Y").upper()

    story.append(Spacer(1, 20*mm))
    story.append(Paragraph("513 HUB — EDITORIAL STUDIO", S["cover_agency"]))
    story.append(Spacer(1, 6*mm))
    story.append(Paragraph(client_name.upper(), S["cover_title"]))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph("INFORME MENSUAL DE CONTENIDO", S["cover_sub"]))
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph(month_label.upper(), S["cover_date"]))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(f"GENERADO EL {generated}", S["cover_date"]))

    # Switch to content template
    story.append(PageBreak())

    # ── STATS PAGE ─────────────────────────────────────────────────────────────
    total     = len(pieces)
    published = sum(1 for p in pieces if p.get("status") in ("published", "scheduled"))
    in_prod   = sum(1 for p in pieces if p.get("status") in ("production", "pre_production", "briefed", "internal_review"))
    in_review = sum(1 for p in pieces if p.get("status") in ("client_review", "client_approved", "client_changes", "rework"))
    ideation  = sum(1 for p in pieces if p.get("status") in ("ideation", "planning", "idea_approved"))

    story.append(Paragraph("RESUMEN DEL MES", S["section_label"]))
    story.append(HRFlowable(width="100%", thickness=1, color=LGRAY, spaceAfter=10))

    # Stats grid
    stats_data = [[
        Paragraph(str(total),     S["stat_number"]),
        Paragraph(str(published), S["stat_number"]),
        Paragraph(str(in_prod),   S["stat_number"]),
        Paragraph(str(in_review), S["stat_number"]),
        Paragraph(str(ideation),  S["stat_number"]),
    ],[
        Paragraph("TOTAL",        S["stat_label"]),
        Paragraph("PUBLICADAS",   S["stat_label"]),
        Paragraph("PRODUCCIÓN",   S["stat_label"]),
        Paragraph("REVIEW",       S["stat_label"]),
        Paragraph("IDEACIÓN",     S["stat_label"]),
    ]]

    col_w = (W - 40*mm) / 5
    stats_table = Table(stats_data, colWidths=[col_w]*5, rowHeights=[30*mm, 8*mm])
    stats_table.setStyle(TableStyle([
        ("ALIGN",         (0,0), (-1,-1), "CENTER"),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("BACKGROUND",    (0,0), (0,1),   XLIGHT),
        ("BACKGROUND",    (1,0), (1,1),   HexColor("#F0FDF4")),
        ("BACKGROUND",    (2,0), (2,1),   HexColor("#FFF7ED")),
        ("BACKGROUND",    (3,0), (3,1),   HexColor("#EFF6FF")),
        ("BACKGROUND",    (4,0), (4,1),   XLIGHT),
        ("BOX",           (0,0), (-1,-1), 0.5, LGRAY),
        ("INNERGRID",     (0,0), (-1,-1), 0.5, LGRAY),
        ("TOPPADDING",    (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ]))
    story.append(stats_table)
    story.append(Spacer(1, 10*mm))

    # Platform & type breakdown
    platforms = {}
    types = {}
    for p in pieces:
        for pl in (p.get("platforms") or ["instagram"]):
            platforms[pl] = platforms.get(pl, 0) + 1
        t = p.get("content_type", "reel")
        types[t] = types.get(t, 0) + 1

    if platforms or types:
        story.append(Paragraph("DISTRIBUCIÓN", S["section_label"]))
        story.append(HRFlowable(width="100%", thickness=1, color=LGRAY, spaceAfter=8))

        breakdown_rows = []
        for k, v in sorted(platforms.items(), key=lambda x: -x[1]):
            breakdown_rows.append([
                Paragraph(k.upper(), ParagraphStyle("br", fontName="Helvetica-Bold", fontSize=8, textColor=BLACK, letterSpacing=1)),
                Paragraph(str(v) + " pieza" + ("s" if v != 1 else ""), ParagraphStyle("br2", fontName="Helvetica", fontSize=8, textColor=GRAY)),
            ])
        for k, v in sorted(types.items(), key=lambda x: -x[1]):
            breakdown_rows.append([
                Paragraph(TYPE_LABEL.get(k, k.upper()), ParagraphStyle("br", fontName="Helvetica-Bold", fontSize=8, textColor=BLACK, letterSpacing=1)),
                Paragraph(str(v) + " pieza" + ("s" if v != 1 else ""), ParagraphStyle("br2", fontName="Helvetica", fontSize=8, textColor=GRAY)),
            ])

        if breakdown_rows:
            bt = Table(breakdown_rows, colWidths=[80*mm, 80*mm])
            bt.setStyle(TableStyle([
                ("LINEBELOW", (0,0), (-1,-1), 0.3, LGRAY),
                ("TOPPADDING", (0,0), (-1,-1), 5),
                ("BOTTOMPADDING", (0,0), (-1,-1), 5),
            ]))
            story.append(bt)

    story.append(PageBreak())

    # ── CONTENT PIECES ─────────────────────────────────────────────────────────
    story.append(Paragraph("PIEZAS DE CONTENIDO", S["section_label"]))
    story.append(HRFlowable(width="100%", thickness=1, color=LGRAY, spaceAfter=8))

    for i, p in enumerate(pieces):
        status = p.get("status", "planning")
        status_color = STATUS_COLOR.get(status, GRAY)
        ctype = TYPE_LABEL.get(p.get("content_type", "reel"), "PIEZA")
        platforms_str = " · ".join((p.get("platforms") or ["instagram"])).upper()
        pub_date = p.get("publish_date") or "—"
        desc        = (p.get("description") or "").strip()[:400]
        copy_out    = (p.get("copy_out") or "").strip()[:400]
        visual_desc = (p.get("visual_description") or "").strip()[:300]

        # Number badge + title row
        num_cell = Paragraph(f"<b>{str(i+1).zfill(2)}</b>",
            ParagraphStyle("num", fontName="Helvetica-Bold", fontSize=14,
                           textColor=status_color, alignment=TA_CENTER))

        title_cell = [
            Paragraph(p.get("title", "Sin título"), S["piece_title"]),
            Paragraph(f"{ctype}  ·  {platforms_str}  ·  {pub_date}", S["piece_meta"]),
        ]

        status_badge = Paragraph(status.upper().replace("_", " "),
            ParagraphStyle("badge", fontName="Helvetica-Bold", fontSize=7,
                           textColor=status_color, alignment=TA_RIGHT, letterSpacing=1))

        header_data = [[num_cell, title_cell, status_badge]]
        header_table = Table(header_data, colWidths=[12*mm, 130*mm, 28*mm])
        header_table.setStyle(TableStyle([
            ("VALIGN", (0,0), (-1,-1), "TOP"),
            ("ALIGN",  (2,0), (2,0),   "RIGHT"),
            ("LEFTPADDING",  (0,0), (-1,-1), 3),
            ("RIGHTPADDING", (0,0), (-1,-1), 3),
            ("TOPPADDING",   (0,0), (-1,-1), 0),
            ("BOTTOMPADDING",(0,0), (-1,-1), 2),
        ]))

        block_items = [header_table, Spacer(1, 2*mm)]

        if desc:
            block_items.append(Paragraph(desc, S["piece_desc"]))
            block_items.append(Spacer(1, 2*mm))

        if copy_out:
            block_items.append(Paragraph("COPY OUT", ParagraphStyle(
                "sublabel", fontName="Helvetica-Bold", fontSize=7,
                textColor=GRAY, letterSpacing=1.5, spaceAfter=2)))
            block_items.append(Paragraph(copy_out, S["piece_desc"]))
            block_items.append(Spacer(1, 2*mm))

        if visual_desc:
            block_items.append(Paragraph("DESCRIPCIÓN VISUAL", ParagraphStyle(
                "sublabel2", fontName="Helvetica-Bold", fontSize=7,
                textColor=GRAY, letterSpacing=1.5, spaceAfter=2)))
            block_items.append(Paragraph(visual_desc, S["piece_desc"]))
            block_items.append(Spacer(1, 2*mm))

        block_items.append(HRFlowable(width="100%", thickness=0.5, color=LGRAY, spaceAfter=6))

        story.append(KeepTogether(block_items))

    doc.build(story)
    return buffer.getvalue()


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    raw = sys.stdin.read()
    data = json.loads(raw)
    pdf_bytes = generate(data)
    sys.stdout.buffer.write(pdf_bytes)
