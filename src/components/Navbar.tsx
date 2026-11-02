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
    <header className="bg-white border-b-[1.5px] border-stone-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-stone-900 text-white border-[1.5px] border-stone-900 flex items-center justify-center font-mono font-bold text-xs shadow-[1.5px_1.5px_0px_#292524]">
              <QrCode className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm tracking-tight text-stone-900 uppercase">
                  OMNI.SYS <span className="text-stone-400 font-normal">//</span> UTILITY
                </span>
                <span className="og-badge bg-emerald-100 text-emerald-900 border-emerald-700 hidden sm:inline-flex">
                  CLIENT_READY
                </span>
              </div>
            </div>
          </div>

          {/* Calibrated Navigation Tabs */}
          <nav className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('extractor')}
              className={`og-btn text-xs py-1 px-3 ${
                activeTab === 'extractor'
                  ? 'bg-amber-100 text-stone-900 border-stone-900 font-bold'
                  : 'bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <ScanText className="w-3.5 h-3.5" />
              <span>[1] Image ➡️ QR</span>
            </button>

            <button
              onClick={() => setActiveTab('qr-studio')}
              className={`og-btn text-xs py-1 px-3 ${
                activeTab === 'qr-studio'
                  ? 'bg-amber-100 text-stone-900 border-stone-900 font-bold'
                  : 'bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>[2] QR Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('converter')}
              className={`og-btn text-xs py-1 px-3 ${
                activeTab === 'converter'
                  ? 'bg-amber-100 text-stone-900 border-stone-900 font-bold'
                  : 'bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>[3] Converter</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
