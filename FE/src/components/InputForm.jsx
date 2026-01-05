import React from 'react';
import { BookOpen, Send, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const InputForm = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = React.useState({
    classLevel: 10,
    subject: 'Toán',
    currentTopic: '',
    problemText: ''
  });

  const [errors, setErrors] = React.useState({});

  const gradeLevels = [8, 9, 10, 11, 12];
  const subjects = ['Toán', 'Vật lý'];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentTopic.trim()) {
      newErrors.currentTopic = 'Vui lòng nhập chủ đề';
    } else if (formData.currentTopic.length < 3) {
      newErrors.currentTopic = 'Chủ đề phải có ít nhất 3 ký tự';
    }

    if (!formData.problemText.trim()) {
      newErrors.problemText = 'Vui lòng nhập đề bài';
    } else if (formData.problemText.length < 10) {
      newErrors.problemText = 'Đề bài phải có ít nhất 10 ký tự';
    } else if (formData.problemText.length > 5000) {
      newErrors.problemText = 'Đề bài không được vượt quá 5000 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-lg">
          <BookOpen className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Phân Tích Đề Bài</h2>
          <p className="text-sm text-gray-500">Nhập thông tin đề bài để AI phân tích</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grade Level & Subject Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Grade Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Khối Lớp
            </label>
            <select
              value={formData.classLevel}
              onChange={(e) => handleChange('classLevel', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={isLoading}
            >
              {gradeLevels.map(level => (
                <option key={level} value={level}>
                  Lớp {level}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Môn Học
            </label>
            <div className="grid grid-cols-2 gap-2">
              {subjects.map(subject => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => handleChange('subject', subject)}
                  disabled={isLoading}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    formData.subject === subject
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Topic Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chủ Đề / Bài Học
          </label>
          <input
            type="text"
            value={formData.currentTopic}
            onChange={(e) => handleChange('currentTopic', e.target.value)}
            placeholder="Ví dụ: Phương trình bậc hai, Chuyển động tròn đều..."
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.currentTopic ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.currentTopic && (
            <p className="mt-1 text-sm text-red-600">{errors.currentTopic}</p>
          )}
        </div>

        {/* Problem Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Đề Bài
          </label>
          <textarea
            value={formData.problemText}
            onChange={(e) => handleChange('problemText', e.target.value)}
            placeholder="Nhập hoặc dán đề bài cần phân tích..."
            rows={8}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
              errors.problemText ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.problemText ? (
              <p className="text-sm text-red-600">{errors.problemText}</p>
            ) : (
              <p className="text-sm text-gray-500">
                {formData.problemText.length} / 5000 ký tự
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: isLoading ? 1 : 1.02 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
          className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang phân tích...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Phân Tích Đề Bài
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default InputForm;
