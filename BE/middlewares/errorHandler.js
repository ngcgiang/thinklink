/**
 * Error Handler Middleware
 * Xử lý tất cả các lỗi từ controllers và services
 */
const errorHandler = (err, req, res, next) => {
  // Log error để debug
  console.error('=== ERROR HANDLER ===');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Determine error type
  let errorType = 'SERVER_ERROR';
  let message = err.message || 'Đã xảy ra lỗi không mong muốn';

  // Custom error types
  if (err.message.includes('API Key')) {
    errorType = 'AUTHENTICATION_ERROR';
    message = 'Lỗi xác thực với Hugging Face API';
  } else if (err.message.includes('Model đang loading')) {
    errorType = 'MODEL_LOADING';
    message = 'Model đang được tải, vui lòng thử lại sau';
  } else if (err.message.includes('Không thể parse JSON')) {
    errorType = 'PARSE_ERROR';
    message = 'Lỗi xử lý response từ AI model';
  } else if (err.message.includes('không hợp lệ')) {
    errorType = 'VALIDATION_ERROR';
  }

  // Response format
  const response = {
    success: false,
    error: {
      type: errorType,
      message: message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err.details 
      })
    }
  };

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      type: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} không tồn tại`
    }
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
