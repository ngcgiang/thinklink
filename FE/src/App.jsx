import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, RefreshCw, Sparkles } from 'lucide-react';
import InputForm from './components/InputForm';
import ProblemVisualizer from './components/ProblemVisualizer';
import { analyzeProblem } from './services/mockApi';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await analyzeProblem(formData);
      
      if (response.success) {
        setAnalysisResult(response.data);
        setSubmittedData(formData);
        
        // Scroll to results
        setTimeout(() => {
          document.getElementById('results-section')?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }, 100);
      } else {
        setError(response.message || 'Có lỗi xảy ra khi phân tích');
      }
    } catch (err) {
      setError('Không thể kết nối đến server. Vui lòng thử lại.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setSubmittedData(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ThinkLink
                </h1>
                <p className="text-sm text-gray-500">AI Problem Analysis</p>
              </div>
            </div>
            
            {analysisResult && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="font-medium">Phân tích mới</span>
              </motion.button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        {!analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Powered by AI</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
              Phân Tích Đề Bài Thông Minh
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Công cụ AI giúp bạn hiểu rõ đề bài, phân tích dữ kiện và xây dựng lộ trình giải quyết vấn đề
            </p>
          </motion.div>
        )}

        {/* Input Form Section */}
        {!analysisResult && (
          <div className="mb-8">
            <InputForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        )}

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 max-w-4xl mx-auto"
            >
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="p-4 bg-blue-100 rounded-full mb-4"
            >
              <Brain className="w-12 h-12 text-blue-600" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Đang phân tích đề bài...
            </h3>
            <p className="text-gray-500">AI đang xử lý và phân tích thông tin</p>
          </motion.div>
        )}

        {/* Results Section */}
        <AnimatePresence>
          {analysisResult && submittedData && (
            <motion.div
              id="results-section"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {/* Analysis Header */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-lg p-6 mb-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Sparkles className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Kết Quả Phân Tích</h2>
                    <p className="text-sm text-gray-500">
                      {submittedData.subject} - Lớp {submittedData.classLevel} - {submittedData.currentTopic}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Visualizer */}
              <ProblemVisualizer
                analysisData={analysisResult}
                problemText={submittedData.problemText}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 text-sm">
            © 2026 ThinkLink - AI-Powered Educational Analysis Tool
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

