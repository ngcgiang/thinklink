/**
 * Upload Middleware - Xử lý file upload với Multer
 * 
 * Middleware này sử dụng Multer để:
 * 1. Xử lý file PDF upload
 * 2. Validate file type và size
 * 3. Lưu file tạm thời vào thư mục uploads/
 * 
 * @author ThinkLink Team
 * @date 2026
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✓ Đã tạo thư mục uploads');
}

/**
 * Cấu hình storage cho Multer
 * - destination: Thư mục lưu file tạm
 * - filename: Tên file được tạo unique với timestamp
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Tạo tên file unique: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

/**
 * File filter để chỉ chấp nhận file PDF
 * 
 * @param {Object} req - Express request
 * @param {Object} file - File object từ Multer
 * @param {Function} cb - Callback function
 */
const fileFilter = (req, file, cb) => {
  // Kiểm tra mimetype
  if (file.mimetype === 'application/pdf') {
    cb(null, true); // Chấp nhận file
  } else {
    cb(new Error('Chỉ chấp nhận file PDF'), false); // Từ chối file
  }
};

/**
 * Cấu hình Multer với các giới hạn
 * - fileSize: Giới hạn 10MB
 * - files: Chỉ chấp nhận 1 file mỗi lần
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

/**
 * Middleware xử lý single file upload với field name 'pdf'
 * Sử dụng trong route: upload.single('pdf')
 */
const uploadSinglePDF = upload.single('pdf');

/**
 * Error handling middleware cho Multer
 * Xử lý các lỗi khi upload file
 * 
 * @param {Object} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    // Lỗi từ Multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File quá lớn. Kích thước tối đa là 10MB',
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Field name không hợp lệ. Sử dụng field "pdf"',
      });
    }

    return res.status(400).json({
      success: false,
      message: `Lỗi upload: ${err.message}`,
    });
  } else if (err) {
    // Lỗi từ file filter hoặc lỗi khác
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  
  next();
}

module.exports = {
  uploadSinglePDF,
  handleUploadError,
};
