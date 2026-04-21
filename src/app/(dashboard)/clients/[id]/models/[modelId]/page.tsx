"use client";

import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, CarFront, Package, ExternalLink, Upload, Trash2, Plus, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";

interface Feature { key: string; value: string; }

interface Product {
  id: string;
  client_id: string;
  name: string;
  product_type: "vehicle" | "other" | null;
  category: string | null;
  year: number | null;
  thumbnail_url: string | null;
  drive_folder_url: string | null;
  features: Feature[] | null;
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string; modelId: string }>;
}) {
  const { id: clientId, modelId } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: prod }, { data: client }] = await Promise.all([
        supabase.from("car_models").select("*").eq("id", modelId).single(),
        supabase.from("clients").select("name").eq("id", clientId).single(),
      ]);
      if (prod) {
        setProduct({
          ...prod,
          features: Array.isArray(prod.features) ? prod.features : [],
        });
        setThumbnailPreview(prod.thumbnail_url ?? null);
      }
      if (client) setClientName(client.name);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId, clientId]);

  function handleFileChange(file: File | null) {
    if (!file) return;
    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setThumbnailPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function addFeature() {
    if (!product) return;
    setProduct({ ...product, features: [...(product.features ?? []), { key: "", value: "" }] });
  }

  function removeFeature(i: number) {
    if (!product) return;
    setProduct({ ...product, features: (product.features ?? []).filter((_, idx) => idx !== i) });
  }

  function updateFeature(i: number, field: "key" | "value", val: string) {
    if (!product) return;
    const next = [...(product.features ?? [])];
    next[i] = { ...next[i], [field]: val };
    setProduct({ ...product, features: next });
  }

  async function handleSave() {
    if (!product) return;
    setSaving(true);

    let thumbnail_url = product.thumbnail_url;

    if (thumbnailFile) {
      const ext = thumbnailFile.name.split(".").pop();
      const path = `thumbnails/${clientId}/${Date.now()}.${ext}`;
      const { data: uploaded, error } = await supabase.storage
        .from("thumbnails")
        .upload(path, thumbnailFile, { upsert: true, contentType: thumbnailFile.type });
      if (error) {
        alert("Error subiendo imagen: " + error.message);
        setSaving(false);
        return;
      }
      thumbnail_url = supabase.storage.from("thumbnails").getPublicUrl(uploaded.path).data.publicUrl;
    }

    const { error } = await supabase
      .from("car_models")
      .update({
        name: product.name,
        product_type: product.product_type,
        category: product.category,
        year: product.year,
        thumbnail_url,
        drive_folder_url: product.drive_folder_url,
        features: product.features,
      })
      .eq("id", modelId);

    setSaving(false);
    if (error) {
      alert("Error guardando: " + error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="w-6 h-6 animate-spin text-[#949494]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <p className="text-[#949494]">Producto no encontrado.</p>
      </div>
    );
  }

  const isVehicle = product.product_type !== "other";

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="border-b border-[#E5E5E5] bg-white px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/clients/${clientId}`}>
            <button className="w-9 h-9 flex items-center justify-center rounded-sm border border-[#E5E5E5] hover:border-[#1C1C1C] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#949494]">
              {clientName} / Catálogo de Modelos
            </p>
            <h1 className="text-xl font-headline font-bold uppercase tracking-tight text-[#1C1C1C] leading-tight">
              {product.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {product.drive_folder_url && (
            <a href={product.drive_folder_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2 h-10 text-[10px] font-bold uppercase tracking-widest border-[#E5E5E5]">
                <ExternalLink className="w-4 h-4" /> Abrir Drive
              </Button>
            </a>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 h-10 text-[10px] font-bold uppercase tracking-widest bg-[#1C1C1C] hover:bg-[var(--color-accent-red)] text-white transition-colors"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
            ) : saved ? (
              <><Save className="w-4 h-4" /> Guardado ✓</>
            ) : (
              <><Save className="w-4 h-4" /> Guardar cambios</>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1100px] mx-auto px-12 py-10 grid grid-cols-3 gap-10">
        
        {/* Left column: main fields */}
        <div className="col-span-2 space-y-8">

          {/* Type toggle */}
          <div className="bg-white border border-[#E5E5E5] rounded-sm p-6 space-y-5">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#949494]">Tipo de Producto</h2>
            <div className="flex bg-[#F8F6F6] p-1 rounded-sm border border-[#E5E5E5] max-w-xs">
              {(["vehicle", "other"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setProduct({ ...product, product_type: type })}
                  className={`flex-1 h-10 text-[11px] font-bold uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2 ${
                    product.product_type === type
                      ? "bg-white text-[#1C1C1C] shadow-sm border border-[#E5E5E5]"
                      : "text-[#949494] hover:text-[#1C1C1C]"
                  }`}
                >
                  {type === "vehicle" ? <CarFront className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                  {type === "vehicle" ? "Vehículo" : "Otro"}
                </button>
              ))}
            </div>
          </div>

          {/* Core info */}
          <div className="bg-white border border-[#E5E5E5] rounded-sm p-6 space-y-5">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#949494]">Información General</h2>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#949494]">Nombre</label>
              <input
                value={product.name}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                className="w-full h-12 px-4 rounded-sm border border-[#E5E5E5] text-[14px] bg-[#FAFAFA] focus:bg-white focus:outline-none focus:border-[#1C1C1C] font-medium text-[#1C1C1C]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#949494]">Categoría / Segmento</label>
                <input
                  value={product.category ?? ""}
                  onChange={(e) => setProduct({ ...product, category: e.target.value })}
                  placeholder={isVehicle ? "Ej. SUV, Coupé" : "Ej. Cosmética"}
                  className="w-full h-12 px-4 rounded-sm border border-[#E5E5E5] text-[14px] bg-[#FAFAFA] focus:bg-white focus:outline-none focus:border-[#1C1C1C] font-medium text-[#1C1C1C] placeholder:text-[#D1D1D1]"
                />
              </div>
              {isVehicle && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#949494]">Año</label>
                  <input
                    type="number"
                    value={product.year ?? ""}
                    onChange={(e) => setProduct({ ...product, year: parseInt(e.target.value) || null })}
                    className="w-full h-12 px-4 rounded-sm border border-[#E5E5E5] text-[14px] bg-[#FAFAFA] focus:bg-white focus:outline-none focus:border-[#1C1C1C] font-medium text-[#1C1C1C]"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#949494]">Enlace a Carpeta en Drive</label>
              <input
                type="url"
                value={product.drive_folder_url ?? ""}
                onChange={(e) => setProduct({ ...product, drive_folder_url: e.target.value })}
                placeholder="https://drive.google.com/..."
                className="w-full h-12 px-4 rounded-sm border border-[#E5E5E5] text-[14px] bg-[#FAFAFA] focus:bg-white focus:outline-none focus:border-[#1C1C1C] font-medium text-[#1C1C1C] placeholder:text-[#D1D1D1]"
              />
            </div>
          </div>

          {/* Features */}
          <div className="bg-white border border-[#E5E5E5] rounded-sm p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#949494]">
                {isVehicle ? "Especificaciones Técnicas" : "Características / Detalles"}
              </h2>
              <Button
                type="button"
                variant="outline"
                onClick={addFeature}
                className="h-8 px-3 text-[10px] uppercase tracking-widest"
              >
                <Plus className="w-3 h-3 mr-1" /> Añadir
              </Button>
            </div>

            {(!product.features || product.features.length === 0) ? (
              <p className="text-xs text-[#949494]">
                {isVehicle
                  ? "Añade especificaciones técnicas: potencia, motor, tracción, equipamiento…"
                  : "Añade detalles clave del producto."}
              </p>
            ) : (
              <div className="space-y-3">
                {product.features.map((feat, i) => (
                  <div key={i} className="flex gap-2 items-center bg-[#F8F6F6] p-2 rounded-sm border border-[#E5E5E5]">
                    <input
                      type="text"
                      placeholder={isVehicle ? "Ej. Potencia" : "Ej. Material"}
                      value={feat.key}
                      onChange={(e) => updateFeature(i, "key", e.target.value)}
                      className="w-1/3 h-9 px-3 rounded-sm border border-[#E5E5E5] text-xs focus:outline-none focus:border-[#1C1C1C]"
                    />
                    <input
                      type="text"
                      placeholder={isVehicle ? "Ej. 280 CV" : "Ej. Aluminio"}
                      value={feat.value}
                      onChange={(e) => updateFeature(i, "value", e.target.value)}
                      className="flex-1 h-9 px-3 rounded-sm border border-[#E5E5E5] text-xs focus:outline-none focus:border-[#1C1C1C]"
                    />
                    <button
                      type="button"
                      onClick={() => removeFeature(i)}
                      className="w-9 h-9 flex items-center justify-center text-[#949494] hover:text-[var(--color-accent-red)] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: thumbnail */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white border border-[#E5E5E5] rounded-sm p-6 space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#949494]">Miniatura</h2>

            {thumbnailPreview ? (
              <div className="relative w-full aspect-video rounded-sm overflow-hidden border border-[#E5E5E5] group">
                <img src={thumbnailPreview} alt="thumbnail" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setThumbnailPreview(null);
                      setThumbnailFile(null);
                      setProduct({ ...product, thumbnail_url: null });
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-[#1C1C1C] rounded-full w-8 h-8 flex items-center justify-center shadow"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file && file.type.startsWith("image/")) handleFileChange(file);
                }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                className={`w-full aspect-video border-2 border-dashed rounded-sm flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                  isDragging
                    ? "border-[#1C1C1C] bg-[#F8F6F6]"
                    : "border-[#E5E5E5] hover:border-[#1C1C1C] bg-[#FAFAFA]"
                }`}
              >
                <Upload className="w-5 h-5 text-[#D1D1D1]" />
                <span className="text-[11px] text-[#949494] font-medium text-center px-4">
                  Arrastra o <span className="text-[#1C1C1C] font-bold underline">selecciona</span> imagen
                </span>
                <span className="text-[10px] text-[#D1D1D1]">PNG, JPG, WEBP</span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-9 text-[10px] font-bold uppercase tracking-widest border-[#E5E5E5]"
            >
              <Upload className="w-3.5 h-3.5 mr-2" />
              {thumbnailPreview ? "Cambiar imagen" : "Subir imagen"}
            </Button>
          </div>

          {/* Quick info card */}
          <div className="bg-white border border-[#E5E5E5] rounded-sm p-6 space-y-3">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#949494]">Resumen</h2>
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#949494] font-bold uppercase tracking-widest text-[10px]">Tipo</span>
                <span className="text-[#1C1C1C] font-medium capitalize">{product.product_type === "other" ? "Otro producto" : "Vehículo"}</span>
              </div>
              {product.category && (
                <div className="flex justify-between text-xs">
                  <span className="text-[#949494] font-bold uppercase tracking-widest text-[10px]">Categoría</span>
                  <span className="text-[#1C1C1C] font-medium">{product.category}</span>
                </div>
              )}
              {product.year && (
                <div className="flex justify-between text-xs">
                  <span className="text-[#949494] font-bold uppercase tracking-widest text-[10px]">Año</span>
                  <span className="text-[#1C1C1C] font-medium">{product.year}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-[#949494] font-bold uppercase tracking-widest text-[10px]">Specs</span>
                <span className="text-[#1C1C1C] font-medium">{(product.features ?? []).length} entradas</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#949494] font-bold uppercase tracking-widest text-[10px]">Drive</span>
                <span className="text-[#1C1C1C] font-medium">{product.drive_folder_url ? "✓ Enlazado" : "—"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
