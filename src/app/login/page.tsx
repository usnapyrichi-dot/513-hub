"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  };

  return (
    <div className="min-h-screen flex bg-login-gradient">
      {/* Left — Editorial branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[var(--color-on-surface)] rounded-lg flex items-center justify-center text-[var(--color-surface-container-lowest)] font-bold text-sm font-headline tracking-normal">
            5
          </div>
          <span className="font-headline text-sm tracking-[0.05em] text-[var(--color-on-surface)]">
            513 HUB
          </span>
        </div>

        {/* Hero text — Large display */}
        <div className="space-y-8 max-w-xl">
          <h1 className="font-display text-5xl leading-[1.05] text-[var(--color-on-surface)]" style={{ letterSpacing: "-0.02em" }}>
            PRECISION
            <br />
            IN EVERY
            <br />
            <span className="text-[var(--color-accent-red)]">DETAIL.</span>
          </h1>
          <p className="text-base text-[var(--color-on-surface-variant)] leading-relaxed font-body max-w-md">
            Centraliza toda la actividad de tu agencia creativa. Planificación, ideación, producción y entrega, potenciadas por inteligencia artificial.
          </p>

          {/* Feature tags */}
          <div className="flex items-center gap-3">
            {["REELS", "CARRUSELES", "IA STUDIO", "ANALYTICS"].map((tag) => (
              <span
                key={tag}
                className="font-label text-[var(--color-on-surface-variant)] px-4 py-2 bg-[var(--color-surface-container-low)] rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <p className="font-label text-[var(--color-outline)]">
          © 2026 513 HUB. ALL RIGHTS RESERVED.
        </p>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-8">
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
                SIGN IN
              </h2>
              <p className="text-sm text-[var(--color-on-surface-variant)] font-body">
                Inicia sesión para acceder al panel
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="font-label text-[var(--color-on-surface-variant)]">
                  EMAIL
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="input-field"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="font-label text-[var(--color-on-surface-variant)]">
                  PASSWORD
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
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    INICIAR SESIÓN
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full ghost-border border-t border-l-0 border-r-0 border-b-0" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[var(--color-surface-container-lowest)] px-4 font-label text-[var(--color-outline)]">
                  O CONTINÚA CON
                </span>
              </div>
            </div>

            <Button variant="secondary" className="w-full h-11 gap-2.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              GOOGLE
            </Button>
          </div>

          <p className="text-center font-label text-[var(--color-outline)]">
            ¿PROBLEMAS?{" "}
            <a href="#" className="text-[var(--color-accent-red)] hover:underline">
              CONTACTA AL ADMIN
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
