import React, { useState } from 'react';
import { Webhook } from '../types';
import { Play, AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';

interface TestBenchProps {
  webhook: Webhook;
  onTestSuccess: () => void;
}

const TEMPLATES = [
  {
    name: 'Contact Form',
    payload: {
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Partnership Inquiry',
      message: 'Hello, I would love to connect about integrating our platforms.'
    }
  },
  {
    name: 'Newsletter Signup',
    payload: {
      email: 'marketing_pro@techcorp.com',
      subscribed_at: new Date().toISOString().split('T')[0],
      source: 'blog_footer_cta',
      status: 'opt_in'
    }
  },
  {
    name: 'Event RSVP',
    payload: {
      guest_name: 'Sarah Jenkins',
      plus_one: 'Yes',
      dietary_restrictions: 'Gluten Free',
      ticket_type: 'VIP Early Bird'
    }
  },
  {
    name: 'Feedback Survey',
    payload: {
      rating: 5,
      recommend: 'Likely',
      comments: 'Your webhook setup is amazing! Truly WYSIWYG and bulletproof.',
      device: 'Desktop Chrome'
    }
  }
];

export default function TestBench({ webhook, onTestSuccess }: TestBenchProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [payloadText, setPayloadText] = useState(JSON.stringify(TEMPLATES[0].payload, null, 2));
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleTemplateChange = (index: number) => {
    setSelectedTemplate(index);
    setPayloadText(JSON.stringify(TEMPLATES[index].payload, null, 2));
    setStatus(null);
  };

  const handleSendTest = async () => {
    setStatus(null);
    setLoading(true);

    let parsedPayload: any;
    try {
      parsedPayload = JSON.parse(payloadText);
    } catch (err: any) {
      setStatus({ type: 'error', message: 'Invalid JSON. Please fix syntax errors.' });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/webhooks/${webhook.id}/test-forward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedPayload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Server failed to process test');
      }

      if (data.submission && data.submission.status === 'failed') {
        setStatus({
          type: 'error',
          message: `Forwarding failed: ${data.submission.errorMessage || 'Check Google Sheet Script URL settings'}`
        });
      } else {
        setStatus({
          type: 'success',
          message: 'Webhook processed successfully! Check your Google Sheet to see the columns and row appended.'
        });
        onTestSuccess();
      }
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.message || 'Network error while attempting to send test'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="test-bench-panel" className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="font-bold text-gray-900 text-sm">Interactive Sandbox</h4>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">Simulate external form submissions and test columns mapping</p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-lg border border-gray-200">
          {TEMPLATES.map((tpl, i) => (
            <button
              key={tpl.name}
              onClick={() => handleTemplateChange(i)}
              className={`text-[11px] py-1 px-2.5 rounded-md font-bold transition-all ${
                selectedTemplate === i
                  ? 'bg-white text-green-700 shadow-sm border border-gray-200/50'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tpl.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Editor */}
        <div className="md:col-span-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">JSON Payload</span>
            <button 
              onClick={() => handleTemplateChange(selectedTemplate)}
              className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 font-bold"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>
          <textarea
            value={payloadText}
            onChange={(e) => setPayloadText(e.target.value)}
            className="w-full font-mono text-xs text-gray-800 bg-gray-50 border border-gray-300 rounded-lg p-3.5 focus:outline-none focus:ring-2 focus:ring-green-500/15 focus:border-green-600 h-44 resize-none leading-relaxed"
          />
        </div>

        {/* Action Panel */}
        <div className="md:col-span-2 flex flex-col justify-between gap-3">
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Sandbox Run</span>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              When you send a test, the server simulates an incoming request. It appends any new key-value headers to your sheet dynamically and adds a new record row.
            </p>

            {status && (
              <div
                className={`p-3 rounded-lg border text-xs flex gap-2 items-start mt-2 font-medium ${
                  status.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {status.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{status.message}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleSendTest}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 py-2.5 px-4 rounded-lg shadow-sm transition-colors disabled:opacity-55 cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing Submission...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Trigger Test Submission
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
