/**
 * Upload Middleware - Xử lý file upload với Multer + Cloudinary
 * 
 * Middleware này sử dụng Multer + Cloudinary để:
 * 1. Xử lý file PDF upload
 * 2. Validate file type và size
 * 3. Upload trực tiếp lên Cloudinary (không lưu local)
 * 
 * @author ThinkLink Team
 * @date 2026
 */

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cấu hình Cloudinary từ .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('✓ Cloudinary configured:', process.env.CLOUDINARY_CLOUD_NAME);

/**
 * Cấu hình Cloudinary storage cho Multer
 * - folder: Thư mục trên Cloudinary
 * - resource_type: raw (cho PDF files)
 * - allowed_formats: Chỉ chấp nhận PDF
 */
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'thinklink-rag-documents',
    resource_type: 'raw', // Quan trọng: 'raw' cho PDF files
    allowed_formats: ['pdf'],
    public_id: (req, file) => {
      // Tạo tên file unique
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const basename = file.originalname.replace('.pdf', '');
      return `${basename}-${uniqueSuffix}`;
    },
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
