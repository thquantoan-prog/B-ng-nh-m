import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { SessionState, GroupData } from './src/types.js';

const app = express();
const PORT = 3000;

// Set payload limit for image uploads (base64)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Helper to generate a session ID
function generateSessionId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'QT';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Initial state creator
function createInitialState(): SessionState {
  const sessionId = generateSessionId();
  return {
    sessionId,
    groupCount: 2,
    groups: [
      { id: 1, name: 'NHÓM 1', images: [], stars: 0, qrKey: `qr-1-${Date.now()}` },
      { id: 2, name: 'NHÓM 2', images: [], stars: 0, qrKey: `qr-2-${Date.now()}` }
    ],
    lastUpdated: Date.now()
  };
}

let currentState: SessionState = createInitialState();

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcastState() {
  currentState.lastUpdated = Date.now();
  const payload = JSON.stringify({
    type: 'STATE_UPDATE',
    state: currentState
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// WebSocket Connection Handler
wss.on('connection', (ws) => {
  // Send current state immediately on connect
  ws.send(JSON.stringify({
    type: 'INIT',
    state: currentState
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
      }
    } catch (e) {
      console.error('WS message error:', e);
    }
  });
});

// API Routes

// Get current state
app.get('/api/state', (req, res) => {
  res.json({ success: true, state: currentState });
});

// Reset all: clears images and stars for all groups, keeps session ID
app.post('/api/reset-all', (req, res) => {
  currentState.groups.forEach((group) => {
    group.images = [];
    group.stars = 0;
  });
  broadcastState();
  res.json({ success: true, state: currentState });
});

// Hard Reset: creates a brand new session ID and resets to 2 groups
app.post('/api/hard-reset', (req, res) => {
  currentState = createInitialState();
  broadcastState();
  res.json({ success: true, state: currentState });
});

// Update Group Count (2..6)
app.post('/api/update-group-count', (req, res) => {
  const { groupCount } = req.body;
  if (typeof groupCount !== 'number' || groupCount < 2 || groupCount > 6) {
    return res.status(400).json({ error: 'Group count must be between 2 and 6' });
  }

  currentState.groupCount = groupCount;

  // Add new groups if count increased
  while (currentState.groups.length < groupCount) {
    const newId = currentState.groups.length + 1;
    currentState.groups.push({
      id: newId,
      name: `NHÓM ${newId}`,
      images: [],
      stars: 0,
      qrKey: `qr-${newId}-${Date.now()}`
    });
  }

  // Trim groups if count decreased
  if (currentState.groups.length > groupCount) {
    currentState.groups = currentState.groups.slice(0, groupCount);
  }

  broadcastState();
  res.json({ success: true, state: currentState });
});

// Update Group Name
app.post('/api/update-group-name', (req, res) => {
  const { groupId, name } = req.body;
  const group = currentState.groups.find((g) => g.id === groupId);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  group.name = name || `NHÓM ${groupId}`;
  broadcastState();
  res.json({ success: true, state: currentState });
});

// Upload image to group
app.post('/api/upload-image', (req, res) => {
  const { groupId, url } = req.body;
  const group = currentState.groups.find((g) => g.id === groupId);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  if (group.images.length >= 4) {
    return res.status(400).json({ error: 'Tối đa 4 ảnh cho mỗi nhóm' });
  }

  const newImage = {
    id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    url,
    rotation: 0,
    uploadedAt: Date.now()
  };

  group.images.push(newImage);
  broadcastState();
  res.json({ success: true, image: newImage, state: currentState });
});

// Delete single image
app.post('/api/delete-image', (req, res) => {
  const { groupId, imageId } = req.body;
  const group = currentState.groups.find((g) => g.id === groupId);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  group.images = group.images.filter((img) => img.id !== imageId);
  broadcastState();
  res.json({ success: true, state: currentState });
});

// Clear all images in a specific group
app.post('/api/clear-group-images', (req, res) => {
  const { groupId } = req.body;
  const group = currentState.groups.find((g) => g.id === groupId);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  group.images = [];
  group.stars = 0;
  broadcastState();
  res.json({ success: true, state: currentState });
});

// Rotate image
app.post('/api/rotate-image', (req, res) => {
  const { groupId, imageId, angle } = req.body;
  const group = currentState.groups.find((g) => g.id === groupId);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  const image = group.images.find((img) => img.id === imageId);
  if (!image) {
    return res.status(404).json({ error: 'Image not found' });
  }

  if (typeof angle === 'number') {
    image.rotation = angle % 360;
  } else {
    image.rotation = (image.rotation + 90) % 360;
  }

  broadcastState();
  res.json({ success: true, state: currentState });
});

// Set star score
app.post('/api/set-stars', (req, res) => {
  const { groupId, stars } = req.body;
  const group = currentState.groups.find((g) => g.id === groupId);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  group.stars = Math.max(0, Math.min(10, stars));
  broadcastState();
  res.json({ success: true, state: currentState });
});

// Reset group QR key
app.post('/api/reset-group-qr', (req, res) => {
  const { groupId } = req.body;
  const group = currentState.groups.find((g) => g.id === groupId);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  group.qrKey = `qr-${groupId}-${Date.now()}`;
  broadcastState();
  res.json({ success: true, state: currentState });
});

// Vite or static serving setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
