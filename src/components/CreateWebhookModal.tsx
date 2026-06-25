import React, { useState } from 'react';
import { generateGoogleAppsScript } from '../utils';
import { 
  X, Check, Copy, ArrowRight, ArrowLeft, Loader2, 
  Settings, Play, ShieldAlert, FileText 
} from 'lucide-react';

interface CreateWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateWebhookModal({ isOpen, onClose, onCreated }: CreateWebhookModalProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [scriptUrl, setScriptUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempId] = useState(() => 'wh_' + Math.random().toString(36).substring(2, 11));

  if (!isOpen) return null;

  const appUrl = window.location.origin;
  const gasCode = generateGoogleAppsScript(tempId, appUrl);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(gasCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!scriptUrl.trim()) {
      setError('Google Apps Script URL is required');
      return;
    }

    if (!scriptUrl.startsWith('https://script.google.com/')) {
      setError('Invalid URL. It must be a valid Google Apps Script Web App URL (starts with https://script.google.com/)');
      return;
    }

    setLoading(true);

    try {
      // 1. Verify the Google Apps Script is reachable and works
      const testRes = await fetch(`/api/webhooks/capture/${tempId}?status=test_ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          test_connection: 'success',
          sender: 'Google Sheet Webhook Dashboard'
        })
      });

      // Create the webhook in database now
      const createRes = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          scriptUrl: scriptUrl.trim()
        })
      });

      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.error || 'Failed to register webhook');
      }

      onCreated();
      onClose();
      // Reset state
      setStep(1);
      setName('');
      setScriptUrl('');
    } catch (err: any) {
      setError(
        `Could not verify connection: ${err.message || 'Make sure the web app is deployed for "Anyone" and has been authorized.'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForceSave = async () => {
    setError(null);
    setLoading(true);
    try {
      const createRes = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          scriptUrl: scriptUrl.trim()
        })
      });

      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.error || 'Failed to register webhook');
      }

      onCreated();
      onClose();
      setStep(1);
      setName('');
      setScriptUrl('');
    } catch (err: any) {
      setError(err.message || 'Failed to save webhook');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-gray-200 flex flex-col max-h-[90vh] text-left">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Create New Webhook</h3>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Connect Google Sheets to capture external forms</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-8 py-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-400">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>1</span>
            <span className={step >= 1 ? 'text-green-600 font-bold' : ''}>Configure Name</span>
          </div>
          <div className="h-px bg-gray-200 flex-1 mx-4"></div>
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>2</span>
            <span className={step >= 2 ? 'text-green-600 font-bold' : ''}>Install Code</span>
          </div>
          <div className="h-px bg-gray-200 flex-1 mx-4"></div>
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>3</span>
            <span className={step >= 3 ? 'text-green-600 font-bold' : ''}>Connect URL</span>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-xs flex gap-2.5 items-start">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 animate-bounce" />
              <div className="flex-1">
                <p className="font-bold">{error}</p>
                {step === 3 && (
                  <button 
                    type="button" 
                    onClick={handleForceSave}
                    className="mt-2 text-green-700 hover:text-green-800 font-bold underline block"
                  >
                    Skip verification and save anyway
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Webhook Name</label>
                <input
                  type="text"
                  placeholder="e.g. Webflow Contact Form"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 text-gray-900 font-medium"
                />
                <p className="text-xs text-gray-500 mt-2 font-medium">
                  Choose a descriptive name so you can identify where the submission data comes from.
                </p>
              </div>

              <div className="bg-green-50/50 p-4 rounded-xl border border-green-200 flex gap-3.5 mt-6">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg h-fit border border-green-200">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">How it works:</h4>
                  <ul className="text-xs text-gray-600 space-y-1.5 mt-2 list-disc pl-4 leading-relaxed font-semibold">
                    <li>This extension generates a unique webhook endpoint for you.</li>
                    <li>You paste a simple code snippet into your Google Sheet's Apps Script.</li>
                    <li>Once you submit form data to our webhook, the columns will automatically map and append.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Sheet Extension Code</span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 text-xs text-green-700 hover:text-green-800 font-bold hover:bg-green-50 py-1.5 px-3 rounded-lg transition-colors border border-green-200"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>

              <div className="border border-gray-800 rounded-xl bg-gray-900 p-4 overflow-x-auto max-h-48 text-left shadow-inner">
                <pre className="text-xs font-mono text-gray-300 leading-relaxed">{gasCode}</pre>
              </div>

              <div className="space-y-3 mt-4 text-xs text-gray-600 pl-1 leading-relaxed">
                <h4 className="font-bold text-gray-900 text-sm">Installation Steps:</h4>
                <ol className="list-decimal pl-4 space-y-2 font-medium">
                  <li>
                    Open your <strong>Google Sheet</strong> where you want to store submissions.
                  </li>
                  <li>
                    In the top menu, click <strong>Extensions</strong> &rarr; <strong>Apps Script</strong>.
                  </li>
                  <li>
                    Delete any existing template code in the editor, and <strong>paste the copied code above</strong>.
                  </li>
                  <li>
                    Click the <strong>Save</strong> disk icon.
                  </li>
                  <li>
                    Click <strong>Deploy</strong> (blue button) &rarr; <strong>New Deployment</strong>.
                  </li>
                  <li>
                    Click the gear icon and choose <strong>Web App</strong>.
                  </li>
                  <li>
                    Set 'Execute as' to <strong>Me</strong> and 'Who has access' to <strong>Anyone</strong>. (Critical for capturing webhooks!)
                  </li>
                  <li>
                    Click <strong>Deploy</strong>, authorize Google access, and <strong>copy the Web App URL</strong>.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Google Apps Script Web App URL</label>
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={scriptUrl}
                  onChange={(e) => setScriptUrl(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 text-gray-900 text-sm font-mono font-medium"
                />
                <p className="text-xs text-gray-500 mt-2 font-semibold">
                  Paste the deployment URL you copied from Step 8. It must start with <code>https://script.google.com/</code>.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-amber-600 animate-spin-slow" />
                  Make Sure Access is Public
                </p>
                <p className="leading-relaxed font-semibold">
                  Google Sheet requires Web App deployments to be set to <strong>Who has access: Anyone</strong> so our webhook bridge can safely insert rows on form submissions.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex items-center justify-between">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-800 py-2 px-3.5 rounded-lg border border-gray-200 bg-white shadow-xs transition-all hover:bg-gray-50 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            ) : (
              <div className="w-5" />
            )}
          </div>

          <div>
            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !name.trim()) {
                    setError('Webhook name is required');
                    return;
                  }
                  setError(null);
                  setStep(step + 1);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 py-2 px-4 rounded-lg shadow-xs transition-all hover:translate-x-0.5 cursor-pointer"
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleTestAndSave}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 py-2 px-4 rounded-lg shadow-xs transition-all disabled:opacity-55 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Test Connection & Save
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
