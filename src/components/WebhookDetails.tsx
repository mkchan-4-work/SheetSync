import React, { useState, useEffect } from 'react';
import { Webhook, Submission } from '../types';
import { 
  ArrowLeft, Copy, Check, ExternalLink, RefreshCw, Trash2, 
  Columns, Calendar, Clock, CheckCircle, AlertTriangle
} from 'lucide-react';
import TestBench from './TestBench';
import SubmissionsTable from './SubmissionsTable';

interface WebhookDetailsProps {
  webhookId: string;
  onBack: () => void;
  onDeleted: () => void;
}

export default function WebhookDetails({ webhookId, onBack, onDeleted }: WebhookDetailsProps) {
  const [webhook, setWebhook] = useState<Webhook | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    try {
      setError(null);
      const resWeb = await fetch(`/api/webhooks/${webhookId}`);
      if (!resWeb.ok) throw new Error('Failed to fetch webhook details');
      const webData = await resWeb.json();
      setWebhook(webData);

      const resSubs = await fetch(`/api/webhooks/${webhookId}/submissions`);
      if (!resSubs.ok) throw new Error('Failed to fetch submissions');
      const subsData = await resSubs.json();
      setSubmissions(subsData);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [webhookId]);

  const handleCopyWebhookUrl = async () => {
    if (!webhook) return;
    const publicUrl = `${window.location.origin}/api/webhooks/capture/${webhook.id}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all submission logs for this webhook? This will not delete the data inside your Google Sheet.')) {
      return;
    }

    try {
      const res = await fetch(`/api/webhooks/${webhookId}/clear`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to clear logs');
      fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Could not clear history');
    }
  };

  const handleDeleteWebhook = async () => {
    if (!window.confirm('Are you sure you want to delete this webhook configuration? Existing data in Google Sheet will be preserved, but new submissions will no longer sync.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/webhooks/${webhookId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete webhook');
      onDeleted();
    } catch (err: any) {
      alert(err.message || 'Could not delete webhook');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
        <p className="text-xs text-gray-500 mt-2.5 font-medium">Fetching webhook details...</p>
      </div>
    );
  }

  if (error || !webhook) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-center">
        <p className="font-semibold">Error Loading Webhook</p>
        <p className="text-xs mt-1">{error || 'Webhook details could not be found'}</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>
      </div>
    );
  }

  const publicWebhookUrl = `${window.location.origin}/api/webhooks/capture/${webhook.id}`;

  return (
    <div id="webhook-detail-view" className="space-y-6">
      
      {/* Back & Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl text-gray-500 hover:text-gray-900 transition-all cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{webhook.name}</h2>
              {webhook.status === 'active' ? (
                <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded border border-green-200">Active</span>
              ) : webhook.status === 'error' ? (
                <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-200 font-mono">Error Connection</span>
              ) : (
                <span className="bg-gray-50 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200">Inactive</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5" /> Created on {new Date(webhook.createdAt).toLocaleDateString()}
              {webhook.lastActive && (
                <>
                  <span className="text-gray-300">•</span>
                  <Clock className="w-3.5 h-3.5" /> Last submitted {new Date(webhook.lastActive).toLocaleTimeString()}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-800 bg-white border border-gray-200 hover:border-gray-300 py-2 px-3 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Clear Logs
          </button>
          <button
            onClick={handleDeleteWebhook}
            disabled={isDeleting}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 py-2 px-3 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Webhook
          </button>
        </div>
      </div>

      {/* Main Grid: Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Public Webhook Endpoint */}
        <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Your Active Webhook URL</span>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed font-medium">
              Copy this URL and place it as the destination URL inside your external form builder (e.g. Webflow form settings, Typeform webhook, Zapier webhook, or HTML Form action attribute).
            </p>
          </div>

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              readOnly
              value={publicWebhookUrl}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3.5 py-2.5 font-mono text-xs text-gray-600 break-all focus:outline-none"
            />
            <button
              onClick={handleCopyWebhookUrl}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy URL
                </>
              )}
            </button>
          </div>
        </div>

        {/* Google Sheet Sync Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between text-left">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Google Sheets Sync</span>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${webhook.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-sm font-bold text-gray-900">
                {webhook.status === 'active' ? 'Sheet Connected' : 'Sync Error'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1.5 max-w-[240px] truncate" title={webhook.scriptUrl}>
              URL: <span className="font-mono text-[11px] text-gray-400">{webhook.scriptUrl}</span>
            </p>
          </div>

          <a
            href={webhook.scriptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-green-700 hover:text-green-800 bg-green-50/50 hover:bg-green-50 border border-green-200 rounded-lg py-2 transition-colors w-full"
          >
            Open Web App <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>

      {/* Sheet Columns Schema */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-left">
        <div className="flex items-center gap-2 mb-3">
          <Columns className="w-4.5 h-4.5 text-green-600" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Spreadsheet Column Mapping</h4>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Headers currently defined in Row 1 of your Google Sheet</p>
          </div>
        </div>

        {webhook.headers.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-1">
            {webhook.headers.map((header, index) => (
              <span
                key={`${header}-${index}`}
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-mono font-bold border ${
                  index === 0
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {index === 0 ? '🕒 ' : ''}
                {header}
              </span>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-gray-50/50 rounded-lg border border-dashed border-gray-200 text-center">
            <p className="text-xs text-gray-500 font-medium">
              No columns mapped yet. Perform a test submission below to automatically define headers!
            </p>
          </div>
        )}
      </div>

      {/* Interactive Sandbox Test Bench */}
      <TestBench webhook={webhook} onTestSuccess={fetchDetails} />

      {/* Submission Logs Table */}
      <SubmissionsTable submissions={submissions} />

    </div>
  );
}
