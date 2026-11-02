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
    <div className="min-h-screen flex flex-col text-black selection:bg-[#ff5500] selection:text-white">
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
      <footer className="mt-auto border-t border-black bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs text-stone-700">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 font-bold text-black">
                <ShieldCheck className="w-4 h-4 text-[#ff5500]" />
                [ PRIVACY: 100% IN-BROWSER ]
              </span>
              <span className="text-stone-300">|</span>
              <span className="flex items-center gap-1.5 font-bold text-black">
                <Cpu className="w-4 h-4 text-black" />
                [ LATENCY: ZERO_SERVER ]
              </span>
              <span className="text-stone-300">|</span>
              <span className="flex items-center gap-1.5 font-bold text-black">
                <Terminal className="w-4 h-4 text-[#ff5500]" />
                [ SPEC: ISO/IEC 18004 ]
              </span>
            </div>

            <div className="text-[11px] text-black font-bold uppercase tracking-wider">
              OMNI<span className="text-[#ff5500]">.SYS</span> // WORKBENCH UTILITY
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
