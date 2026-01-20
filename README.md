# 🧠 ThinkLink - EdTech Problem Analysis Platform

**ThinkLink** là nền tảng phân tích đề bài học tập thông minh sử dụng AI (LLM), giúp học sinh lớp 8-12 hiểu sâu hơn về các bài toán thông qua trực quan hóa và phân tích chi tiết.

## 🌟 Tính năng chính

- **🔍 Phân tích đề bài thông minh**: Sử dụng Qwen 2.5-72B-Instruct LLM để phân tích ngữ nghĩa và cấu trúc đề bài
- **📊 Trực quan hóa bài toán**: Hiển thị đồ thị tương tác với các điểm chính, giả thiết, và ẩn số
- **🎯 Làm nổi bật thông tin quan trọng**: Tự động highlight các từ khóa và dữ liệu trong đề bài
- **🧮 Hỗ trợ công thức LaTeX**: Render các công thức toán học và vật lý một cách chuyên nghiệp
- **📐 Đồ thị tương tác**: Sử dụng React Flow để tạo đồ thị cascading với khả năng zoom, drag và explore

## 🏗️ Kiến trúc dự án

```
thinklink/
├── BE/                 # Backend API (Node.js + Express)
│   ├── controllers/    # Controllers xử lý logic
│   ├── services/       # Services tương tác với Hugging Face API
│   ├── routes/         # API routes
│   ├── middlewares/    # Middleware (error, logging, CORS)
│   └── utils/          # Utility functions
│
└── FE/                 # Frontend (React + Vite)
    ├── src/
    │   ├── components/ # React components
    │   ├── services/   # API client
    │   └── utils/      # Utility functions
    └── public/         # Static assets
```

## 🚀 Tech Stack

### Backend
- **Runtime**: Node.js v16+
- **Framework**: Express.js
- **AI/ML**: Hugging Face Inference API (Qwen/Qwen2.5-72B-Instruct)
- **HTTP Client**: Axios
- **Validation**: Express Validator

### Frontend
- **Framework**: React 18.3
- **Build Tool**: Vite
- **UI Library**: 
  - Lucide React (icons)
  - Framer Motion (animations)
  - React Flow (graph visualization)
  - Dagre (graph layout)
- **Styling**: Tailwind CSS + PostCSS
- **Math Rendering**: KaTeX

## 📋 Yêu cầu hệ thống

- Node.js >= 16.x
- npm hoặc yarn
- Tài khoản Hugging Face (để lấy API key)

## ⚙️ Cài đặt và chạy dự án

### 1. Clone repository

```bash
git clone <repository-url>
cd thinklink
```

### 2. Cài đặt Backend

```bash
cd BE
npm install

# Tạo file .env từ template
cp .env.example .env
```

Thêm Hugging Face API key vào file `.env`:
```env
HUGGINGFACE_API_KEY=hf_your_api_key_here
PORT=3000
```

**Lấy API key**:
1. Truy cập https://huggingface.co/
2. Đăng ký/Đăng nhập
3. Vào Settings → Access Tokens
4. Tạo token mới với quyền "Read"

Chạy server:
```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

### 3. Cài đặt Frontend

```bash
cd FE
npm install

# Tạo file .env (nếu cần)
# Thêm VITE_API_BASE_URL nếu backend không chạy tại localhost:3000
```

Chạy frontend:
```bash
# Development mode
npm run dev

# Build production
npm run build

# Preview production build
npm run preview
```

Frontend sẽ chạy tại: `http://localhost:5173`

## 🎮 Cách sử dụng

1. Mở trình duyệt và truy cập `http://localhost:5173`
2. Nhập thông tin:
   - **Lớp**: Chọn lớp từ 8-12
   - **Môn học**: Ví dụ: Toán, Vật lý, Hóa học
   - **Chủ đề**: Chủ đề bài học hiện tại
   - **Đề bài**: Nhập đầy đủ nội dung đề bài
3. Nhấn **"Phân tích"**
4. Xem kết quả:
   - **Tóm tắt**: Tóm tắt ngắn gọn về đề bài
   - **Các điểm chính**: Thông tin quan trọng được trích xuất
   - **Ẩn số**: Các đại lượng cần tìm
   - **Đồ thị trực quan**: Biểu diễn quan hệ giữa các thành phần

## 📁 API Endpoints

### `POST /api/analyze-problem`
Phân tích đề bài học tập

**Request Body:**
```json
{
  "classLevel": 10,
  "subject": "Vật lý",
  "currentTopic": "Chuyển động thẳng biến đổi đều",
  "problemText": "Một vật được thả rơi tự do từ độ cao h. Sau 5 giây vật chạm đất. Tính quãng đường và vận tốc khi chạm đất."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": "Bài toán rơi tự do...",
    "key_points": [
      {
        "content": "v0 = 0 m/s",
        "level": 2,
        "source_text": "thả rơi tự do",
        "explanation": "Từ khóa 'thả rơi' ngụ ý vận tốc ban đầu bằng 0"
      }
    ],
    "unknowns": ["Quãng đường s", "Vận tốc chạm đất v"]
  }
}
```

## 📚 Tài liệu bổ sung

- [BE/README.md](BE/README.md) - Hướng dẫn chi tiết về Backend API
- [BE/GUIDE.md](BE/GUIDE.md) - Hướng dẫn sử dụng và test API
- [BE/SETUP.md](BE/SETUP.md) - Hướng dẫn setup và cấu hình
- [BE/FE_INTEGRATION_GUIDE.md](BE/FE_INTEGRATION_GUIDE.md) - Hướng dẫn tích hợp FE-BE
- [FE/DEPENDENCIES_GUIDE.md](FE/DEPENDENCIES_GUIDE.md) - Hướng dẫn về dependencies
- [FE/GRAPH_REFACTOR_README.md](FE/GRAPH_REFACTOR_README.md) - Hướng dẫn về graph visualization

## 🐛 Debug & Testing

### Backend Testing
Sử dụng file `BE/test.http` với REST Client extension trong VS Code:
```bash
cd BE
# Mở file test.http và click "Send Request"
```

### Frontend Development
```bash
cd FE
npm run dev
# Mở browser console để xem logs
```

## 🤝 Đóng góp

Contributions, issues và feature requests đều được chào đón!

## 📝 License

ISC

## 👥 Tác giả

Dự án EdTech phục vụ học sinh THCS và THPT

---

**Lưu ý**: Đây là phiên bản development. Để deploy lên production, cần:
- Cấu hình CORS đúng domain
- Setup biến môi trường production
- Build frontend và serve static files
- Setup reverse proxy (nginx/apache)
- Enable HTTPS
- Monitoring và logging
