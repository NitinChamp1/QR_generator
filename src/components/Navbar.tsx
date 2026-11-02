'use client';

import React from 'react';
import { TabType } from '@/types';
import { QrCode, ScanText, RefreshCw, Terminal } from 'lucide-react';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="bg-white border-b-2 border-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black text-white border-2 border-black shadow-[2px_2px_0px_0px_#000000] flex items-center justify-center font-mono font-bold text-sm">
              <QrCode className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-extrabold text-base tracking-tight text-black uppercase">
                  OMNI.SYS <span className="text-zinc-500 font-normal">//</span> UTILITY
                </span>
                <span className="og-badge bg-emerald-300 text-black text-[10px] hidden sm:inline-flex">
                  CLIENT_ONLY
                </span>
              </div>
              <p className="text-[10px] font-mono text-zinc-600 hidden md:block">
                SYS_VER: 2026.1 // ZERO_CLOUD // PRIVATE_ENGINE
              </p>
            </div>
          </div>

          {/* OG Navigation Tabs */}
          <nav className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('extractor')}
              className={`og-btn text-xs sm:text-sm py-1.5 px-3 sm:px-4 ${
                activeTab === 'extractor' ? 'bg-yellow-300 text-black' : 'bg-white text-zinc-800'
              }`}
            >
              <ScanText className="w-4 h-4" />
              <span>[1] Image ➡️ QR</span>
            </button>

            <button
              onClick={() => setActiveTab('qr-studio')}
              className={`og-btn text-xs sm:text-sm py-1.5 px-3 sm:px-4 ${
                activeTab === 'qr-studio' ? 'bg-yellow-300 text-black' : 'bg-white text-zinc-800'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>[2] QR Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('converter')}
              className={`og-btn text-xs sm:text-sm py-1.5 px-3 sm:px-4 ${
                activeTab === 'converter' ? 'bg-yellow-300 text-black' : 'bg-white text-zinc-800'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>[3] Converter</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
