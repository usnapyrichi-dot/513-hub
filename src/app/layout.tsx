import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "513 HUB | Social Media Agency Dashboard",
  description:
    "Plataforma centralizada para gestión de contenidos de social media para marcas de automoción. Planificación, ideación, producción y entrega potenciadas por IA.",
  keywords: [
    "social media",
    "agency",
    "dashboard",
    "automotive",
    "AI",
    "content management",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[var(--color-surface)] text-[var(--color-on-surface)] antialiased">
        {children}
      </body>
    </html>
  );
}
