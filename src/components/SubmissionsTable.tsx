import React, { useState } from 'react';
import { Submission } from '../types';
import { ChevronDown, ChevronUp, Check, AlertTriangle, HelpCircle, Terminal } from 'lucide-react';

interface SubmissionsTableProps {
  submissions: Submission[];
}

export default function SubmissionsTable({ submissions }: SubmissionsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm">
        <div className="mx-auto w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mb-3">
          <Terminal className="w-5 h-5" />
        </div>
        <p className="text-sm font-bold text-gray-900">No submissions captured yet</p>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto font-medium">
          Send a request using the interactive sandbox above or paste the webhook URL in your external form to see real-time data flow.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-gray-900 text-sm">Submission Logs</h4>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">Real-time incoming payloads and dispatch states</p>
        </div>
        <span className="text-xs font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded border border-green-200">
          {submissions.length} Total Logs
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-xs font-bold text-gray-400 bg-gray-50/30">
              <th className="py-3 px-5 uppercase tracking-wider">Status</th>
              <th className="py-3 px-5 uppercase tracking-wider">Captured At</th>
              <th className="py-3 px-5 uppercase tracking-wider">Fields Captured</th>
              <th className="py-3 px-5 uppercase tracking-wider">Sender IP</th>
              <th className="py-3 px-5 text-right uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-xs text-gray-700">
            {submissions.map((sub) => {
              const isExpanded = expandedRow === sub.id;
              const keys = Object.keys(sub.payload);
              const preview = keys.slice(0, 3).map(k => `${k}: ${typeof sub.payload[k] === 'object' ? '...' : sub.payload[k]}`).join(', ');
              
              return (
                <React.Fragment key={sub.id}>
                  <tr 
                    onClick={() => toggleExpand(sub.id)}
                    className="hover:bg-green-50/20 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      {sub.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 font-bold py-1 px-2.5 rounded border border-green-200 text-[10px]">
                          <Check className="w-3 h-3" /> Synced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 font-bold py-1 px-2.5 rounded border border-rose-200 text-[10px]">
                          <AlertTriangle className="w-3 h-3" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-gray-500 font-semibold">{formatDate(sub.timestamp)}</td>
                    <td className="py-3.5 px-5">
                      <div className="max-w-xs truncate font-medium">
                        <span className="font-bold text-gray-900 mr-1.5">({keys.length} keys)</span>
                        <span className="text-gray-400 font-mono">{preview}</span>
                        {keys.length > 3 && <span className="text-green-600 ml-1 font-bold">+{keys.length - 3} more</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-gray-400">{sub.ipAddress}</td>
                    <td className="py-3.5 px-5 text-right">
                      <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-gray-50/50">
                      <td colSpan={5} className="py-4 px-6 border-b border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left: Payload JSON */}
                          <div className="space-y-1.5 text-left">
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Captured Payload Data</span>
                            <div className="bg-gray-900 rounded-lg p-3.5 border border-gray-800 overflow-x-auto text-left">
                              <pre className="text-xs font-mono text-green-400">{JSON.stringify(sub.payload, null, 2)}</pre>
                            </div>
                          </div>

                          {/* Right: Technical Details & Meta */}
                          <div className="space-y-3.5 text-left flex flex-col justify-between">
                            <div className="space-y-2">
                              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest block">Diagnostics</span>
                              {sub.status === 'failed' && (
                                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-xs font-semibold leading-relaxed">
                                  Error Syncing Spreadsheet: {sub.errorMessage}
                                </div>
                              )}
                              
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                                  <p className="text-[10px] uppercase text-gray-400 font-bold">Submission ID</p>
                                  <p className="font-mono text-gray-700 font-bold mt-0.5">{sub.id}</p>
                                </div>
                                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                                  <p className="text-[10px] uppercase text-gray-400 font-bold">User Agent</p>
                                  <p className="font-mono text-gray-700 font-bold mt-0.5 truncate" title={sub.requestHeaders['user-agent']}>
                                    {sub.requestHeaders['user-agent'] || 'Direct Sandbox Call'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-green-50/30 border border-green-100 rounded-lg p-3 text-green-950 flex items-start gap-2.5">
                              <HelpCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                              <p className="text-[11px] leading-relaxed font-semibold text-green-900">
                                Need to add dynamic redirect callbacks? Add a key named <code>_redirect</code> with any target URL inside your payload to automatically send form submitters to a customized thank you page after capture!
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
