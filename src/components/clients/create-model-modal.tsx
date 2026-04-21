"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X, Loader2, CarFront, Package, Trash2, Link as LinkIcon, Upload, UploadCloud } from "lucide-react";
import { createClientModel } from "@/app/actions/clients";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function CreateModelModal({ clientId }: { clientId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productType, setProductType] = useState<"vehicle" | "other">("vehicle");
  const [features, setFeatures] = useState<{ key: string; value: string }[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFileChange(file: File | null) {
    if (!file) return;
    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setThumbnailPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFileChange(file);
  }

  function clearThumbnail() {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    formData.append("product_type", productType);
    if (productType === "other" && features.length > 0) {
      formData.append("features", JSON.stringify(features));
    }

    // If user picked a file, upload to Supabase Storage first
    if (thumbnailFile) {
      const supabase = createClient();
      const ext = thumbnailFile.name.split(".").pop();
      const path = `thumbnails/${clientId}/${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("thumbnails")
        .upload(path, thumbnailFile, { upsert: true, contentType: thumbnailFile.type });
      if (uploadError) {
        alert("Error subiendo imagen: " + uploadError.message);
        setIsSubmitting(false);
        return;
      }
      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from("thumbnails").getPublicUrl(uploadData.path);
      formData.append("thumbnail_url", publicUrl);
    }

    const result = await createClientModel(clientId, formData);
    setIsSubmitting(false);

    if (result.success) {
      setIsOpen(false);
      setFeatures([]);
      setProductType("vehicle");
      clearThumbnail();
      router.refresh();
    } else {
      alert("Error: " + result.error);
    }
  }

  const addFeature = () => {
    setFeatures([...features, { key: "", value: "" }]);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, field: "key" | "value", val: string) => {
    const newFeatures = [...features];
    newFeatures[index][field] = val;
    setFeatures(newFeatures);
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-[#1C1C1C] hover:bg-black text-[10px] uppercase tracking-widest px-6 h-12 rounded-sm font-bold text-white shadow-sm transition-all"
      >
        <Plus className="w-4 h-4 mr-2" />
        AÑADIR PRODUCTO / MODELO
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#FAFAFA]/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="relative w-full max-w-lg bg-white rounded-sm shadow-[var(--shadow-elevated)] border border-[#E5E5E5] overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="w-12 h-12 rounded-sm bg-[#F8F6F6] flex items-center justify-center mb-4 border border-[#E5E5E5]">
                    {productType === "vehicle" ? (
                      <CarFront className="w-6 h-6 text-[#1C1C1C]" />
                    ) : (
                      <Package className="w-6 h-6 text-[#1C1C1C]" />
                    )}
                  </div>
                  <h2 className="text-2xl font-headline font-bold uppercase tracking-tight text-[#1C1C1C]">
                    Registrar {productType === "vehicle" ? "Vehículo" : "Producto"}
                  </h2>
                  <p className="text-[13px] text-[#949494] font-medium mt-1">
                    Añade un modelo o producto al catálogo de la marca
                  </p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F8F6F6] text-[#949494] hover:text-[#1C1C1C] hover:bg-[#E5E5E5] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Toggle Vehículo vs Otro */}
              <div className="flex bg-[#F8F6F6] p-1 rounded-sm border border-[#E5E5E5] mb-8">
                <button
                  type="button"
                  onClick={() => setProductType("vehicle")}
                  className={`flex-1 h-10 text-[11px] font-bold uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2 ${
                    productType === "vehicle" 
                      ? "bg-white text-[#1C1C1C] shadow-sm border border-[#E5E5E5]" 
                      : "text-[#949494] hover:text-[#1C1C1C]"
                  }`}
                >
                  <CarFront className="w-4 h-4" />
                  Vehículo
                </button>
                <button
                  type="button"
                  onClick={() => setProductType("other")}
                  className={`flex-1 h-10 text-[11px] font-bold uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2 ${
                    productType === "other" 
                      ? "bg-white text-[#1C1C1C] shadow-sm border border-[#E5E5E5]" 
                      : "text-[#949494] hover:text-[#1C1C1C]"
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Otro Producto
                </button>
              </div>

              <form action={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-[#949494]">
                    Nombre del {productType === "vehicle" ? "Modelo" : "Producto"}
                  </label>
                  <input
                    id="name"
                    name="name"
                    required
                    placeholder={productType === "vehicle" ? "Ej. 911 Carrera, Macan..." : "Ej. Crema facial de noche"}
                    className="w-full h-12 px-4 rounded-sm border border-[#E5E5E5] text-[14px] bg-[#FAFAFA] focus:bg-white focus:outline-none focus:border-[#1C1C1C] transition-colors font-medium text-[#1C1C1C] placeholder:text-[#D1D1D1]"
                  />
                </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <label htmlFor="category" className="text-[10px] font-bold uppercase tracking-widest text-[#949494]">
                      Categoría / Segmento
                    </label>
                    <input
                      id="category"
                      name="category"
                      placeholder={productType === "vehicle" ? "Ej. SUV, Deportivo" : "Ej. Cosmética"}
                      className="w-full h-12 px-4 rounded-sm border border-[#E5E5E5] text-[14px] bg-[#FAFAFA] focus:bg-white focus:outline-none focus:border-[#1C1C1C] transition-colors font-medium text-[#1C1C1C] placeholder:text-[#D1D1D1]"
                    />
                  </div>

                  {productType === "vehicle" && (
                    <div className="space-y-2">
                      <label htmlFor="year" className="text-[10px] font-bold uppercase tracking-widest text-[#949494]">
                        Año de Lanzamiento
                      </label>
                      <input
                        id="year"
                        name="year"
                        type="number"
                        defaultValue={new Date().getFullYear()}
                        className="w-full h-12 px-4 rounded-sm border border-[#E5E5E5] text-[14px] bg-[#FAFAFA] focus:bg-white focus:outline-none focus:border-[#1C1C1C] transition-colors font-medium text-[#1C1C1C]"
                      />
                    </div>
                  )}
                </div>

                {/* Thumbnail upload */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#949494] flex items-center gap-1.5">
                    <UploadCloud className="w-3.5 h-3.5" />
                    Miniatura del Producto
                  </label>

                  {thumbnailPreview ? (
                    /* Preview state */
                    <div className="relative w-full h-36 rounded-sm overflow-hidden border border-[#E5E5E5] group">
                      <img src={thumbnailPreview} alt="preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                        <button
                          type="button"
                          onClick={clearThumbnail}
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-[#1C1C1C] rounded-full w-8 h-8 flex items-center justify-center shadow"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Dropzone */
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      className={`w-full h-28 border-2 border-dashed rounded-sm flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                        isDragging
                          ? "border-[#1C1C1C] bg-[#F8F6F6]"
                          : "border-[#E5E5E5] hover:border-[#1C1C1C] bg-[#FAFAFA]"
                      }`}
                    >
                      <Upload className="w-5 h-5 text-[#D1D1D1]" />
                      <span className="text-[11px] text-[#949494] font-medium text-center">
                        Arrastra o <span className="text-[#1C1C1C] font-bold underline">selecciona</span> una imagen
                      </span>
                      <span className="text-[10px] text-[#D1D1D1]">PNG, JPG, WEBP · Max 10 MB</span>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="drive_folder_url" className="text-[10px] font-bold uppercase tracking-widest text-[#949494] flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5" />
                    Enlace a Carpeta en Drive
                  </label>
                  <input
                    id="drive_folder_url"
                    name="drive_folder_url"
                    type="url"
                    placeholder="https://drive.google.com/..."
                    className="w-full h-12 px-4 rounded-sm border border-[#E5E5E5] text-[14px] bg-[#FAFAFA] focus:bg-white focus:outline-none focus:border-[#1C1C1C] transition-colors font-medium text-[#1C1C1C] placeholder:text-[#D1D1D1]"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-[#E5E5E5]">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#1C1C1C]">
                      {productType === "vehicle" ? "Especificaciones Técnicas" : "Características / Detalles"}
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addFeature}
                      className="h-8 px-3 text-[10px] uppercase tracking-widest"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Añadir
                    </Button>
                  </div>

                  {features.length === 0 ? (
                    <p className="text-xs text-[#949494]">
                      {productType === "vehicle"
                        ? "Ej. Motorización, Potencia, Tracción, Equipamiento…"
                        : "No se han añadido detalles aún."}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {features.map((feature, i) => (
                        <div key={i} className="flex gap-2 items-center bg-[#F8F6F6] p-2 rounded-sm border border-[#E5E5E5]">
                          <input
                            type="text"
                            required
                            placeholder={productType === "vehicle" ? "Ej. Potencia" : "Ej. Material"}
                            value={feature.key}
                            onChange={(e) => updateFeature(i, "key", e.target.value)}
                            className="w-1/3 h-9 px-3 rounded-sm border border-[#E5E5E5] text-xs focus:outline-none focus:border-[#1C1C1C]"
                          />
                          <input
                            type="text"
                            required
                            placeholder={productType === "vehicle" ? "Ej. 280 CV" : "Ej. Aluminio reforzado"}
                            value={feature.value}
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

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-14 bg-[var(--color-accent-red)] hover:bg-black text-white font-bold text-[11px] uppercase tracking-widest rounded-sm transition-all mt-8"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Guardando...</>
                  ) : (
                    `Guardar ${productType === "vehicle" ? "Vehículo" : "Producto"}`
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
