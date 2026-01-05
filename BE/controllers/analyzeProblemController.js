const { validationResult } = require('express-validator');
const huggingFaceService = require('../services/huggingFaceService');

/**
 * Controller xử lý API endpoint phân tích đề bài
 */
class AnalyzeProblemController {
  /**
   * POST /api/analyze-problem
   * Phân tích đề bài học tập sử dụng LLM
   */
  async analyzeProblem(req, res, next) {
    try {
      // 1. Validate input từ express-validator middleware
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: errors.array()
        });
      }

      // 2. Extract input từ request body
      const { classLevel, subject, currentTopic, problemText } = req.body;

      // 3. Log request để tracking (optional)
      console.log(`[Analyze Problem] Class: ${classLevel}, Subject: ${subject}, Topic: ${currentTopic}`);

      // 4. Gọi service để xử lý với Hugging Face
      const analysisResult = await huggingFaceService.analyzeProblem(
        classLevel,
        subject,
        currentTopic,
        problemText
      );

      // 5. Trả về kết quả thành công
      return res.status(200).json({
        success: true,
        message: 'Phân tích đề bài thành công',
        data: analysisResult
      });

    } catch (error) {
      // 6. Xử lý lỗi - chuyển sang error handling middleware
      console.error('[Analyze Problem Error]:', error.message);
      next(error);
    }
  }

  /**
   * GET /api/health
   * Health check endpoint
   */
  async healthCheck(req, res) {
    try {
      return res.status(200).json({
        success: true,
        message: 'ThinkLink API is running',
        timestamp: new Date().toISOString(),
        service: 'Problem Analysis API',
        version: '1.0.0'
      });
    } catch (error) {
      console.error('[Health Check Error]:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Service is not healthy'
      });
    }
  }
}

module.exports = new AnalyzeProblemController();
