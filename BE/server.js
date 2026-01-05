require('dotenv').config();
const express = require('express');
const apiRoutes = require('./routes/api');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { requestLogger, corsMiddleware } = require('./middlewares/requestLogger');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARES =====

// Parse JSON body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(corsMiddleware);

// Request logging
app.use(requestLogger);

// ===== ROUTES =====

// Health check tại root
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ThinkLink API - EdTech Problem Analysis',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      analyzeProblem: 'POST /api/analyze-problem'
    }
  });
});

// API routes
app.use('/api', apiRoutes);

// ===== ERROR HANDLERS =====

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ===== START SERVER =====

app.listen(PORT, () => {
  console.log('=================================');
  console.log('🚀 ThinkLink API Server Started');
  console.log('=================================');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 AI Model: ${process.env.HUGGINGFACE_MODEL || 'Qwen/Qwen2.5-72B-Instruct'}`);
  console.log(`✅ API Ready at: http://localhost:${PORT}`);
  console.log('=================================');
  
  // Kiểm tra API key
  if (!process.env.HUGGINGFACE_API_KEY) {
    console.warn('⚠️  WARNING: HUGGINGFACE_API_KEY chưa được cấu hình!');
    console.warn('   Vui lòng thêm API key vào file .env');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;
