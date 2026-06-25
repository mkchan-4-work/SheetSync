import React, { useState, useEffect } from 'react';
import { Webhook, WebhookStats } from '../types';
import StatsGrid from './StatsGrid';
import { 
  Plus, Layers, Calendar, ChevronRight, HelpCircle, FileSpreadsheet, 
  Settings, ExternalLink, Zap, CheckCircle2, ArrowRight, BookOpen, AlertCircle
} from 'lucide-react';

interface DashboardProps {
  onSelectWebhook: (id: string) => void;
  onCreateClick: () => void;
  refreshTrigger: number;
}

const DEFAULT_STATS: WebhookStats = {
  totalWebhooks: 0,
  totalSubmissions: 0,
  todaySubmissions: 0,
  successRate: 100
};

export default function Dashboard({ onSelectWebhook, onCreateClick, refreshTrigger }: DashboardProps) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [stats, setStats] = useState<WebhookStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const resWeb = await fetch('/api/webhooks');
      if (resWeb.ok) {
        const webData = await resWeb.json();
        setWebhooks(webData);
      }

      const resStats = await fetch('/api/stats');
      if (resStats.ok) {
        const statsData = await resStats.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-500 mt-2.5 font-medium">Loading webhook sync dashboard...</p>
      </div>
    );
  }

  return (
    <div id="dashboard-home" className="space-y-8 text-left">
      
      {/* Top Welcome Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-green-600" />
            SheetSync Manager
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Build serverless form endpoints and sync submission payloads to your Google Sheets instantly.
          </p>
        </div>

        <button
          onClick={onCreateClick}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 py-2.5 px-4 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Webhook
        </button>
      </div>

      {/* Stats Counter Section */}
      <StatsGrid stats={stats} />

      {/* Webhook Configuration Table / Card List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-gray-400" /> Webhook Endpoints ({webhooks.length})
            </h3>
          </div>

          {webhooks.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600 mb-4">
                <Zap className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm">Create Your First Form Endpoint</h4>
              <p className="text-xs text-gray-500 mt-1.5 max-w-md mx-auto leading-relaxed font-medium">
                Connect Google Sheets with a few clicks. Copy your unique webhook URL and drop it into your favorite form builder to automatically capture and append responses.
              </p>
              <button
                onClick={onCreateClick}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 py-2.5 px-4 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Let's Get Started <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {webhooks.map((web) => (
                <div
                  key={web.id}
                  onClick={() => onSelectWebhook(web.id)}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between hover:border-green-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-50 group-hover:bg-green-50 group-hover:text-green-600 text-gray-500 rounded-lg transition-colors border border-gray-100">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">{web.name}</span>
                        {web.status === 'active' ? (
                          <span className="bg-green-50 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded border border-green-200">Active</span>
                        ) : web.status === 'error' ? (
                          <span className="bg-rose-50 text-rose-700 text-[9px] font-bold px-2 py-0.5 rounded border border-rose-100">Sync Error</span>
                        ) : (
                          <span className="bg-gray-50 text-gray-500 text-[9px] font-bold px-2 py-0.5 rounded border border-gray-200">Inactive</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 font-semibold">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-500" /> {web.submissionsCount} submits
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Created {new Date(web.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Open settings</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Help / WYSIWYG documentation */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-gray-400" /> Integration Guide
          </h3>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            
            {/* Guide Step 1 */}
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center shrink-0 font-bold text-xs">
                1
              </div>
              <div className="text-xs">
                <p className="font-semibold text-gray-900">Set Up Spreadsheet</p>
                <p className="text-gray-500 mt-1 leading-relaxed font-medium">
                  Open Google Sheets and click <strong>Extensions &gt; Apps Script</strong>. Copy the script snippet we provide and paste it directly.
                </p>
              </div>
            </div>

            {/* Guide Step 2 */}
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center shrink-0 font-bold text-xs">
                2
              </div>
              <div className="text-xs">
                <p className="font-semibold text-gray-900">Deploy as Web App</p>
                <p className="text-gray-500 mt-1 leading-relaxed font-medium">
                  Deploy the script as a <strong>Web App</strong> with access set to <strong>"Anyone"</strong>. Paste that Google Script URL into our builder to authorize sheets sync.
                </p>
              </div>
            </div>

            {/* Guide Step 3 */}
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center shrink-0 font-bold text-xs">
                3
              </div>
              <div className="text-xs">
                <p className="font-semibold text-gray-900">Add to your Form</p>
                <p className="text-gray-500 mt-1 leading-relaxed font-medium">
                  Put our generated Webhook URL in your form's action or webhook setting. Form submissions will automatically create spreadsheet headers and append rows!
                </p>
              </div>
            </div>

            {/* Custom Redirect Tip */}
            <div className="bg-amber-50 border border-amber-100 text-amber-800 rounded-lg p-3.5 mt-2 text-xs flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">Dynamic Thank-You Redirect</p>
                <p className="mt-1 leading-relaxed text-amber-900 text-[11px] font-medium">
                  Want form submitters redirected after they submit? Just include a hidden field or payload key named <code>_redirect</code> (value: your thank you page URL) and our webhook agent handles the redirect automatically!
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
