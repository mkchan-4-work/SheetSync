export interface Webhook {
  id: string;
  name: string;
  scriptUrl: string; // The Google Apps Script Web App URL
  status: 'active' | 'inactive' | 'error';
  createdAt: string;
  submissionsCount: number;
  lastActive: string | null;
  headers: string[]; // List of detected headers
}

export interface Submission {
  id: string;
  webhookId: string;
  timestamp: string;
  payload: Record<string, any>;
  requestHeaders: Record<string, string>; // Request HTTP headers (e.g. User-Agent)
  ipAddress: string;
  status: 'success' | 'failed';
  errorMessage?: string;
}

export interface WebhookStats {
  totalWebhooks: number;
  totalSubmissions: number;
  todaySubmissions: number;
  successRate: number;
}
