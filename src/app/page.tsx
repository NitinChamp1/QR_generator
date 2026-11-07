'use client';

import React, { useState } from 'react';
import { TabType, QRDataType } from '@/types';
import { Navbar } from '@/components/Navbar';
import { ImageFieldExtractor } from '@/components/ImageFieldExtractor';
import { QRStudio } from '@/components/QRStudio';
import { FormatConverter } from '@/components/FormatConverter';
import { ShieldCheck, Cpu, Terminal } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('extractor');
  const [handoffPayload, setHandoffPayload] = useState<string>('');
  const [handoffType, setHandoffType] = useState<QRDataType>('vcard');

  const handleSendToQRStudio = (payload: string, type: 'vcard' | 'text' | 'json' | 'url') => {
    setHandoffPayload(payload);
    setHandoffType(type);
    setActiveTab('qr-studio');
  };

  return (
    <div className="min-h-screen flex flex-col text-[#1e3d59] selection:bg-[#ff6e40] selection:text-white">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7">
        {activeTab === 'extractor' && (
          <ImageFieldExtractor onSendToQRStudio={handleSendToQRStudio} />
        )}

        {activeTab === 'qr-studio' && (
          <QRStudio initialPayload={handoffPayload} initialType={handoffType} />
        )}

        {activeTab === 'converter' && <FormatConverter />}
      </main>

      {/* Industrial Swiss Utility Footer */}
      <footer className="mt-auto border-t-2 border-[#1e3d59] bg-[#fdfcf9] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs text-[#1e3d59]/80">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 font-bold text-[#1e3d59]">
                <ShieldCheck className="w-4 h-4 text-[#ff6e40]" />
                [ PRIVACY: 100% IN-BROWSER ]
              </span>
              <span className="text-[#1e3d59]/30">|</span>
              <span className="flex items-center gap-1.5 font-bold text-[#1e3d59]">
                <Cpu className="w-4 h-4 text-[#ffc13b]" />
                [ LATENCY: ZERO_SERVER ]
              </span>
              <span className="text-[#1e3d59]/30">|</span>
              <span className="flex items-center gap-1.5 font-bold text-[#1e3d59]">
                <Terminal className="w-4 h-4 text-[#ff6e40]" />
                [ SPEC: ISO/IEC 18004 ]
              </span>
            </div>

            <div className="text-[11px] text-[#1e3d59] font-bold uppercase tracking-wider">
              OMNI<span className="text-[#ff6e40]">.SYS</span> // WORKBENCH UTILITY
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
