# ThinkLink API - EdTech Problem Analysis

API backend cho ứng dụng phân tích đề bài học sinh lớp 8-12 sử dụng LLM.

## Tech Stack
- Node.js & Express.js
- Hugging Face Inference API (Qwen/Qwen2.5-72B-Instruct)
- Axios

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your Hugging Face API key to `.env` file

4. Start server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### POST /api/analyze-problem
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
    "summary": "Tóm tắt đề bài",
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
