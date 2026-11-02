'use client';

import React, { useState } from 'react';
import { TabType, QRDataType } from '@/types';
import { Navbar } from '@/components/Navbar';
import { ImageFieldExtractor } from '@/components/ImageFieldExtractor';
import { QRStudio } from '@/components/QRStudio';
import { FormatConverter } from '@/components/FormatConverter';
import { ShieldCheck, Zap, Sparkles, Heart } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500 selection:text-white">
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

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xs py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" /> 100% Client-Side Private
              </span>
              <span className="flex items-center gap-1.5 font-medium text-indigo-600 dark:text-indigo-400">
                <Zap className="w-4 h-4" /> Zero Server Latency
              </span>
              <span className="flex items-center gap-1.5 font-medium text-violet-600 dark:text-violet-400">
                <Sparkles className="w-4 h-4" /> Vercel Optimized
              </span>
            </div>

            <p className="flex items-center gap-1">
              Built with Next.js, Tailwind CSS &amp; TypeScript. Ready for Vercel.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
