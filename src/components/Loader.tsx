"use client";

import React from "react";
import { TrendingUp } from "lucide-react";

interface LoaderProps {
  text?: string;
  size?: number;
}

export default function Loader({ text = "Loading...", size = 48 }: LoaderProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem', width: '100%' }}>
      <style>{`
        @keyframes fillUp {
          0% { clip-path: inset(100% 0 0 0); }
          50% { clip-path: inset(0 0 0 0); }
          100% { clip-path: inset(100% 0 0 0); }
        }
      `}</style>
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Background icon (dimmed) */}
        <div style={{ position: 'absolute', top: 0, left: 0, color: 'var(--border-color)', opacity: 0.3 }}>
          <TrendingUp size={size} strokeWidth={2.5} />
        </div>
        {/* Foreground icon (colored, animated) */}
        <div style={{ position: 'absolute', top: 0, left: 0, color: 'var(--accent-color)', animation: 'fillUp 2s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}>
          <TrendingUp size={size} strokeWidth={2.5} />
        </div>
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500, letterSpacing: '0.01em' }}>{text}</div>
    </div>
  );
}
