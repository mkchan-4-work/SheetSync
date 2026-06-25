import React, { useState } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import WebhookDetails from './components/WebhookDetails';
import CreateWebhookModal from './components/CreateWebhookModal';
import { Sparkles, FileSpreadsheet } from 'lucide-react';

export default function App() {
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefreshAll = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-50/50 flex flex-col font-sans antialiased text-gray-900">
      
      {/* Header Panel */}
      <Header onRefresh={handleRefreshAll} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-12 py-8">
        {selectedWebhookId ? (
          <WebhookDetails
            webhookId={selectedWebhookId}
            onBack={() => setSelectedWebhookId(null)}
            onDeleted={() => {
              setSelectedWebhookId(null);
              handleRefreshAll();
            }}
          />
        ) : (
          <Dashboard
            onSelectWebhook={(id) => setSelectedWebhookId(id)}
            onCreateClick={() => setIsCreateOpen(true)}
            refreshTrigger={refreshTrigger}
          />
        )}
      </main>

      {/* Create Modal Wizard */}
      <CreateWebhookModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          setIsCreateOpen(false);
          handleRefreshAll();
        }}
      />

      {/* Footer Details */}
      <footer className="py-6 border-t border-gray-100 bg-white/50 text-center text-xs text-gray-400 font-medium">
        <p className="flex items-center justify-center gap-1.5">
          <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
          SheetSync Webhook Extension — Dummy-proof, WYSIWYG, and auto-mapping headers.
        </p>
      </footer>

    </div>
  );
}
