'use client';

import React from 'react';
import { TabType } from '@/types';
import { QrCode, ScanText, RefreshCw } from 'lucide-react';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="bg-white border-b-2 border-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & System Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center border-2 border-black bg-white shadow-[2px_2px_0px_#111] overflow-hidden">
              <div className="w-9 h-9 bg-[#ff5500] text-white flex items-center justify-center">
                <QrCode className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="px-3 py-1 font-mono font-black text-xs tracking-tight text-black uppercase">
                OMNI<span className="text-[#ff5500]">.SYS</span>
              </span>
            </div>

            <span className="tako-badge hidden sm:inline-flex">
              CLIENT_LOCAL
            </span>
          </div>

          {/* TAKO Style Segmented Navigation */}
          <nav className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('extractor')}
              className={`tako-btn ${activeTab === 'extractor' ? 'tako-btn-orange' : ''}`}
            >
              <ScanText className="w-3.5 h-3.5" />
              <span>[1] Image → QR</span>
            </button>

            <button
              onClick={() => setActiveTab('qr-studio')}
              className={`tako-btn ${activeTab === 'qr-studio' ? 'tako-btn-orange' : ''}`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>[2] QR Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('converter')}
              className={`tako-btn ${activeTab === 'converter' ? 'tako-btn-orange' : ''}`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>[3] Converter</span>
            </button>
          </nav>

          {/* Right Status Indicator */}
          <div className="hidden md:flex items-center gap-2 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#ff5500] animate-pulse" />
            <span className="font-bold text-black">ONLINE</span>
            <span className="text-stone-400">|</span>
            <span className="text-stone-500 font-medium">v2026.11</span>
          </div>
        </div>
      </div>
    </header>
  );
};
