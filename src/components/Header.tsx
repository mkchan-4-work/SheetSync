import React from 'react';
import { FileSpreadsheet, RefreshCw, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
}

export default function Header({ onRefresh }: HeaderProps) {
  return (
    <header id="app-header" className="bg-white border-b border-gray-200 py-4 px-8 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center shadow-xs">
          <FileSpreadsheet className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center">
            SheetSync 
            <span className="text-green-600 font-semibold text-[10px] border border-green-200 bg-green-50 px-2 py-0.5 rounded ml-2.5 uppercase tracking-wide">
              v1.0
            </span>
          </h1>
          <p className="text-[10px] text-gray-400 font-medium tracking-wide">Google Sheets Webhook Bridge</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Connection status badge */}
        <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500 bg-green-50/50 border border-green-100 py-1.5 px-3.5 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs">Sheets Relay Engine: <strong className="text-gray-900">Operational</strong></span>
        </div>

        {/* Global Manual Sync */}
        <button
          onClick={onRefresh}
          className="p-2 border border-gray-200 hover:border-green-300 hover:bg-green-50 hover:text-green-600 rounded-lg text-gray-400 transition-all cursor-pointer"
          title="Refresh All Webhooks"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
