const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const instanceRoutes = require('./routes/instanceRoutes');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-token', 'Accept'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));
app.use(express.json());

// JSON Error Handler (Prevents HTML error pages on invalid JSON body)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: "Invalid JSON body provided" });
  }
  next();
});

// Custom Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

const prefix = '/wa-mitra'
// Portal Internal Routes (Require JWT Auth)
app.use(`${prefix}/api/auth`, authRoutes);
app.use(`${prefix}/api/tokens`, tokenRoutes);
app.use(`${prefix}/api/instances`, instanceRoutes);
app.use(`${prefix}/api/messages`, messageRoutes); // This now uses instanceKey too
app.use(`${prefix}/api/whatsapp`, whatsappRoutes); // Legacy/Portal session management

// External API Routes (Require Master API Token)
app.use(`${prefix}/api/v1`, apiRoutes);

module.exports = app;
