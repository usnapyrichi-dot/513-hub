"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      alert("Error actualizando la contraseña: " + error.message);
      setIsLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex bg-login-gradient items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 bg-[var(--color-on-surface)] rounded-lg flex items-center justify-center text-[var(--color-surface-container-lowest)] font-bold text-sm font-headline tracking-normal">
            5
          </div>
          <span className="font-headline text-sm tracking-[0.05em] text-[var(--color-on-surface)]">
            513 HUB
          </span>
        </div>

        <div className="surface-card p-10 space-y-8">
          <div className="space-y-2">
            <h2 className="font-display text-2xl text-[var(--color-on-surface)]" style={{ letterSpacing: "-0.02em" }}>
              BIENVENIDO
            </h2>
            <p className="text-sm text-[var(--color-on-surface-variant)] font-body">
              Establece tu contraseña para empezar a usar la plataforma.
            </p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="password" className="font-label text-[var(--color-on-surface-variant)]">
                NUEVA CONTRASEÑA
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={isLoading || password.length < 6}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  GUARDAR Y ENTRAR
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
