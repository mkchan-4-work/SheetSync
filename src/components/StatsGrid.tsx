import React from 'react';
import { WebhookStats } from '../types';
import { Layers, ArrowUpRight, Zap, CheckCircle } from 'lucide-react';

interface StatsGridProps {
  stats: WebhookStats;
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const items = [
    {
      id: 'stat-webhooks',
      name: 'Active Webhooks',
      value: stats.totalWebhooks,
      icon: Layers,
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      border: 'border-green-100',
      desc: 'Form connections active'
    },
    {
      id: 'stat-submissions',
      name: 'Total Submissions',
      value: stats.totalSubmissions,
      icon: Zap,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      border: 'border-blue-100',
      desc: 'All captured payloads'
    },
    {
      id: 'stat-today',
      name: 'Last 24h Activity',
      value: stats.todaySubmissions,
      icon: ArrowUpRight,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      border: 'border-amber-100',
      desc: 'Recent form interactions'
    },
    {
      id: 'stat-success',
      name: 'Sync Success Rate',
      value: `${stats.successRate}%`,
      icon: CheckCircle,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      border: 'border-emerald-100',
      desc: 'Sheets append rate'
    }
  ];

  return (
    <div id="stats-container" className="grid grid-cols-1 md:grid-cols-4 gap-5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            id={item.id}
            key={item.id}
            className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4 hover:border-gray-300 transition-all`}
          >
            <div className={`p-3 rounded-lg ${item.bgColor} ${item.color} border ${item.border}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.name}</p>
              <h4 className="text-2xl font-bold text-gray-900 mt-1 leading-none">{item.value}</h4>
              <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
