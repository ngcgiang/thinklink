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
    return `Bạn là trợ lý AI chuyên gia phân tích đề bài Vật Lý và Toán học cho học sinh Việt Nam (Lớp 8-12).
    
    MỤC TIÊU: Phân rã đề bài thành các thành phần dữ liệu, xác định mối liên hệ giữa chúng và phát hiện các bẫy logic. KHÔNG GIẢI RA KẾT QUẢ CUỐI CÙNG.

    HỆ THỐNG PHÂN CẤP THÔNG TIN & LIÊN KẾT (Quan trọng):

    1. LEVEL 1 - EXPLICIT (Dữ liệu thô):
      - Thông tin có mặt chữ, con số cụ thể trong đề.
      - Là các nút lá (leaf nodes) của đồ thị.
      - Dependencies: Thường là rỗng [], vì chúng đến trực tiếp từ văn bản.
      - Ví dụ: "m = 2kg", "t = 10s", "ABC là tam giác vuông".

    2. LEVEL 2 - IMPLICIT (Suy luận ngữ nghĩa & Hằng số):
      - Từ khóa dẫn đến giá trị cụ thể hoặc hằng số vật lý/toán học.
      - Được sinh ra từ một từ khóa hoặc ngữ cảnh cụ thể.
      - Dependencies: Thường là rỗng vì được sinh ra từ từ khóa hoặc ngữ cảnh.
      - Ví dụ: 
        * "Rơi tự do" -> v0 = 0, a = g ≈ 10m/s².
        * "Nước" -> D = 1000kg/m³, c = 4200 J/kg.K.
        * "Tam giác đều" -> Các góc = 60 độ.

    3. LEVEL 3 - DERIVABLE (Nút kết quả trung gian):
       - Là nút con (child node) được tính toán từ các nút cha (parent nodes).
       - Dependencies: BẮT BUỘC phải chứa ID của các biến Level 1 hoặc Level 2 tham gia vào công thức.
       - Ví dụ: Tính vận tốc (p3) từ quãng đường (p1) và thời gian (p2) -> dependencies: ["p1", "p2"].

    YÊU CẦU OUTPUT (JSON Only):
    {
      "analysis_summary": "Tóm tắt đề bài và dạng bài (VD: Bài toán ném ngang, tìm tầm bay xa)",
      "unit_check": {
        "is_consistent": true/false,
        "warning": "Cảnh báo nếu thấy đơn vị không đồng nhất (VD: cm và m, giờ và giây)"
      },
      "key_points": [
        {
          "id": "p1",
          "symbol": "Ký hiệu đại lượng (VD: v, m, F, x)",
          "value": "Giá trị (số hoặc biểu thức) hoặc 'Chưa biết' nếu là biến cần tìm hoặc biến level 3",
          "unit": "Đơn vị (VD: m/s, kg)",
          "level": 1, 2 hoặc 3,
          "source_text": "Trích dẫn chính xác từ đề không tự ý viết hoa (nếu Level 1, level 2), hoặc lý do suy luận (nếu Level 3)",
          "related_formula": "Ghi công thức liên quan nếu là Level 3 (VD: F = m*a). Nếu không có thì để null."
          "dependencies": ["Danh sách ID các nút cha (parent nodes) liên quan"
        }
      ],
      "target_unknowns": ["Danh sách các biến chính đề bài yêu cầu tìm"],
      "suggested_formulas": [
        "Danh sách các công thức SGK cần thiết để giải bài này (LaTeX format)"
      ]
    }

    QUY TẮC AN TOÀN (ANTI-HALLUCINATION):
    1. Nếu đề bài mập mờ, hãy gắn cờ warning ở phần unit_check hoặc summary.
    2. Level 3 chỉ xuất hiện khi công thức liên kết là kiến thức cơ bản của lớp tương ứng.
    3. Tuyệt đối tuân thủ định dạng JSON, không markdown thừa.
    4. Sử dụng LaTeX cho các biểu thức toán học.
    5. Mọi Key Point ở Level 3 PHẢI có danh sách "dependencies" chứa các ID hợp lệ của các Key Point khác đã liệt kê trước đó.
    6. "dependencies" chính là hướng mũi tên của đồ thị: [Input IDs] -> [Output ID].
    7. Nếu thông tin độc lập, dependencies là mảng rỗng [].
    8. Không được tạo vòng lặp vô tận (Circular Dependency).`;
  }

  /**
   * Xây dựng user prompt từ input của client
   */
  constructUserPrompt(classLevel, subject, currentTopic, problemText) {
      return `PHÂN TÍCH ĐỀ BÀI SAU:
      - Cấp độ: Lớp ${classLevel} (Chương trình Giáo dục Việt Nam)
      - Môn: ${subject}
      - Chủ đề/Chương: ${currentTopic} (Rất quan trọng để chọn công thức phù hợp)

      NỘI DUNG ĐỀ:
      "${problemText}"

      YÊU CẦU:
      1. Trích xuất Level 1, Level 2.
      2. Xác định Level 3 (các đại lượng ẩn có thể tính được từ dữ liệu đã có).
      3. Kiểm tra tính nhất quán của đơn vị (Unit consistency).
      4. Liệt kê các công thức SGK phù hợp với chủ đề "${currentTopic}".
      
      Trả về JSON object hợp lệ.`;
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
    if (!result.analysis_summary || typeof result.analysis_summary !== 'string') {
      throw new Error('Thiếu hoặc sai định dạng trường "analysis_summary"');
    }

    // Kiểm tra unit_check
    if (!result.unit_check || typeof result.unit_check !== 'object') {
      throw new Error('Thiếu hoặc sai định dạng trường "unit_check"');
    }
    if (typeof result.unit_check.is_consistent !== 'boolean') {
      throw new Error('Trường "unit_check.is_consistent" phải là boolean');
    }
    if (result.unit_check.warning && typeof result.unit_check.warning !== 'string') {
      throw new Error('Trường "unit_check.warning" phải là string nếu có');
    }

    // Kiểm tra key_points
    if (!Array.isArray(result.key_points)) {
      throw new Error('Trường "key_points" phải là một mảng');
    }

    // Thu thập tất cả các ID hợp lệ để validate dependencies
    const validIds = new Set();
    
    // Validate từng key_point với cấu trúc mới
    result.key_points.forEach((point, index) => {
      if (!point.id || typeof point.id !== 'string') {
        throw new Error(`key_points[${index}] thiếu hoặc sai định dạng trường "id"`);
      }
      
      // Lưu ID để validate dependencies
      validIds.add(point.id);
      
      if (!point.symbol || typeof point.symbol !== 'string') {
        throw new Error(`key_points[${index}] thiếu hoặc sai định dạng trường "symbol"`);
      }
      if (point.value === undefined || point.value === null) {
        throw new Error(`key_points[${index}] thiếu trường "value"`);
      }
      if (!point.unit || typeof point.unit !== 'string') {
        throw new Error(`key_points[${index}] thiếu hoặc sai định dạng trường "unit"`);
      }
      if (![1, 2, 3].includes(point.level)) {
        throw new Error(`key_points[${index}] trường "level" phải là 1, 2 hoặc 3`);
      }
      if (!point.source_text || typeof point.source_text !== 'string') {
        throw new Error(`key_points[${index}] thiếu hoặc sai định dạng trường "source_text"`);
      }
      // related_formula có thể là null hoặc string
      if (point.related_formula !== null && typeof point.related_formula !== 'string') {
        throw new Error(`key_points[${index}] trường "related_formula" phải là string hoặc null`);
      }
      
      // Validate dependencies (bắt buộc)
      if (!Array.isArray(point.dependencies)) {
        throw new Error(`key_points[${index}] trường "dependencies" phải là một mảng`);
      }
      
      // Kiểm tra các phần tử trong dependencies phải là string
      point.dependencies.forEach((depId, depIndex) => {
        if (typeof depId !== 'string') {
          throw new Error(`key_points[${index}].dependencies[${depIndex}] phải là string (ID hợp lệ)`);
        }
      });
      
      // Quy tắc đặc biệt cho Level 3: phải có ít nhất 1 dependency
      if (point.level === 3 && point.dependencies.length === 0) {
        throw new Error(`key_points[${index}] là Level 3 nhưng không có dependencies. Level 3 phải được tính từ các nút khác.`);
      }
    });

    // Validate rằng tất cả dependencies trỏ đến các ID hợp lệ
    result.key_points.forEach((point, index) => {
      point.dependencies.forEach((depId) => {
        if (!validIds.has(depId)) {
          throw new Error(`key_points[${index}] có dependency "${depId}" không tồn tại trong danh sách key_points`);
        }
        
        // Kiểm tra không tự tham chiếu (self-reference)
        if (depId === point.id) {
          throw new Error(`key_points[${index}] không được tự tham chiếu chính nó (circular dependency)`);
        }
      });
    });

    // Kiểm tra target_unknowns
    if (!Array.isArray(result.target_unknowns)) {
      throw new Error('Trường "target_unknowns" phải là một mảng');
    }

    // Kiểm tra suggested_formulas
    if (!Array.isArray(result.suggested_formulas)) {
      throw new Error('Trường "suggested_formulas" phải là một mảng');
    }

    return true;
  }
}

module.exports = new HuggingFaceService();
