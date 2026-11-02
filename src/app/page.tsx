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
    <div className="min-h-screen flex flex-col text-black selection:bg-yellow-300 selection:text-black">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'extractor' && (
          <ImageFieldExtractor onSendToQRStudio={handleSendToQRStudio} />
        )}

        {activeTab === 'qr-studio' && (
          <QRStudio initialPayload={handoffPayload} initialType={handoffType} />
        )}

        {activeTab === 'converter' && <FormatConverter />}
      </main>

      {/* Retro Utility Footer */}
      <footer className="mt-auto border-t-2 border-black bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                [ PRIVACY: 100% IN-BROWSER ]
              </span>
              <span className="text-zinc-300">|</span>
              <span className="flex items-center gap-1.5 font-bold">
                <Cpu className="w-4 h-4 text-blue-600" />
                [ LATENCY: ZERO_SERVER ]
              </span>
              <span className="text-zinc-300">|</span>
              <span className="flex items-center gap-1.5 font-bold">
                <Terminal className="w-4 h-4 text-amber-600" />
                [ SPEC: ISO/IEC 18004 ]
              </span>
            </div>

            <div className="text-[11px] text-zinc-600 font-bold">
              OMNI.SYS // WORKBENCH UTILITY
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
