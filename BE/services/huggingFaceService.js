const axios = require('axios');
const ragService = require('./ragService');

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
    
    MỤC TIÊU: Phân rã đề bài thành dữ liệu, xác định mối liên hệ và XÂY DỰNG CÂY SUY LUẬN (Deduction Tree) để tìm ra các ẩn số sâu hơn. KHÔNG GIẢI RA KẾT QUẢ SỐ CUỐI CÙNG.

    HỆ THỐNG PHÂN CẤP THÔNG TIN (Logic Đa Tầng):

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
        * "Khởi hành" / "Thả rơi" -> v0 = 0.

    3. LEVEL 3 - DERIVABLE (Nút kết quả trung gian):
       - Là nút con (child node) được tính toán từ các nút cha (parent nodes).
       - Không tính giá trị của đại lượng này.
       - Đây là phần QUAN TRỌNG NHẤT.
       - Là các đại lượng được tính từ L1, L2 HOẶC TỪ CÁC L3 KHÁC.
       - Cơ chế "Deep Linking": Nếu tính được đại lượng A (L3), hãy dùng A kết hợp với dữ liệu cũ để tìm đại lượng B (L3 tiếp theo).
       - Ví dụ logic: 
         + Bước 1: Có Lực (F) và Khối lượng (m) -> Suy ra Gia tốc (a). (Đây là L3 cấp 1).
         + Bước 2: Có Gia tốc (a - vừa tìm được) và Thời gian (t - L1) -> Suy ra Vận tốc (v). (Đây là L3 cấp 2).
       - Dependencies: Danh sách ID của các nút cha (L1, L2 hoặc L3 trước đó).
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
          "value": "Giá trị. Nếu là số giữ nguyên (VD: 5). Nếu là công thức/biến phải có $ (VD: $v_0 \cdot t$, $U_R$)",
          "unit": "Đơn vị (VD: $m/s$, $kg$) hãy dùng LaTeX nếu cần, nếu không có đơn vị trả về\"đvđ\"",
          "level": 1, 2 hoặc 3,
          "source_text": "Trích dẫn chính xác từ đề không tự ý viết hoa (chỉ viết hoa chữ cái đầu câu) (nếu Level 1, level 2), hoặc lý do suy luận (nếu Level 3) các công thức/biến trong text phải bọc $ (VD: Lực tác dụng $F = m \cdot a$)",
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
    8. Không được tạo vòng lặp vô tận (Circular Dependency).
    QUY TẮC SUY LUẬN SÂU (DEEP REASONING RULES):
    1. QUÉT ĐỆ QUY (Recursive Scan): Sau khi xác định các biến L3 trực tiếp, hãy tự hỏi: "Với đại lượng mới này, mình có thể tính thêm được gì nữa hay không(chỉ cần có trong chương trình học của lớp là được)?".
    2. HƯỚNG MỤC TIÊU (Goal-Oriented): Chỉ suy luận các đại lượng L3 có thể có trong chương trình học. Tránh suy luận rác (từ công thức lớp trên).
    3. THỨ TỰ LOGIC: Trong mảng "key_points", các biến phụ thuộc (Con) phải nằm SAU các biến độc lập (Cha).
    4. KHÔNG VÒNG LẶP (DAG Only): Tuyệt đối không tạo tham chiếu vòng tròn (A cần B, B cần A). Đồ thị phải là Directed Acyclic Graph.
    5. ĐỊNH DANH (ID Naming): Nên đặt ID thể hiện thứ tự suy luận (VD: L1_m, L1_F, L3_a, L3_v) để dễ trace.`;
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
   * Xây dựng user prompt với thông tin từ tài liệu (nếu có)
   */
  async constructUserPromptWithContext(classLevel, subject, currentTopic, problemText) {
    // Kiểm tra xem có tài liệu PDF nào đã được upload không
    const vectorStoreInfo = ragService.getVectorStoreInfo();
    
    if (!vectorStoreInfo.hasVectorStore) {
      // Không có tài liệu, dùng prompt thông thường
      return this.constructUserPrompt(classLevel, subject, currentTopic, problemText);
    }

    try {
      // Có tài liệu, thử tìm thông tin liên quan
      console.log('📚 Đang tìm kiếm thông tin liên quan trong tài liệu...');
      
      // Tạo query để tìm kiếm trong tài liệu
      const searchQuery = `${subject} ${currentTopic} ${problemText}`;
      const ragResult = await ragService.askQuestion(searchQuery, { k: 3 });

      if (ragResult.success && ragResult.sources && ragResult.sources.length > 0) {
        // Có thông tin liên quan từ tài liệu
        const contextText = ragResult.sources
          .map(source => source.content)
          .join('\n\n');

        console.log(`✓ Tìm thấy ${ragResult.sources.length} đoạn liên quan trong tài liệu`);

        return `PHÂN TÍCH ĐỀ BÀI SAU:
      - Cấp độ: Lớp ${classLevel} (Chương trình Giáo dục Việt Nam)
      - Môn: ${subject}
      - Chủ đề/Chương: ${currentTopic} (Rất quan trọng để chọn công thức phù hợp)

      NỘI DUNG ĐỀ:
      "${problemText}"

      THÔNG TIN THAM KHẢO TỪ TÀI LIỆU (${vectorStoreInfo.fileName}):
      ${contextText}
      
      LƯU Ý: Thông tin tham khảo từ tài liệu chỉ để hỗ trợ phân tích. Vẫn phải phân tích đề bài theo đúng yêu cầu và không được thêm thông tin không có trong đề.

      YÊU CẦU:
      1. Trích xuất Level 1, Level 2.
      2. Xác định Level 3 (các đại lượng ẩn có thể tính được từ dữ liệu đã có).
      3. Kiểm tra tính nhất quán của đơn vị (Unit consistency).
      4. Liệt kê các công thức SGK phù hợp với chủ đề "${currentTopic}".
      5. Nếu thông tin từ tài liệu có liên quan đến công thức hoặc khái niệm trong đề, có thể tham khảo nhưng không được tự ý thêm dữ liệu.
      
      Trả về JSON object hợp lệ.`;
      } else {
        // Không tìm thấy thông tin liên quan
        console.log('⚠️ Không tìm thấy thông tin liên quan trong tài liệu');
        return this.constructUserPrompt(classLevel, subject, currentTopic, problemText);
      }
    } catch (error) {
      // Lỗi khi tìm kiếm tài liệu, fallback về prompt thông thường
      console.warn('⚠️ Lỗi khi tìm kiếm tài liệu:', error.message);
      return this.constructUserPrompt(classLevel, subject, currentTopic, problemText);
    }
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

      // Xây dựng prompt (có thể có context từ tài liệu)
      const systemPrompt = this.constructSystemPrompt();
      const userPrompt = await this.constructUserPromptWithContext(classLevel, subject, currentTopic, problemText);

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
