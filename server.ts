import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { createServer as createViteServer } from 'vite';
import { Webhook, Submission, WebhookStats } from './src/types';

const app = express();
const PORT = 3000;
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Ensure database file exists
async function initDb() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    try {
      await fs.access(DB_FILE);
    } catch {
      const initialData = { webhooks: [], submissions: [] };
      await fs.writeFile(DB_FILE, JSON.stringify(initialData, null, 2));
    }
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }
}

// Read database
async function readDb(): Promise<{ webhooks: Webhook[]; submissions: Submission[] }> {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { webhooks: [], submissions: [] };
  }
}

// Write database
async function writeDb(data: { webhooks: Webhook[]; submissions: Submission[] }) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ==========================================
// API ROUTES
// ==========================================

// Get Stats
app.get('/api/stats', async (req, res) => {
  try {
    const db = await readDb();
    const webhooks = db.webhooks;
    const submissions = db.submissions;

    const totalWebhooks = webhooks.length;
    const totalSubmissions = submissions.length;

    // Submissions in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const todaySubmissions = submissions.filter(
      s => new Date(s.timestamp) > oneDayAgo
    ).length;

    const successSubmissions = submissions.filter(s => s.status === 'success').length;
    const successRate = totalSubmissions > 0 
      ? Math.round((successSubmissions / totalSubmissions) * 100) 
      : 100;

    const stats: WebhookStats = {
      totalWebhooks,
      totalSubmissions,
      todaySubmissions,
      successRate
    };

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List Webhooks
app.get('/api/webhooks', async (req, res) => {
  try {
    const db = await readDb();
    res.json(db.webhooks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create Webhook
app.post('/api/webhooks', async (req, res) => {
  try {
    const { name, scriptUrl } = req.body;
    if (!name || !scriptUrl) {
      return res.status(400).json({ error: 'Name and Script URL are required' });
    }

    const db = await readDb();
    const newWebhook: Webhook = {
      id: 'wh_' + Math.random().toString(36).substring(2, 11),
      name,
      scriptUrl,
      status: 'active',
      createdAt: new Date().toISOString(),
      submissionsCount: 0,
      lastActive: null,
      headers: []
    };

    db.webhooks.push(newWebhook);
    await writeDb(db);

    res.status(201).json(newWebhook);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Webhook Details
app.get('/api/webhooks/:id', async (req, res) => {
  try {
    const db = await readDb();
    const webhook = db.webhooks.find(w => w.id === req.params.id);
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    res.json(webhook);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Webhook
app.delete('/api/webhooks/:id', async (req, res) => {
  try {
    const db = await readDb();
    const index = db.webhooks.findIndex(w => w.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    db.webhooks.splice(index, 1);
    // Also remove related submissions
    db.submissions = db.submissions.filter(s => s.webhookId !== req.params.id);

    await writeDb(db);
    res.json({ message: 'Webhook deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Submissions for Webhook
app.get('/api/webhooks/:id/submissions', async (req, res) => {
  try {
    const db = await readDb();
    const list = db.submissions.filter(s => s.webhookId === req.params.id);
    // Sort descending by timestamp
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Test Forward Payload to Google Sheet (Interactive Sandbox)
app.post('/api/webhooks/:id/test-forward', async (req, res) => {
  try {
    const db = await readDb();
    const webhookIndex = db.webhooks.findIndex(w => w.id === req.params.id);
    if (webhookIndex === -1) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    const webhook = db.webhooks[webhookIndex];
    const payload = req.body;

    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || '127.0.0.1';
    const requestHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        requestHeaders[key] = value;
      }
    }

    const timestamp = new Date().toISOString();
    const submissionId = 'sub_' + Math.random().toString(36).substring(2, 11);

    let status: 'success' | 'failed' = 'success';
    let errorMessage: string | undefined = undefined;
    let sheetResponse: any = null;

    try {
      // Forward to Google Apps Script
      const response = await fetch(webhook.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Google Apps Script returned status ${response.status}`);
      }

      const text = await response.text();
      try {
        sheetResponse = JSON.parse(text);
        if (sheetResponse.status === 'error') {
          throw new Error(sheetResponse.message || 'Unknown error inside Apps Script');
        }
      } catch (e) {
        // Fallback to text if not JSON
        sheetResponse = { status: 'success', rawText: text };
      }

      // Update headers if returned
      if (sheetResponse && Array.isArray(sheetResponse.headers)) {
        webhook.headers = sheetResponse.headers;
      } else {
        // Fallback: extract keys from payload
        const keys = Object.keys(payload);
        webhook.headers = Array.from(new Set([...webhook.headers, ...keys]));
      }

      webhook.submissionsCount += 1;
      webhook.lastActive = timestamp;
      webhook.status = 'active';

    } catch (err: any) {
      console.error('Error forwarding to Google Sheet:', err);
      status = 'failed';
      errorMessage = err.message || 'Connection failed';
      webhook.status = 'error';
    }

    const submission: Submission = {
      id: submissionId,
      webhookId: webhook.id,
      timestamp,
      payload,
      requestHeaders,
      ipAddress,
      status,
      errorMessage
    };

    db.submissions.push(submission);
    db.webhooks[webhookIndex] = webhook;
    await writeDb(db);

    res.json({
      submission,
      sheetResponse
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Clear Submissions for Webhook
app.post('/api/webhooks/:id/clear', async (req, res) => {
  try {
    const db = await readDb();
    const webhookIndex = db.webhooks.findIndex(w => w.id === req.params.id);
    if (webhookIndex === -1) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    db.submissions = db.submissions.filter(s => s.webhookId !== req.params.id);
    db.webhooks[webhookIndex].submissionsCount = 0;
    db.webhooks[webhookIndex].lastActive = null;
    db.webhooks[webhookIndex].headers = [];

    await writeDb(db);
    res.json({ message: 'Webhook history cleared' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// PUBLIC WEBHOOK CAPTURE ENDPOINT
// ==========================================

// This endpoint accepts GET, POST, PUT, DELETE, and captures ALL request body/parameters
app.all('/api/webhooks/capture/:id', async (req, res) => {
  const webhookId = req.params.id;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || '127.0.0.1';
  
  // Extract headers
  const requestHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') {
      requestHeaders[key] = value;
    }
  }

  try {
    const db = await readDb();
    const webhookIndex = db.webhooks.findIndex(w => w.id === webhookId);
    
    if (webhookIndex === -1) {
      return res.status(404).json({ error: 'Webhook configuration not found in dashboard.' });
    }

    const webhook = db.webhooks[webhookIndex];

    // Build unified payload from body, query, and route params
    // Let's filter out internal values or keep it clean
    let payload: Record<string, any> = {};

    if (req.method === 'GET' || req.method === 'DELETE') {
      payload = { ...req.query };
    } else {
      // If POST/PUT, combine body and query
      payload = { ...req.query, ...req.body };
    }

    // Clean up empty payload or map it to list if it is an array
    if (Array.isArray(payload)) {
      payload = { _arrayData: payload };
    } else if (Object.keys(payload).length === 0) {
      payload = { status: 'ping', message: 'Empty webhook received' };
    }

    // Capture standard form redirect URLs if any
    const redirectUrl = payload._redirect || payload.redirect_to || payload.next || payload._next;
    
    // Remove metadata redirect key from spreadsheet payload
    const finalPayload = { ...payload };
    delete finalPayload._redirect;
    delete finalPayload.redirect_to;
    delete finalPayload.next;
    delete finalPayload._next;

    const timestamp = new Date().toISOString();
    const submissionId = 'sub_' + Math.random().toString(36).substring(2, 11);

    let status: 'success' | 'failed' = 'success';
    let errorMessage: string | undefined = undefined;

    try {
      // Forward to Google Apps Script
      const response = await fetch(webhook.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload)
      });

      if (!response.ok) {
        throw new Error(`Google Apps Script returned HTTP status ${response.status}`);
      }

      const text = await response.text();
      let sheetResponse: any = null;
      try {
        sheetResponse = JSON.parse(text);
        if (sheetResponse.status === 'error') {
          throw new Error(sheetResponse.message || 'Google Apps Script threw an error');
        }
      } catch {
        sheetResponse = { status: 'success', rawText: text };
      }

      // Update headers
      if (sheetResponse && Array.isArray(sheetResponse.headers)) {
        webhook.headers = sheetResponse.headers;
      } else {
        const keys = Object.keys(finalPayload);
        webhook.headers = Array.from(new Set([...webhook.headers, ...keys]));
      }

      webhook.submissionsCount += 1;
      webhook.lastActive = timestamp;
      webhook.status = 'active';

    } catch (err: any) {
      console.error(`[Webhook ${webhookId}] Forwarding error:`, err);
      status = 'failed';
      errorMessage = err.message || 'Connection failed';
      webhook.status = 'error';
    }

    // Record submission
    const submission: Submission = {
      id: submissionId,
      webhookId: webhook.id,
      timestamp,
      payload: finalPayload,
      requestHeaders,
      ipAddress,
      status,
      errorMessage
    };

    db.submissions.push(submission);
    db.webhooks[webhookIndex] = webhook;
    await writeDb(db);

    // Support Form Redirection if supplied!
    if (redirectUrl && typeof redirectUrl === 'string') {
      return res.redirect(redirectUrl);
    }

    // Standard API response
    return res.json({
      success: status === 'success',
      id: submissionId,
      message: status === 'success' ? 'Form data received and stored.' : 'Form data received, but failed to sync with spreadsheet.',
      error: errorMessage
    });

  } catch (error: any) {
    console.error('Webhook endpoint failure:', error);
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// STATIC FRONTEND & DEV SERVER MOUNT
// ==========================================

async function start() {
  await initDb();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Support wildcard routing for SPAs in express
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
