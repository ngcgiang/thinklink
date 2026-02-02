/**
 * RAG Service - Retrieval-Augmented Generation
 * 
 * Service này cung cấp chức năng:
 * 1. Đọc và xử lý file PDF
 * 2. Chia văn bản thành các chunks nhỏ
 * 3. Tạo embeddings và lưu vào vector store (in-memory)
 * 4. Tìm kiếm thông tin liên quan và trả lời câu hỏi bằng LLM
 * 
 * @author ThinkLink Team
 * @date 2026
 */

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const axios = require('axios');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');

// Biến lưu trữ vector store hiện tại (in-memory)
let currentVectorStore = null; // Array of {text, embedding}
let currentFileName = null;

/**
 * Tính TF-IDF score cho một từ trong document
 * TF (Term Frequency): số lần xuất hiện của từ / tổng số từ
 * IDF (Inverse Document Frequency): log(tổng docs / số docs chứa từ)
 * 
 * @param {string} term - Từ cần tính
 * @param {Array<string>} document - Document (array of words)
 * @param {Array<Array<string>>} allDocuments - Tất cả documents
 * @returns {number} TF-IDF score
 */
function calculateTFIDF(term, document, allDocuments) {
  // TF: Term Frequency
  const termCount = document.filter(word => word === term).length;
  const tf = termCount / document.length;

  // IDF: Inverse Document Frequency
  const docsWithTerm = allDocuments.filter(doc => doc.includes(term)).length;
  const idf = Math.log(allDocuments.length / (docsWithTerm + 1));

  return tf * idf;
}

/**
 * Tạo vector TF-IDF cho document
 * 
 * @param {string} text - Text cần vector hóa
 * @param {Array<string>} vocabulary - Danh sách từ vựng
 * @param {Array<Array<string>>} allDocuments - Tất cả documents
 * @returns {Array<number>} TF-IDF vector
 */
function createTFIDFVector(text, vocabulary, allDocuments) {
  const words = text.toLowerCase()
    .replace(/[^\w\sàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2); // Lọc từ có ít nhất 3 ký tự

  return vocabulary.map(term => calculateTFIDF(term, words, allDocuments));
}

/**
 * Tính độ tương đồng cosine giữa hai vectors
 * 
 * @param {Array<number>} vecA - Vector A
 * @param {Array<number>} vecB - Vector B
 * @returns {number} Cosine similarity (0-1)
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Gọi LLM để trả lời câu hỏi dựa trên context
 * Sử dụng Qwen2.5-72B-Instruct qua HuggingFace Router
 * 
 * @param {string} query - Câu hỏi
 * @param {Array<string>} contexts - Các đoạn context liên quan
 * @returns {Promise<string>} Câu trả lời từ LLM
 */
async function generateAnswer(query, contexts) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  const model = process.env.HUGGINGFACE_MODEL || 'Qwen/Qwen2.5-72B-Instruct';
  const apiUrl = process.env.HUGGINGFACE_API_URL || 'https://router.huggingface.co/v1/chat/completions';

  const systemPrompt = `Bạn là trợ lý AI thông minh. Hãy trả lời câu hỏi dựa trên thông tin được cung cấp.
Nếu thông tin không đủ để trả lời, hãy nói rõ điều đó.
Trả lời bằng tiếng Việt, ngắn gọn và chính xác.`;

  const contextText = contexts.join('\n\n---\n\n');
  const userPrompt = `THÔNG TIN TỪ TÀI LIỆU:
${contextText}

CÂU HỎI: ${query}

Hãy trả lời câu hỏi dựa trên thông tin trên.`;

  try {
    const response = await axios.post(
      apiUrl,
      {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    if (response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Không nhận được response từ LLM');
    }
  } catch (error) {
    if (error.response) {
      throw new Error(`Lỗi từ LLM: ${error.response.data.error || error.response.statusText}`);
    }
    throw new Error(`Không thể gọi LLM: ${error.message}`);
  }
}

/**
 * Đọc và parse file PDF thành text
 * 
 * @param {string} filePath - Đường dẫn tuyệt đối đến file PDF
 * @returns {Promise<string>} Nội dung text của PDF
 * @throws {Error} Nếu file không tồn tại hoặc không đọc được
 */
async function extractTextFromPDF(filePath) {
  try {
    // Kiểm tra file có tồn tại không
    if (!fs.existsSync(filePath)) {
      throw new Error(`File không tồn tại: ${filePath}`);
    }

    // Đọc file PDF dưới dạng buffer
    const dataBuffer = fs.readFileSync(filePath);
    
    // Parse PDF và lấy text
    const data = await pdf(dataBuffer);
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('PDF không chứa văn bản có thể đọc được');
    }

    console.log(`✓ Đọc thành công PDF: ${data.numpages} trang, ${data.text.length} ký tự`);
    
    return data.text;
  } catch (error) {
    console.error('Lỗi khi đọc PDF:', error.message);
    throw new Error(`Không thể đọc file PDF: ${error.message}`);
  }
}

/**
 * Chia văn bản thành các chunks nhỏ
 * Sử dụng RecursiveCharacterTextSplitter để tách văn bản một cách thông minh
 * 
 * @param {string} text - Văn bản cần chia
 * @param {number} chunkSize - Kích thước mỗi chunk (mặc định: 1000)
 * @param {number} chunkOverlap - Độ chồng lấp giữa các chunk (mặc định: 100)
 * @returns {Promise<Array<Document>>} Mảng các document chunks
 */
async function splitTextIntoChunks(text, chunkSize = 1000, chunkOverlap = 100) {
  try {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: chunkSize,
      chunkOverlap: chunkOverlap,
      separators: ['\n\n', '\n', '. ', ' ', ''], // Ưu tiên tách theo đoạn văn
    });

    const chunks = await textSplitter.createDocuments([text]);
    
    console.log(`✓ Chia văn bản thành ${chunks.length} chunks`);
    
    return chunks;
  } catch (error) {
    console.error('Lỗi khi chia văn bản:', error.message);
    throw new Error(`Không thể chia văn bản: ${error.message}`);
  }
}

/**
 * Tạo vector store từ các chunks văn bản
 * Sử dụng TF-IDF thay vì embeddings API để tránh phụ thuộc vào API bên ngoài
 * 
 * @param {Array<Document>} chunks - Mảng các document chunks
 * @returns {Promise<Array<Object>>} Vector store (array of {text, vector, words})
 */
async function createVectorStore(chunks) {
  try {
    console.log('⏳ Đang tạo TF-IDF vectors cho các chunks...');
    
    // Bước 1: Tokenize tất cả documents
    const allDocuments = chunks.map(chunk => {
      return chunk.pageContent
        .toLowerCase()
        .replace(/[^\w\sàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2);
    });

    // Bước 2: Tạo vocabulary (danh sách từ unique)
    const vocabularySet = new Set();
    allDocuments.forEach(doc => {
      doc.forEach(word => vocabularySet.add(word));
    });
    const vocabulary = Array.from(vocabularySet);
    
    console.log(`  Vocabulary size: ${vocabulary.length} từ unique`);

    // Bước 3: Tạo TF-IDF vector cho mỗi chunk
    const vectorStore = chunks.map((chunk, i) => {
      const vector = createTFIDFVector(chunk.pageContent, vocabulary, allDocuments);
      
      return {
        text: chunk.pageContent,
        vector: vector,
        words: allDocuments[i],
        metadata: chunk.metadata || {},
      };
    });
    
    console.log(`✓ Tạo TF-IDF vectors thành công cho ${vectorStore.length} chunks`);
    
    return {
      store: vectorStore,
      vocabulary: vocabulary,
      allDocuments: allDocuments,
    };
  } catch (error) {
    console.error('Lỗi khi tạo vector store:', error.message);
    throw new Error(`Không thể tạo vector store: ${error.message}`);
  }
}

/**
 * Hàm chính: Xử lý và lưu trữ file PDF vào vector database
 * 
 * @param {string} filePath - Đường dẫn tuyệt đối đến file PDF
 * @param {Object} options - Tùy chọn cấu hình
 * @param {number} options.chunkSize - Kích thước chunk (mặc định: 1000)
 * @param {number} options.chunkOverlap - Độ overlap (mặc định: 100)
 * @returns {Promise<Object>} Kết quả xử lý với thông tin chi tiết
 */
async function ingestPDF(filePath, options = {}) {
  try {
    console.log('🚀 Bắt đầu xử lý PDF...');
    
    const { chunkSize = 1000, chunkOverlap = 100 } = options;

    // Bước 1: Đọc text từ PDF
    const text = await extractTextFromPDF(filePath);

    // Bước 2: Chia text thành chunks
    const chunks = await splitTextIntoChunks(text, chunkSize, chunkOverlap);

    // Bước 3: Tạo TF-IDF vectors và lưu vào vector store
    const vectorStoreData = await createVectorStore(chunks);

    // Lưu vector store vào memory
    currentVectorStore = vectorStoreData;
    currentFileName = path.basename(filePath);

    console.log('✅ Xử lý PDF hoàn tất!');

    return {
      success: true,
      message: 'PDF đã được xử lý và lưu trữ thành công',
      details: {
        fileName: currentFileName,
        totalChunks: chunks.length,
        vectorizedChunks: vectorStoreData.store.length,
        vocabularySize: vectorStoreData.vocabulary.length,
        chunkSize: chunkSize,
        chunkOverlap: chunkOverlap,
        textLength: text.length,
      },
    };
  } catch (error) {
    console.error('❌ Lỗi trong quá trình ingest PDF:', error);
    
    return {
      success: false,
      message: 'Không thể xử lý PDF',
      error: error.message,
    };
  }
}

/**
 * Truy vấn và trả lời câu hỏi dựa trên nội dung PDF đã được ingest
 * Sử dụng RAG pattern: Retrieve -> Augment -> Generate
 * 
 * @param {string} query - Câu hỏi của người dùng
 * @param {Object} options - Tùy chọn cấu hình
 * @param {number} options.k - Số lượng chunks liên quan cần retrieve (mặc định: 4)
 * @returns {Promise<Object>} Kết quả trả lời với context và sources
 */
async function askQuestion(query, options = {}) {
  try {
    console.log('🔍 Đang xử lý câu hỏi:', query);

    // Kiểm tra đã có vector store chưa
    if (!currentVectorStore || !currentVectorStore.store || currentVectorStore.store.length === 0) {
      return {
        success: false,
        message: 'Chưa có PDF nào được tải lên. Vui lòng upload PDF trước khi đặt câu hỏi.',
      };
    }

    const { k = 4 } = options;

    // Bước 1: Tạo TF-IDF vector cho query
    console.log('⏳ Đang tạo vector cho câu hỏi...');
    const queryVector = createTFIDFVector(
      query, 
      currentVectorStore.vocabulary, 
      currentVectorStore.allDocuments
    );

    // Bước 2: Tìm các chunks tương đồng nhất
    console.log('⏳ Đang tìm kiếm thông tin liên quan...');
    const similarities = currentVectorStore.store.map((item) => ({
      text: item.text,
      metadata: item.metadata,
      similarity: cosineSimilarity(queryVector, item.vector),
    }));

    // Sort theo độ tương đồng giảm dần và lấy top k
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topResults = similarities.slice(0, Math.min(k, similarities.length));

    console.log(`✓ Tìm thấy ${topResults.length} đoạn văn liên quan`);

    // Bước 3: Tạo context từ các chunks
    const contexts = topResults.map(r => r.text);

    // Bước 4: Gọi LLM để generate answer
    console.log('⏳ Đang generate câu trả lời...');
    const answer = await generateAnswer(query, contexts);

    console.log('✅ Trả lời thành công!');

    // Format response
    return {
      success: true,
      query: query,
      answer: answer,
      sources: topResults.map((result, index) => ({
        id: index + 1,
        content: result.text.substring(0, 200) + (result.text.length > 200 ? '...' : ''),
        similarity: result.similarity.toFixed(4),
        metadata: result.metadata,
      })),
      fileName: currentFileName,
    };
  } catch (error) {
    console.error('❌ Lỗi khi trả lời câu hỏi:', error);
    
    return {
      success: false,
      message: 'Không thể trả lời câu hỏi',
      error: error.message,
    };
  }
}

/**
 * Xóa vector store hiện tại khỏi memory
 * Sử dụng khi cần reset hoặc upload PDF mới
 */
function clearVectorStore() {
  currentVectorStore = null;
  currentFileName = null;
  console.log('🗑️ Đã xóa vector store khỏi memory');
  
  return {
    success: true,
    message: 'Vector store đã được xóa',
  };
}

/**
 * Lấy thông tin về vector store hiện tại
 * 
 * @returns {Object} Thông tin về file PDF đang được load
 */
function getVectorStoreInfo() {
  return {
    hasVectorStore: currentVectorStore !== null,
    fileName: currentFileName,
  };
}

module.exports = {
  ingestPDF,
  askQuestion,
  clearVectorStore,
  getVectorStoreInfo,
};
