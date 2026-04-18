import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getContentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    reel: "Reel",
    carousel_animated: "Carrusel Animado",
    carousel_static: "Carrusel Estático",
  };
  return labels[type] || type;
}

export function getContentTypeColor(type: string): string {
  const colors: Record<string, string> = {
    reel: "var(--color-reel)",
    carousel_animated: "var(--color-carousel-animated)",
    carousel_static: "var(--color-carousel-static)",
  };
  return colors[type] || "var(--color-muted)";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    planning: "Planificación",
    briefed: "Briefing",
    ideation: "Ideación",
    idea_approved: "Idea Aprobada",
    pre_production: "Pre-producción",
    production: "Producción",
    internal_review: "Revisión Interna",
    client_review: "Revisión Cliente",
    client_approved: "Aprobado",
    client_changes: "Cambios Cliente",
    rework: "Retrabajo",
    scheduled: "Programado",
    published: "Publicado",
  };
  return labels[status] || status;
}
