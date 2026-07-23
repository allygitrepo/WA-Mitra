const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const instanceRoutes = require('./routes/instanceRoutes');
const apiRoutes = require('./routes/apiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const planRoutes = require('./routes/planRoutes');
const templateRoutes = require('./routes/templateRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const cycleRoutes = require('./routes/cycleRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const checkStatusMiddleware = require('./middleware/checkStatusMiddleware');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-token', 'x-user-timezone', 'Accept'],
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

const prefix = '/wa-mitra'
// Portal Internal Routes (Require JWT Auth)
app.use(`${prefix}/api/auth`, authRoutes);

// Apply status check to all other protected portal routes
app.use(`${prefix}/api/tokens`, authMiddleware, checkStatusMiddleware, tokenRoutes);
app.use(`${prefix}/api/instances`, authMiddleware, checkStatusMiddleware, instanceRoutes);
app.use(`${prefix}/api/messages`, authMiddleware, checkStatusMiddleware, messageRoutes);
app.use(`${prefix}/api/whatsapp`, authMiddleware, checkStatusMiddleware, whatsappRoutes);
app.use(`${prefix}/api/templates`, authMiddleware, checkStatusMiddleware, templateRoutes);
app.use(`${prefix}/api/schedules`, authMiddleware, checkStatusMiddleware, scheduleRoutes);
app.use(`${prefix}/api/cycles`, authMiddleware, checkStatusMiddleware, cycleRoutes);
app.use(`${prefix}/api/campaigns`, authMiddleware, checkStatusMiddleware, campaignRoutes);
app.use(`${prefix}/api/payments`, paymentRoutes);
app.use(`${prefix}/api/plans`, planRoutes);

// Admin Routes (Require Admin Role)
app.use(`${prefix}/api/admin`, adminRoutes);

// External API Routes (Require Master API Token)
app.use(`${prefix}/api/v1`, apiRoutes);
app.get(`${prefix}/test`, (req, res) => {
  res.json({ message: 'WA Mitra API is running' });
})

// Global Error Handler (to catch multer file size exceptions and return clean JSON)
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ 
      success: false, 
      message: 'File size exceeds the maximum 20MB limit.' 
    });
  }
  
  console.error("Unhandled Server Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
