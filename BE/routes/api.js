const express = require('express');
const { body } = require('express-validator');
const analyzeProblemController = require('../controllers/analyzeProblemController');

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

module.exports = router;
