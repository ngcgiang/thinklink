/**
 * Request Logger Middleware
 * Log tất cả các requests đến API
 */
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  
  // Log request body cho POST/PUT (không log sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  
  next();
};

/**
 * CORS Middleware (nếu cần)
 */
const corsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
};

module.exports = {
  requestLogger,
  corsMiddleware
};
