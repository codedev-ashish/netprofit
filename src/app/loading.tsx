"use client";

import React from 'react';

export default function Loading() {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-color)',
      zIndex: 9999,
    }}>
      <div style={{ position: 'relative', width: '80px', height: '80px' }}>
        {/* Grey background stroke */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--border-color, #e2e8f0)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', width: '100%', height: '100%' }}>
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
          <polyline points="16 7 22 7 22 13"></polyline>
        </svg>
        {/* Animated orange stroke */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ff7300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ 
          position: 'absolute', 
          width: '100%', 
          height: '100%',
          animation: 'iconFillUp 1s ease-in-out infinite alternate',
          clipPath: 'inset(100% 0 0 0)'
        }}>
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
          <polyline points="16 7 22 7 22 13"></polyline>
        </svg>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes iconFillUp {
          0% { clip-path: inset(100% 0 0 0); }
          100% { clip-path: inset(0 0 0 0); }
        }
      `}} />
    </div>
  );
}
