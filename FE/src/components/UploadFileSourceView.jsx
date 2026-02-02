import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Trash2, Info } from 'lucide-react';

/**
 * UploadFileSourceView - Giao diện upload tài liệu PDF cho admin
 * Route: /admin/upload
 */
function UploadFileSourceView() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [documentInfo, setDocumentInfo] = useState(null);

  // Load thông tin tài liệu hiện tại khi mount
  useEffect(() => {
    fetchDocumentInfo();
  }, []);

  /**
   * Lấy thông tin về tài liệu đang load
   */
  const fetchDocumentInfo = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/rag/info');
      const data = await response.json();
      if (data.success) {
        setDocumentInfo(data.data);
      }
    } catch (err) {
      console.error('Lỗi khi lấy thông tin tài liệu:', err);
    }
  };

  /**
   * Xử lý khi chọn file
   */
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Chỉ chấp nhận file PDF');
        setFile(null);
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File quá lớn. Kích thước tối đa là 10MB');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setUploadResult(null);
    }
  };

  /**
   * Upload file PDF
   */
  const handleUpload = async () => {
    if (!file) {
      setError('Vui lòng chọn file PDF');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('chunkSize', '1000');
    formData.append('chunkOverlap', '100');

    try {
      const response = await fetch('http://localhost:3000/api/rag/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadResult(data);
        setFile(null);
        // Reset file input
        document.getElementById('file-input').value = '';
        // Refresh document info
        await fetchDocumentInfo();
      } else {
        setError(data.message || 'Lỗi khi upload file');
      }
    } catch (err) {
      setError('Không thể kết nối đến server: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  /**
   * Xóa tài liệu hiện tại
   */
  const handleClearDocument = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa tài liệu hiện tại?')) {
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/rag/clear', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setUploadResult(null);
        setDocumentInfo(null);
        alert('Đã xóa tài liệu thành công');
      } else {
        setError(data.message || 'Lỗi khi xóa tài liệu');
      }
    } catch (err) {
      setError('Không thể kết nối đến server: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📚 Quản lý Tài liệu
          </h1>
          <p className="text-gray-600">
            Upload tài liệu PDF để hệ thống có thể tham khảo khi phân tích đề bài
          </p>
        </div>

        {/* Thông tin tài liệu hiện tại */}
        {documentInfo && documentInfo.hasVectorStore && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-800 mb-1">
                    Tài liệu đang hoạt động
                  </h3>
                  <p className="text-green-700">
                    <FileText className="w-4 h-4 inline mr-1" />
                    {documentInfo.fileName}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClearDocument}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-1 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa</span>
              </button>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Upload Tài liệu mới
          </h2>

          {/* File Input */}
          <div className="mb-6">
            <label
              htmlFor="file-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Chọn file PDF
            </label>
            <div className="flex items-center space-x-4">
              <label
                htmlFor="file-input"
                className="cursor-pointer inline-flex items-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
              >
                <Upload className="w-5 h-5 mr-2 text-gray-500" />
                <span className="text-gray-600">
                  {file ? file.name : 'Chọn file...'}
                </span>
              </label>
              <input
                id="file-input"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {file && (
                <div className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
              !file || uploading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
            }`}
          >
            {uploading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Đang xử lý...
              </span>
            ) : (
              'Upload và Xử lý'
            )}
          </button>

          {/* Thông tin hướng dẫn */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Lưu ý:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Chỉ chấp nhận file PDF</li>
                  <li>Kích thước tối đa: 10MB</li>
                  <li>Upload tài liệu mới sẽ thay thế tài liệu cũ</li>
                  <li>Hệ thống sẽ tự động tham khảo tài liệu khi phân tích đề bài</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Lỗi</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Result */}
        {uploadResult && uploadResult.success && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-start space-x-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-800 text-lg">
                  Upload thành công!
                </h3>
                <p className="text-gray-600">
                  Tài liệu đã được xử lý và sẵn sàng sử dụng
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Tên file</div>
                <div className="font-semibold text-gray-800">
                  {uploadResult.data.fileName}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Số chunks</div>
                <div className="font-semibold text-gray-800">
                  {uploadResult.data.totalChunks}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Vocabulary</div>
                <div className="font-semibold text-gray-800">
                  {uploadResult.data.vocabularySize} từ
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Độ dài text</div>
                <div className="font-semibold text-gray-800">
                  {uploadResult.data.textLength} ký tự
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            ← Quay về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}

export default UploadFileSourceView;
