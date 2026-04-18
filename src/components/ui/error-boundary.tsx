"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-12">
          <div className="w-14 h-14 rounded-full bg-[#FFF0F0] flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-[#FF3B30]" />
          </div>
          <h2 className="text-[14px] font-bold uppercase tracking-widest text-[#1C1C1C] mb-2">
            Algo salió mal
          </h2>
          <p className="text-[11px] text-[#949494] mb-6 max-w-sm">
            {this.state.error?.message ?? "Error inesperado"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1C1C1C] hover:bg-[#FF3B30] text-white text-[10px] font-bold uppercase tracking-widest rounded-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
