const express = require('express');
const { body } = require('express-validator');
const analyzeProblemController = require('../controllers/analyzeProblemController');
const ragController = require('../controllers/ragController');
const { uploadSinglePDF, handleUploadError } = require('../middlewares/uploadMiddleware');

const router = express.Router();

/**
 * Validation rules cho analyze problem endpoint
 */
const validateAnalyzeProblem = [
  body('classLevel')
    .isInt({ min: 8, max: 12 })
    .withMessage('classLevel phải là số nguyên từ 8 đến 12'),
  
  body('subject')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('subject không được để trống')
    .isIn(['Toán', 'Vật lý', 'Hóa học', 'Sinh học'])
    .withMessage('subject phải là một trong: Toán, Vật lý, Hóa học, Sinh học'),
  
  body('currentTopic')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('currentTopic không được để trống')
    .isLength({ min: 3, max: 200 })
    .withMessage('currentTopic phải từ 3-200 ký tự'),
  
  body('problemText')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('problemText không được để trống')
    .isLength({ min: 10, max: 5000 })
    .withMessage('problemText phải từ 10-5000 ký tự')
];

/**
 * POST /api/analyze-problem
 * Phân tích đề bài học tập
 */
router.post(
  '/analyze-problem',
  validateAnalyzeProblem,
  analyzeProblemController.analyzeProblem.bind(analyzeProblemController)
);

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', analyzeProblemController.healthCheck.bind(analyzeProblemController));

// ============================================
// RAG (Retrieval-Augmented Generation) Routes
// ============================================

/**
 * Validation rules cho ask question endpoint
 */
const validateAskQuestion = [
  body('query')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('query không được để trống')
    .isLength({ min: 3, max: 1000 })
    .withMessage('query phải từ 3-1000 ký tự'),
  
  body('k')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('k phải là số nguyên từ 1 đến 10')
];

/**
 * POST /api/rag/upload
 * Upload và xử lý file PDF cho RAG
 */
router.post(
  '/rag/upload',
  uploadSinglePDF,
  handleUploadError,
  ragController.uploadPDF
);

/**
 * POST /api/rag/ask
 * Đặt câu hỏi về nội dung PDF đã upload
 */
router.post(
  '/rag/ask',
  validateAskQuestion,
  ragController.askQuestion
);

/**
 * DELETE /api/rag/clear
 * Xóa vector store hiện tại
 */
router.delete('/rag/clear', ragController.clearVectorStore);

/**
 * GET /api/rag/info
 * Lấy thông tin về vector store hiện tại
 */
router.get('/rag/info', ragController.getVectorStoreInfo);

module.exports = router;
