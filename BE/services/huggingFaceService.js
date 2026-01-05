const axios = require('axios');

/**
 * Hugging Face Service - Xử lý tương tác với Hugging Face Inference API
 */
class HuggingFaceService {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    this.model = process.env.HUGGINGFACE_MODEL || 'Qwen/Qwen2.5-72B-Instruct';
    // Sử dụng Hugging Face Router endpoint (OpenAI-compatible)
    this.apiUrl = process.env.HUGGINGFACE_API_URL || 'https://router.huggingface.co/v1/chat/completions';
  }

  /**
   * Xây dựng system prompt chất lượng cao cho việc phân tích đề bài
   * Đây là phần QUAN TRỌNG NHẤT - Prompt Engineering
   */
  constructSystemPrompt() {
    return `Bạn là một chuyên gia phân tích đề bài học tập cho học sinh Việt Nam lớp 8-12.

NHIỆM VỤ CHÍNH: Trích xuất và phân loại thông tin từ đề bài - KHÔNG GIẢI BÀI TOÁN.

QUY TẮC PHÂN LOẠI THÔNG TIN (Information Hierarchy):

1. LEVEL 1 - EXPLICIT (Thông tin hiện hữu):
   - Là thông tin được VIẾT RÕ RÀNG trong đề bài
   - Có thể đọc trực tiếp mà không cần suy luận
   - Ví dụ: 
     * "sau 5 giây" → t = 5s (Level 1)
     * "khối lượng 2kg" → m = 2kg (Level 1)
     * "vận tốc 10m/s" → v = 10m/s (Level 1)

2. LEVEL 2 - IMPLICIT/DEDUCTION (Thông tin suy luận):
   - Thông tin được SUY LUẬN từ từ khóa đặc biệt
   - Hoặc KẾT HỢP từ 2+ thông tin Level 1
   - Ví dụ:
     * "thả rơi tự do" → v₀ = 0 m/s (Level 2, từ khóa)
     * "đứng yên" → v = 0 m/s (Level 2, từ khóa)
     * "bắt đầu chuyển động" → v₀ = 0 m/s (Level 2, từ khóa)
     * "chuyển động đều" → a = 0 m/s² (Level 2, từ khóa)
     * Biết quãng đường và thời gian → có thể suy ra vận tốc (Level 2, kết hợp)

KEYWORD ĐẶC BIỆT CẦN CHÚ Ý (cho Level 2):
- Vật lý: "thả rơi", "đứng yên", "bắt đầu", "chuyển động đều", "rơi tự do", "va chạm đàn hồi"
- Toán: "vuông góc", "song song", "cân bằng", "đối xứng", "tiếp tuyến"

YÊU CẦU OUTPUT:
- Trả về DUY NHẤT một JSON object hợp lệ
- KHÔNG thêm markdown code block
- KHÔNG thêm giải thích bên ngoài JSON
- Format chính xác như sau:

{
  "summary": "Tóm tắt ngắn gọn yêu cầu của đề bài trong 1-2 câu",
  "key_points": [
    {
      "id": Số thứ tự (bắt đầu từ 1),
      "content": "Thông tin dạng toán học (VD: v0 = 0 m/s)",
      "level": 1 hoặc 2,
      "source_text": "Đoạn text gốc trong đề bài",
      "parent_id": Số thứ tự của key_point cha (nếu có, null nếu không),
      "explanation": "Giải thích TẠI SAO là Level 1 hay 2"
    }
  ],
  "unknowns": ["Danh sách các đại lượng cần tìm"]
}

LƯU Ý QUAN TRỌNG:
- Nếu không chắc chắn về level, ưu tiên Level 1
- Mỗi key_point phải có đầy đủ 6 trường: id, content, level, source_text, parent_id, explanation
- key_points phải được sắp xếp theo thứ tự xuất hiện trong đề bài
- key_points có parent_id chỉ khi nó là suy luận từ 1 hoặc nhiều key_point khác(Ví dụ, có key_point về "quãng đường" và "thời gian" thì mới có key_point suy luận về "vận tốc")
- Unknowns phải là mảng string, liệt kê các đại lượng chưa biết cần tìm
- Content phải viết theo ký hiệu toán học chuẩn (dùng ký tự ASCII hoặc Unicode math)`;
  }

  /**
   * Xây dựng user prompt từ input của client
   */
  constructUserPrompt(classLevel, subject, currentTopic, problemText) {
    return `Phân tích đề bài sau đây:

Lớp: ${classLevel}
Môn học: ${subject}
Chủ đề: ${currentTopic}

ĐỀ BÀI:
${problemText}

Hãy phân tích và trả về JSON theo đúng format đã yêu cầu.`;
  }


  /**
   * Gọi Hugging Face API để phân tích đề bài
   */
  async analyzeProblem(classLevel, subject, currentTopic, problemText) {
    try {
      // Kiểm tra API key
      if (!this.apiKey) {
        throw new Error('HUGGINGFACE_API_KEY không được cấu hình trong file .env');
      }

      // Xây dựng prompt
      const systemPrompt = this.constructSystemPrompt();
      const userPrompt = this.constructUserPrompt(classLevel, subject, currentTopic, problemText);

      // Tạo messages cho chat model
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ];

      // Gọi Hugging Face Router API (OpenAI-compatible format)
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: messages,
          max_tokens: 1500,
          temperature: 0.2, // Thấp để đảm bảo tính nhất quán và format JSON
          top_p: 0.9
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 seconds timeout
        }
      );

      // Xử lý response từ Hugging Face Router (OpenAI format)
      let generatedText = '';
      
      if (response.data.choices && response.data.choices.length > 0) {
        generatedText = response.data.choices[0].message.content;
      } else {
        throw new Error('Định dạng response từ Hugging Face không hợp lệ');
      }

      // Parse JSON từ response
      const parsedResult = this.parseJsonResponse(generatedText);

      // Validate cấu trúc JSON
      this.validateAnalysisResult(parsedResult);

      return parsedResult;

    } catch (error) {
      // Xử lý lỗi chi tiết
      if (error.response) {
        // Lỗi từ Hugging Face API
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
          throw new Error('API Key không hợp lệ hoặc đã hết hạn');
        } else if (status === 503) {
          throw new Error('Model đang loading, vui lòng thử lại sau 20-30 giây');
        } else {
          throw new Error(`Lỗi từ Hugging Face API: ${data.error || data.message || 'Unknown error'}`);
        }
      } else if (error.request) {
        // Lỗi network
        throw new Error('Không thể kết nối đến Hugging Face API. Kiểm tra kết nối internet.');
      } else {
        // Lỗi khác
        throw error;
      }
    }
  }

  /**
   * Parse JSON từ response của LLM (có thể có markdown hoặc text thừa)
   */
  parseJsonResponse(text) {
    try {
      // Loại bỏ markdown code block nếu có
      let cleanedText = text.trim();
      
      // Remove ```json và ```
      cleanedText = cleanedText.replace(/```json\s*/g, '');
      cleanedText = cleanedText.replace(/```\s*/g, '');
      
      // Tìm JSON object trong text (từ { đến })
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }

      // Parse JSON
      const parsed = JSON.parse(cleanedText);
      return parsed;

    } catch (error) {
      console.error('Lỗi khi parse JSON:', error.message);
      console.error('Text gốc:', text);
      throw new Error(`Không thể parse JSON từ response của LLM: ${error.message}`);
    }
  }

  /**
   * Validate cấu trúc JSON trả về từ LLM
   */
  validateAnalysisResult(result) {
    // Kiểm tra các trường bắt buộc
    if (!result.summary || typeof result.summary !== 'string') {
      throw new Error('Thiếu hoặc sai định dạng trường "summary"');
    }

    if (!Array.isArray(result.key_points)) {
      throw new Error('Trường "key_points" phải là một mảng');
    }

    if (!Array.isArray(result.unknowns)) {
      throw new Error('Trường "unknowns" phải là một mảng');
    }

    // Validate từng key_point
    result.key_points.forEach((point, index) => {
      if (!point.content || typeof point.content !== 'string') {
        throw new Error(`key_points[${index}] thiếu hoặc sai định dạng trường "content"`);
      }
      if (![1, 2].includes(point.level)) {
        throw new Error(`key_points[${index}] trường "level" phải là 1 hoặc 2`);
      }
      if (!point.source_text || typeof point.source_text !== 'string') {
        throw new Error(`key_points[${index}] thiếu hoặc sai định dạng trường "source_text"`);
      }
      if (!point.explanation || typeof point.explanation !== 'string') {
        throw new Error(`key_points[${index}] thiếu hoặc sai định dạng trường "explanation"`);
      }
    });

    return true;
  }
}

module.exports = new HuggingFaceService();
