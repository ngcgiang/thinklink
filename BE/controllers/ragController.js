/**
 * RAG Controller - Xử lý các request liên quan đến RAG (PDF Upload & Question Answering)
 * 
 * Controller này cung cấp các endpoints:
 * 1. POST /api/rag/upload - Upload PDF và xử lý
 * 2. POST /api/rag/ask - Đặt câu hỏi về PDF đã upload
 * 3. DELETE /api/rag/clear - Xóa vector store hiện tại
 * 4. GET /api/rag/info - Lấy thông tin về PDF đang load
 * 
 * @author ThinkLink Team
 * @date 2026
 */

const fs = require('fs');
const path = require('path');
const ragService = require('../services/ragService');
const { validationResult } = require('express-validator');

/**
 * Controller xử lý upload PDF
 * 
 * @param {Object} req - Express request object (có chứa file upload)
 * @param {Object} res - Express response object
 * 
 * Request body:
 * - file: PDF file (multipart/form-data)
 * - chunkSize: (optional) Kích thước chunk, mặc định 1000
 * - chunkOverlap: (optional) Độ overlap, mặc định 100
 * 
 * Response:
 * {
 *   success: true,
 *   message: "PDF đã được xử lý thành công",
 *   data: {
 *     fileName: "document.pdf",
 *     totalChunks: 45,
 *     chunkSize: 1000,
 *     ...
 *   }
 * }
 */
async function uploadPDF(req, res) {
  try {
    // Kiểm tra xem có file được upload không
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy file PDF. Vui lòng upload file.',
      });
    }

    // Kiểm tra file type
    if (req.file.mimetype !== 'application/pdf') {
      // Xóa file đã upload
      fs.unlinkSync(req.file.path);
      
      return res.status(400).json({
        success: false,
        message: 'File không hợp lệ. Chỉ chấp nhận file PDF.',
      });
    }

    console.log('📄 File PDF đã upload:', req.file.originalname);

    // Lấy options từ request body
    const chunkSize = parseInt(req.body.chunkSize) || 1000;
    const chunkOverlap = parseInt(req.body.chunkOverlap) || 100;

    // Validate chunk size và overlap
    if (chunkSize < 100 || chunkSize > 5000) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'chunkSize phải trong khoảng 100-5000',
      });
    }

    if (chunkOverlap < 0 || chunkOverlap >= chunkSize) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'chunkOverlap phải nhỏ hơn chunkSize và lớn hơn 0',
      });
    }

    // Gọi service để xử lý PDF
    const result = await ragService.ingestPDF(req.file.path, {
      chunkSize,
      chunkOverlap,
    });

    // Xóa file tạm sau khi đã xử lý xong
    try {
      fs.unlinkSync(req.file.path);
      console.log('🗑️ Đã xóa file tạm');
    } catch (err) {
      console.warn('⚠️ Không thể xóa file tạm:', err.message);
    }

    // Trả về kết quả
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.details,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('❌ Lỗi trong uploadPDF controller:', error);

    // Xóa file nếu có lỗi
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.warn('⚠️ Không thể xóa file tạm khi lỗi:', err.message);
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý PDF',
      error: error.message,
    });
  }
}

/**
 * Controller xử lý câu hỏi về PDF
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * 
 * Request body:
 * {
 *   query: "Câu hỏi của người dùng",
 *   k: 4 (optional - số lượng chunks liên quan)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     query: "...",
 *     answer: "...",
 *     sources: [...],
 *     fileName: "document.pdf"
 *   }
 * }
 */
async function askQuestion(req, res) {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu đầu vào không hợp lệ',
        errors: errors.array(),
      });
    }

    const { query, k } = req.body;

    // Kiểm tra query có rỗng không
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Câu hỏi không được để trống',
      });
    }

    console.log('💬 Nhận câu hỏi:', query);

    // Gọi service để trả lời câu hỏi
    const result = await ragService.askQuestion(query, {
      k: k || 4,
    });

    // Trả về kết quả
    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error('❌ Lỗi trong askQuestion controller:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý câu hỏi',
      error: error.message,
    });
  }
}

/**
 * Controller xóa vector store hiện tại
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function clearVectorStore(req, res) {
  try {
    const result = ragService.clearVectorStore();
    
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('❌ Lỗi trong clearVectorStore controller:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa vector store',
      error: error.message,
    });
  }
}

/**
 * Controller lấy thông tin về vector store hiện tại
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getVectorStoreInfo(req, res) {
  try {
    const info = ragService.getVectorStoreInfo();
    
    return res.status(200).json({
      success: true,
      data: info,
    });
  } catch (error) {
    console.error('❌ Lỗi trong getVectorStoreInfo controller:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin vector store',
      error: error.message,
    });
  }
}

module.exports = {
  uploadPDF,
  askQuestion,
  clearVectorStore,
  getVectorStoreInfo,
};
